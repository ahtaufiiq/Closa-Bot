const supabase = require("../helpers/supabaseClient")
const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const FocusSessionMessage = require("../views/FocusSessionMessage");
const ChannelController = require("./ChannelController");
const Time = require("../helpers/time");
const RequestAxios = require("../helpers/axios");
const UserController = require("./UserController");
const MemberController = require("./MemberController");
const InfoUser = require("../helpers/InfoUser");
class FocusSessionController {

    static showModalAddNewProject(interaction){
        const [commandButton,userId] = interaction.customId.split('_')
        if(commandButton === 'addNewProject'){
			if(interaction.user.id !== userId) return interaction.reply({ephemeral:true,content:`Hi ${interaction.user}, you can't add someone else project.`})
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Add Project")
			.addComponents(
				new TextInputComponent().setCustomId('project').setLabel("New Project Name").setStyle("SHORT").setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }
    static async getAllProjects(userId){
        const data = await supabase.from("Projects")
            .select()
            .eq('UserId',userId)
            .order('updatedAt',{ascending:false})
        return data.body
    }

    static getFormattedMenu(projects){
        const menus = []

        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            menus.push({
                label:project.name,
                value:String(project.id)
            })
        }
        return menus
    }

    static countdownFocusSession(msgFocus,taskName,projectName,focusRoomUser,userId) {
        focusRoomUser[userId].msgIdFocusRecap = msgFocus.id
        focusRoomUser[userId].channelIdFocusRecap = msgFocus.channelId
        const timerFocus = setInterval(async () => {
            if(!focusRoomUser[userId]) return clearInterval(timerFocus)

            focusRoomUser[userId].totalTime++
            if(focusRoomUser[userId].isFocus) focusRoomUser[userId].focusTime++
            else {
                focusRoomUser[userId].breakCounter--
                focusRoomUser[userId].breakTime++
            }

            if(!focusRoomUser[userId].isFocus && focusRoomUser[userId].breakCounter === 0){
                focusRoomUser[userId].isFocus = true
                ChannelController.deleteMessage(msgFocus)
                return clearInterval(timerFocus)
            }
    
            if (!focusRoomUser[userId]) {
                msgFocus.edit(FocusSessionMessage.messageTimer(focusRoomUser[userId],taskName,projectName,userId,false))
                clearInterval(timerFocus)
            }else{
                msgFocus.edit(FocusSessionMessage.messageTimer(focusRoomUser[userId],taskName,projectName,userId))
            }
        }, 1000 * 60);
    }

    static async insertFocusSession(UserId,taskName,ProjectId,threadId){
        await supabase.from('FocusSessions')
        .delete()
        .eq('UserId',UserId)
        .is('session',null)

        await supabase.from('FocusSessions')
            .insert({
                threadId,taskName,ProjectId,UserId,
             })
    }

    static async getDetailFocusSession(userId){
        const data = await supabase.from('FocusSessions')
        .select('*,Projects(name)')
        .eq('UserId',userId)
        .is('session',null)
        .single()

        return data.body
    }

    static async updateTime(userId,totalTime,focusTime,breakTime){
        return await supabase.from("FocusSessions")
            .update({focusTime,breakTime,session:totalTime,updatedAt:new Date()})
            .eq('UserId',userId)
            .is('session',null)
            .order('createdAt',{ascending:false})
            .limit(1)
            .single()
    }

    static async getAllTodayTasks(userId){
        const date = new Date(Time.getTodayDateOnly())
        date.setHours(Time.minus7Hours(date.getHours()))
        return await supabase.from('FocusSessions')
            .select('*,Projects(name)')
            .gte('createdAt',date.toISOString())
            .eq(userId)
    }

    static async setCoworkingPartner(userId){
        supabase.from("FocusSessions")
            .select()
            .is('session',null)
            .neq('UserId',userId)
            .then(async data => {
                for (let i = 0; i < data.body.length; i++) {
                    const {UserId} = data.body[i];
                    const id = FocusSessionController.getFormatIdCoworkingPartner(userId,UserId)

                    await supabase.from('CoworkingPartners')
                        .upsert({
                            id,currentTime:null,currentSession:2,updatedAt:Time.getDate()
                        })
                }
            })
    }

    static async updateCoworkingPartner(userId){
        supabase.from("CoworkingPartners")
            .select()
            .like('id',`%${userId}%`)
            .gt('currentSession',0)
            .then(data => {
                for (let i = 0; i < data.body.length; i++) {
                    const {id,currentTime,totalTime,currentSession,updatedAt,lastCoworking,currentStreak,longestStreak} = data.body[i];
                    const date = Time.getDate(updatedAt)
                    const dateOnly = Time.getDateOnly(date)
                    if(currentSession === 2){
                        let coworkingStreak
                        if(Time.isValidCoworkingStreak(lastCoworking,dateOnly)){
                            if(lastCoworking !== dateOnly) coworkingStreak = currentStreak + 1
                            else coworkingStreak = currentStreak
                        }else{
                            coworkingStreak = 1
                        }
                        const totalTimeCoworking = Time.getGapTime(date).totalInMinutes
                        const value = {
                            currentTime : totalTimeCoworking,
                            totalTime: totalTime + totalTimeCoworking,
                            lastCoworking: Time.getTodayDateOnly(),
                            currentStreak: coworkingStreak,
                            currentSession: 1
                        }
                        
                        if(coworkingStreak > longestStreak){
                            value.longestStreak = coworkingStreak
                            value.endLongestStreak = Time.getTodayDateOnly()
                        }

                        supabase.from("CoworkingPartners")
                            .update(value)
                            .eq('id',id)
                            .then()
                    }else{
                        supabase.from("CoworkingPartners")
                            .update({
                                currentSession:0
                            })
                            .eq('id',id)
                            .then()
                    }

                }
            })
    }

    static async getAllCoworkingPartners(userId){
        return await supabase.from('CoworkingPartners')
            .select()
            .gte('lastCoworking',Time.getDateOnly(Time.getNextDate(-1)))
            .like('id',`%${userId}%`)
            .order('currentStreak',{ascending:false})
            .limit(5)
    }

    static async getRecapFocusSession(client,userId){
        const [dataCoworkingPartner, tasks, projectThisWeek,dataUser] = await Promise.all([
            FocusSessionController.getAllCoworkingPartners(userId),
            RequestAxios.get('voice/dailySummary/'+userId),
            RequestAxios.get('voice/weeklyProject/'+userId),
            UserController.getDetail(userId,'dailyWorkTime')
        ])

        const dailyWorkTime = dataUser.body?.dailyWorkTime
        let totalWork = 0
        let totalFocusTime = 0
        let totalBreakTime = 0
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            totalWork += +task.totalTime
            totalFocusTime += +task.focusTime
            totalBreakTime += +task.breakTime
        }
        const coworkingPartner = []

        for (let i = 0; i < dataCoworkingPartner.body.length; i++) {
            const partner = dataCoworkingPartner.body[i];
            const idPartner = FocusSessionController.getIdCoworkingPartner(userId,partner.id)
            const {user} = await MemberController.getMember(client,idPartner)
            coworkingPartner.push({
                avatar:InfoUser.getAvatar(user),
                streak: partner.currentStreak
            })
        }

        return {
            dailyWorkTime,totalWork,totalFocusTime,totalBreakTime,tasks,projectThisWeek,coworkingPartner
        }

    }

    static getIdCoworkingPartner(userId,idTable){
        const data = idTable.split('_')
        if(data[0] === userId) return data[1]
        else return data[0]
    }

    static getFormatIdCoworkingPartner(user1,user2) {
        if(user1 > user2) return `${user1}_${user2}`
        else return `${user2}_${user1}`
    }

}

module.exports = FocusSessionController