const supabase = require("../helpers/supabaseClient")
const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const FocusSessionMessage = require("../views/FocusSessionMessage");
const ChannelController = require("./ChannelController");
const Time = require("../helpers/time");
const UserController = require("./UserController");
const MemberController = require("./MemberController");
const InfoUser = require("../helpers/InfoUser");
const { ChannelType } = require("discord.js");
const { CHANNEL_SESSION_GOAL, CHANNEL_CLOSA_CAFE } = require("../helpers/config");
const CoworkingController = require("./CoworkingController");
const AchievementBadgeController = require("./AchievementBadgeController");
const fs = require('fs');
const MessageFormatting = require("../helpers/MessageFormatting");
const AdvanceReportController = require("./AdvanceReportController");
class FocusSessionController {

    static continueFocusTimer(client,focusRoomUser,listFocusRoom){
        if(!fs.existsSync('focusRoom')) fs.mkdirSync('focusRoom')
        if(!fs.existsSync('focusRoom/data.json')) fs.writeFileSync('focusRoom/data.json','{}')

        const data = JSON.parse(fs.readFileSync('focusRoom/data.json'))
        const oldFocusRoomUser = data?.focusRoomUser || {}
        if(Object.keys(oldFocusRoomUser).length > 0){
            for (const UserId in oldFocusRoomUser) {
                focusRoomUser[UserId] = oldFocusRoomUser[UserId]
                FocusSessionController.restartFocusTimer(client,UserId,focusRoomUser)
            }
        }

        const oldListFocusRoom = data?.listFocusRoom || {}
        if(Object.keys(oldListFocusRoom).length > 0){
            for (const ChannelId in oldListFocusRoom) {
                listFocusRoom[ChannelId] = oldListFocusRoom[ChannelId]
            }
        }
 
        setInterval(() => {
            fs.writeFileSync('focusRoom/data.json',JSON.stringify({focusRoomUser,listFocusRoom},null,2))
        }, 300);
    }

    static updateMessageFocusTimerId(userId,msgFocusTimerId){
        supabase.from('FocusSessions')
            .update({msgFocusTimerId})
            .is('session',null)
            .eq('UserId',userId)
            .then()
    }
    static updateVoiceRoomId(userId,VoiceRoomId){
        supabase.from('FocusSessions')
            .update({VoiceRoomId})
            .is('session',null)
            .eq('UserId',userId)
            .then()
    }

    static async getActiveFocusTimer(){
        return await supabase.from()
    }

    static showModalSettingBreakReminder(interaction){
        const [commandButton,userId,value] = interaction.customId.split('_')
        if(commandButton === 'settingBreakReminder'){
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set break time")
			.addComponents(
				new TextInputComponent().setCustomId('breakTime').setLabel("Send the break notification after").setStyle("SHORT").setDefaultValue(value).setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }
    static showModalAddNewProject(interaction,customId){
        const [commandButton,userId] = customId? customId.split('_') : interaction.customId.split('_')
        if(commandButton === 'addNewProject'){
			if(interaction.user.id !== userId) return interaction.reply({ephemeral:true,content:`Hi ${interaction.user}, you can't add someone else project.`})
			const modal = new Modal()
			.setCustomId(customId || interaction.customId)
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
        return data.data
    }

    static getFormattedMenu(projects){
        const menus = []
        if(projects.length > 0) menus.push({
            label:"✨ Add new project +",
            value:'addNewProject'

        })
        const maxLength = projects.length > 24 ? 24 : projects.length
        for (let i = 0; i < maxLength; i++) {
            const project = projects[i];
            menus.push({
                label:project.name,
                value:String(project.id)
            })
        }

        return menus
    }

    static async countdownBreakSession(focusRoomUser,targetUserId,taskName,projectName,msgFocusOld,replyBreak,event){

        FocusSessionController.countdownFocusSession(msgFocusOld,taskName,projectName,focusRoomUser,targetUserId,event)
        const intervalBreak = setInterval(() => {
            if(!focusRoomUser[targetUserId]) {
                clearInterval(intervalBreak)
                ChannelController.deleteMessage(replyBreak)
            }
            if(focusRoomUser[targetUserId]?.msgIdReplyBreak != replyBreak.id) return clearInterval(intervalBreak)
            if(focusRoomUser[targetUserId]?.breakCounter === 1) {
                clearInterval(intervalBreak)
                if(focusRoomUser[targetUserId]?.msgIdReplyBreak != replyBreak.id) return
                replyBreak.reply(FocusSessionMessage.reminderEndedBreak(targetUserId))
                    .then(msg=>{
                        focusRoomUser[targetUserId].msgIdReplyBreak = msg.id
                        setTimeout(async () => {
                            if(!focusRoomUser[targetUserId]) return ChannelController.deleteMessage(msg)
                            if(focusRoomUser[targetUserId]?.msgIdReplyBreak != msg.id) return 
                            ChannelController.deleteMessage(msgFocusOld)
                            msg.reply(FocusSessionMessage.messageTimer(focusRoomUser[targetUserId],taskName,projectName,targetUserId))
                                .then(msgFocus=>{
                                    FocusSessionController.updateMessageFocusTimerId(targetUserId,msgFocus.id)
                                    FocusSessionController.countdownFocusSession(msgFocus,taskName,projectName,focusRoomUser,targetUserId)
                                    ChannelController.deleteMessage(msg)
                                        .then(()=> focusRoomUser[targetUserId].msgIdReplyBreak = null)
                                })
                        }, Time.oneMinute());
                        ChannelController.deleteMessage(replyBreak)
                    })
            }else{
                replyBreak.edit(FocusSessionMessage.messageBreakTime(focusRoomUser[targetUserId]?.breakCounter,targetUserId))
            }
        }, Time.oneMinute());
    }

    static async restartFocusTimer(client,UserId,focusRoomUser){
        if(focusRoomUser[UserId]?.firstTime === false){
            const threadId = focusRoomUser[UserId]?.threadId
            const channel = ChannelController.getChannel(client,CHANNEL_SESSION_GOAL)
            const thread = await ChannelController.getThread(channel,threadId)
            const msgTimer = await ChannelController.getMessage(thread,focusRoomUser[UserId]?.msgIdFocusRecap)
            const data = await supabase.from("FocusSessions")
                .select('*,Projects(id,name)')
                .eq('threadId',threadId)
                .single()
            const taskName = data.data?.taskName
            const projectName = data.data?.Projects?.name
            if(focusRoomUser[UserId].isFocus){
                FocusSessionController.countdownFocusSession(msgTimer,taskName,projectName,focusRoomUser,UserId,'restart')
            }else{
                const replyBreak = await ChannelController.getMessage(thread,focusRoomUser[UserId]?.msgIdReplyBreak)
                FocusSessionController.countdownBreakSession(focusRoomUser,UserId,taskName,projectName,msgTimer,replyBreak,'restart')
            }
        }
    }

    static countdownFocusSession(msgFocus,taskName,projectName,focusRoomUser,userId,event) {
        focusRoomUser[userId].msgIdFocusRecap = msgFocus.id
        focusRoomUser[userId].channelIdFocusRecap = msgFocus.channelId
        focusRoomUser[userId].event = event
        const timerFocus = setInterval(async () => {
            if(!focusRoomUser[userId]) return clearInterval(timerFocus)
            if(event !== focusRoomUser[userId]?.event) {
                return clearInterval(timerFocus)
            }

            if(FocusSessionController.isReachedDailyWorkTime(focusRoomUser[userId])){
                msgFocus.channel.send(FocusSessionMessage.reachedDailyWorkTime(focusRoomUser[userId]?.dailyWorkTime,userId))
            }

            focusRoomUser[userId].totalTime++
            if(focusRoomUser[userId]?.isFocus){
                focusRoomUser[userId].focusTime++
                focusRoomUser[userId].currentFocus++
            }else {
                focusRoomUser[userId].currentFocus = 0
                focusRoomUser[userId].breakCounter--
                focusRoomUser[userId].breakTime++
            }
            if(FocusSessionController.isTimeToBreak(focusRoomUser,userId)){
                if(focusRoomUser[userId].msgIdSmartBreakReminder){
                    const msgBreakReminder = await ChannelController.getMessage(
                        msgFocus.channel,
                        focusRoomUser[userId].msgIdSmartBreakReminder
                    )
                    ChannelController.deleteMessage(msgBreakReminder)
                }
                msgFocus.channel.send(FocusSessionMessage.smartBreakReminder(userId,focusRoomUser[userId].currentFocus))
                    .then(msgReminderBreak=>{
                        focusRoomUser[userId].msgIdReplyBreak = msgReminderBreak.id
                        focusRoomUser[userId].msgIdSmartBreakReminder = msgReminderBreak.id
                    })
            }

            if(focusRoomUser[userId].date !== Time.getTodayDateOnly()){
                focusRoomUser[userId].date = Time.getTodayDateOnly()
                const [coworkingPartners,data] = await Promise.all([
                    FocusSessionController.getAllCoworkingPartners(userId),
                    FocusSessionController.getDetailFocusSession(userId)
                ])
				const taskName = data?.taskName
				const projectName = data.Projects.name
				const projectId = data.Projects.id
                const {totalTime,focusTime,breakTime} = focusRoomUser[userId]
                FocusSessionController.updateTime(userId,totalTime,focusTime,breakTime,projectName)
				.then(async response=>{
                    FocusSessionController.insertFocusSession(userId,taskName,projectId)
                })

                focusRoomUser[userId].yesterdayProgress = {
                    totalTime,focusTime,breakTime
                }
            }

            if(!focusRoomUser[userId]?.isFocus && focusRoomUser[userId]?.breakCounter === 0){
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
        }, Time.oneMinute());
    }

    static isTimeToBreak(focusRoomUser,userId){
        return focusRoomUser[userId].currentFocus !== 0 && focusRoomUser[userId].currentFocus % focusRoomUser[userId].breakReminder === 0
    }

    static isReachedDailyWorkTime({totalTime,totalTimeToday,dailyWorkTime}){
        return (totalTime + totalTimeToday) === dailyWorkTime
    }

    static async deleteFocusSession(UserId){
        return await supabase.from('FocusSessions')
        .delete()
        .eq('UserId',UserId)
        .is('session',null)
    }

    static async insertFocusSession(UserId,taskName,ProjectId,threadId){
        await FocusSessionController.deleteFocusSession(UserId)

        return await supabase.from('FocusSessions')
            .insert({
                threadId,taskName,ProjectId,UserId,
             })
             .select()
             .single()
    }
    static async updateProjectId(taskId,ProjectId){
        return await supabase.from('FocusSessions')
            .update({
                ProjectId
             })
             .eq('id',taskId)
             .select()
             .single()
    }

    static async getDetailFocusSession(userId){
        const data = await supabase.from('FocusSessions')
        .select('*,Projects(id,name)')
        .eq('UserId',userId)
        .is('session',null)
        .single()

        return data.data
    }

    static async updateTime(userId,totalTime,focusTime,breakTime,projectName,yesterdayProgress){
        if(yesterdayProgress){
            totalTime -= yesterdayProgress.totalTime
            focusTime -= yesterdayProgress.focusTime
            breakTime -= yesterdayProgress.breakTime
        }
        supabase.rpc('incrementTotalTimeProject',{x:totalTime,row_id:userId,project_name:projectName})
            .then()
        return await supabase.from("FocusSessions")
            .update({focusTime,breakTime,session:totalTime,updatedAt:new Date()})
            .eq('UserId',userId)
            .is('session',null)
            .order('createdAt',{ascending:false})
            .limit(1)
            .select()
            .single()
    }

    static async getAllTodayTasks(userId){
        const date = new Date(Time.getTodayDateOnly())
        date.setHours(Time.minus7Hours(date.getHours(),false))
        return await supabase.from('FocusSessions')
            .select('*,Projects(name)')
            .gte('createdAt',date.toISOString())
            .eq(userId)
    }

    static async setCoworkingPartner(userId,VoiceRoomId){
        supabase.from("FocusSessions")
            .select()
            .is('session',null)
            .eq("VoiceRoomId",VoiceRoomId)
            .neq('UserId',userId)
            .not('msgFocusTimerId','is',null)
            .then(async data => {
                for (let i = 0; i < data.data.length; i++) {
                    const {UserId} = data.data[i];
                    const id = FocusSessionController.getFormatIdCoworkingPartner(userId,UserId)

                    await supabase.from('CoworkingPartners')
                        .upsert({
                            id,currentTime:null,currentSession:2,updatedAt:new Date()
                        })
                }
            })
    }

    static async updateCoworkingPartner(client,userId){
        const data = await supabase.from("CoworkingPartners")
            .select()
            .like('id',`%${userId}%`)
            .gt('currentSession',0)
        for (let i = 0; i < data.data.length; i++) {
            const {id,currentTime,totalSession,totalTime,updatedAt,lastCoworking,currentStreak,currentSession,longestStreak,endLongestStreak} = data.data[i];
            const date = Time.getDate(updatedAt)
            const dateOnly = Time.getDateOnly(date)
            FocusSessionController.decreaseCurrentSession(id)
            if(currentSession === 2){
                const totalTimeCoworking = Time.getGapTime(date,true).totalInMinutes
                let coworkingStreak
                if(totalTimeCoworking >= 5){
                    if(Time.isValidCoworkingStreak(lastCoworking,dateOnly)){
                        if(lastCoworking !== dateOnly) coworkingStreak = currentStreak + 1
                        else coworkingStreak = currentStreak
                    }else{
                        coworkingStreak = 1
                    }
                    if(longestStreak !== coworkingStreak){
                        
                        if(coworkingStreak === 7 || coworkingStreak === 30 || coworkingStreak === 100 || coworkingStreak === 200 || coworkingStreak === 365) {
                            const [idUser,idPartner] = id.split('_')
                            Promise.all([
                                MemberController.getMember(client,idUser),
                                MemberController.getMember(client,idPartner),
                            ])
                            .then(([{user},{user:partner}])=>{
                                AchievementBadgeController.achieveCoworkingStreak(client,coworkingStreak,totalSession,totalTime,user,partner,true)
                            })
                        }
                    }else if(longestStreak === coworkingStreak && endLongestStreak !== Time.getTodayDateOnly()) {
                        if(coworkingStreak === 30 || coworkingStreak === 100 || coworkingStreak === 200 || coworkingStreak === 365) {
                            const [idUser,idPartner] = id.split('_')
                            Promise.all([
                                MemberController.getMember(client,idUser),
                                MemberController.getMember(client,idPartner),
                            ])
                            .then(([{user},{user:partner}])=>{
                                AchievementBadgeController.achieveCoworkingStreak(client,coworkingStreak,totalSession,totalTime,user,partner)
                            })
                        }
                    }

                    const value = {
                        currentTime : totalTimeCoworking,
                        totalTime: totalTime + totalTimeCoworking,
                        totalSession: totalSession + 1,
                        lastCoworking: Time.getTodayDateOnly(),
                        currentStreak: coworkingStreak,
                    }
                    
                    if(coworkingStreak >= longestStreak){
                        value.longestStreak = coworkingStreak
                        value.endLongestStreak = Time.getTodayDateOnly()
                    }

                    await supabase.from("CoworkingPartners")
                        .update(value)
                        .eq('id',id)
                }
            }
        }
    }

    static decreaseCurrentSession(id){
        supabase
        .rpc('incrementCurrentSession', { x:-1,id_table:id })
        .then()
    }

    static async getAllCoworkingPartners(userId){
        const dataCoworkingPartner = await supabase.from('CoworkingPartners')
            .select()
            .gte('lastCoworking',Time.getDateOnly(Time.getNextDate(-1)))
            .like('id',`%${userId}%`)
            .order('currentStreak',{ascending:false})
            .order('updatedAt',{ascending:false})
            .limit(6)
        const coworkingPartners = []
        for (let i = 0; i < dataCoworkingPartner?.data?.length; i++) {
            const partner = dataCoworkingPartner.data[i];
            const idPartner = FocusSessionController.getIdCoworkingPartner(userId,partner.id)
            const dataUser = await UserController.getDetail(idPartner,'avatarURL')

            coworkingPartners.push({
                avatar:dataUser.data?.avatarURL,
                streak: partner.currentStreak
            })
        }
        return coworkingPartners
    }

    static async getRecapFocusSession(userId,dateOnly){
        const date_summary = dateOnly ? dateOnly : Time.getTodayDateOnly()
        const [coworkingPartners, {data:tasks},dataUser] = await Promise.all([
            FocusSessionController.getAllCoworkingPartners(userId),
            supabase.rpc('getDailyFocusSummary', { date_summary,row_id:userId}),
            UserController.getDetail(userId,'dailyWorkTime,totalPoint,totalFocusSession,totalCoworkingTime')
        ])

        const {dailyWorkTime,totalPoint,totalFocusSession,totalCoworkingTime} = dataUser.data

        return {
            dailyWorkTime,totalPoint,tasks,coworkingPartners,totalSession:totalFocusSession,totalCoworkingTime
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

    static async getTotalTaskTimeToday(userId){
        const {data:data} = await supabase
        .rpc('getDailyFocusSummary', { row_id:userId,date_summary:Time.getTodayDateOnly() })
    
        let totalTime = 0
        for (let i = 0; i < data.length; i++) {
            const el = data[i];
            totalTime += Number(el.totalTime)
        }

        return totalTime
    }

    static async startFocusTimer(client,threadId,userId,focusRoomUser){
        const channel = ChannelController.getChannel(client,CHANNEL_SESSION_GOAL)
        const thread = await ChannelController.getThread(channel,threadId)
        focusRoomUser[userId].threadId = threadId
        if (FocusSessionController.isValidToStartFocusTimer(focusRoomUser,userId) ){
            FocusSessionController.updateVoiceRoomId(userId,focusRoomUser[userId]?.joinedChannelId)
            FocusSessionController.setCoworkingPartner(userId,focusRoomUser[userId]?.joinedChannelId)
            const data = await FocusSessionController.getDetailFocusSession(userId)
            const taskName = data?.taskName
            const projectName = data?.Projects?.name
            thread.send(FocusSessionMessage.messageTimer(focusRoomUser[userId],taskName,projectName,userId))
            .then(async msgFocus=>{
                FocusSessionController.updateMessageFocusTimerId(userId,msgFocus.id)
                FocusSessionController.countdownFocusSession(msgFocus,taskName,projectName,focusRoomUser,userId,'voice')						
            })
            focusRoomUser[userId].firstTime = false
            if(focusRoomUser[userId]?.joinedChannelId === CHANNEL_CLOSA_CAFE) CoworkingController.handleStartEvent(client)
        }
    }

    static isValidToAutoSelectProject(focusRoomUser,userId){
        if(!focusRoomUser[userId]) return false
        let {selfVideo,streaming,firstTime,threadId,statusSetSessionGoal,onProcessAutoSelectProject} = focusRoomUser[userId]
        return (selfVideo || streaming) && firstTime && threadId && statusSetSessionGoal === 'selectProject' && !onProcessAutoSelectProject
    }
    static isValidToStartFocusTimer(focusRoomUser,userId){
        if(!focusRoomUser[userId]) return false
        let {selfVideo,streaming,firstTime,threadId,statusSetSessionGoal} = focusRoomUser[userId]
        return (selfVideo || streaming) && firstTime && threadId && statusSetSessionGoal === 'done'
    }

    static async handleStartFocusSession(interaction,userId,focusRoomUser,taskId,ProjectId){
        await FocusSessionController.updateProjectId(taskId,ProjectId)
        const haveCoworkingEvent = await CoworkingController.haveCoworkingEvent(userId)
        if(focusRoomUser[userId]?.joinedChannelId){
            focusRoomUser[userId].threadId = interaction.channelId
            if(FocusSessionController.isValidToStartFocusTimer(focusRoomUser,userId)){
                const msgReply = await interaction.editReply('.')
                ChannelController.deleteMessage(msgReply)
                FocusSessionController.startFocusTimer(interaction.client,interaction.channelId,userId,focusRoomUser)
            }else{
                await interaction.editReply(FocusSessionMessage.startFocusSession(userId,haveCoworkingEvent?.voiceRoomId,true))
            }
        }else{
            await interaction.editReply(FocusSessionMessage.startFocusSession(userId,haveCoworkingEvent?.voiceRoomId))
        }
    }

    static async handleAutoSelectProject(client,focusRoomUser,userId,taskId){
        if(!FocusSessionController.isValidToAutoSelectProject(focusRoomUser,userId)) return
        const projects = await FocusSessionController.getAllProjects(userId)
        if(projects.length === 0) return
        
        focusRoomUser[userId].onProcessAutoSelectProject = true
        const ProjectId = projects[0].id
        setTimeout(async () => {
            if(!focusRoomUser[userId]) return
            let {threadId,msgSelecProjectId} = focusRoomUser[userId]
            const threadSession = await ChannelController.getThread(
                ChannelController.getChannel(client,CHANNEL_SESSION_GOAL),
                threadId
            )
            if(focusRoomUser[userId]?.statusSetSessionGoal === 'done') return

            const msgSelecProject = await ChannelController.getMessage(threadSession,msgSelecProjectId)
            if(!taskId){
                const dataTask = await supabase.from("FocusSessions")
                    .select('id')
                    .eq('threadId',threadId)
                    .single()
                taskId = dataTask.data?.id
            }

            if(focusRoomUser[userId]?.statusSetSessionGoal === 'done') return
            if(projects.length === 1){
                await ChannelController.deleteMessage(msgSelecProject)
                await FocusSessionController.updateProjectId(taskId,ProjectId)
                const dataUser  = await UserController.getDetail(userId,'dailyWorkTime')
                if (!dataUser.data?.dailyWorkTime) {
                    await UserController.updateData({dailyWorkTime:60},userId)
                    AdvanceReportController.updateDataWeeklyGoal(60,userId)
                }
                focusRoomUser[userId].statusSetSessionGoal = 'done'
                if (FocusSessionController.isValidToStartFocusTimer(focusRoomUser,userId)){
                    FocusSessionController.startFocusTimer(client,focusRoomUser[userId].threadId,userId,focusRoomUser)
                }
            }else{
                const msgReminder = await threadSession.send(`hi ${MessageFormatting.tagUser(userId)}, don't forget to select your project to start time tracker or i'll auto-select to your latest project in 2 min.`)
                setTimeout(async () => {
                    if(!focusRoomUser[userId]) return
                    
                    if(focusRoomUser[userId]?.statusSetSessionGoal === 'done') return
                    await ChannelController.deleteMessage(msgSelecProject)
                    await FocusSessionController.updateProjectId(taskId,ProjectId)
                    const dataUser  = await UserController.getDetail(userId,'dailyWorkTime')
                    if (!dataUser.data?.dailyWorkTime) {
                        await UserController.updateData({dailyWorkTime:60},userId)
                        AdvanceReportController.updateDataWeeklyGoal(60,userId)
                    }
                    focusRoomUser[userId].statusSetSessionGoal = 'done'
                    if (FocusSessionController.isValidToStartFocusTimer(focusRoomUser,userId)){
                        FocusSessionController.startFocusTimer(client,focusRoomUser[userId].threadId,userId,focusRoomUser)
                    }
                    ChannelController.deleteMessage(msgReminder)
    
                }, Time.oneMinute() * 2);
            }

        }, Time.oneMinute() * 2);
    }
}

module.exports = FocusSessionController