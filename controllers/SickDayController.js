const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const { MessageAttachment } = require("discord.js")
const RequestAxios = require("../helpers/axios")
const { CHANNEL_STREAK, CHANNEL_GOALS, CHANNEL_SHOP, ROLE_365STREAK, ROLE_100STREAK, ROLE_30STREAK, ROLE_7STREAK, CHANNEL_TODO } = require("../helpers/config")
const GenerateImage = require("../helpers/GenerateImage")
const InfoUser = require("../helpers/InfoUser")
const LocalData = require("../helpers/LocalData")
const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")
const ChannelController = require("./ChannelController")
const schedule = require('node-schedule');
const DailyStreakController = require("./DailyStreakController");
const MemberController = require('./MemberController');
const UserController = require('./UserController');
const MessageFormatting = require('../helpers/MessageFormatting');
const SickDayMessage = require('../views/SickDayMessage');

class SickDayController{

    static async interactionShopSickTicket(interaction){
        const totalPoint = await SickDayController.getTotalPoint(interaction.user.id)
        interaction.editReply(SickDayMessage.optionHowManySickDay(interaction.user.id,totalPoint))
    }

    static async interactionOptionSickTicket(interaction,value){
        const totalTicket = Number(value)
        const totalPoint = SickDayController.calculatePriceSickTicket(totalTicket)
        const isHaveEnoughPoint = await SickDayController.isHaveEnoughPoint(interaction.user.id,totalPoint)

        if(isHaveEnoughPoint) await interaction.editReply(SickDayMessage.confirmationBuySickDay(interaction.user.id,totalTicket,totalPoint))
        else await interaction.editReply(SickDayMessage.notHaveEnoughPoint(interaction.user.id))
    }

    static async getTotalPoint(userId){
        const data = await supabase.from("Users")
            .select('totalPoint')
            .eq('id',userId)
            .single()
        return data.body.totalPoint
    }

    static async interactionBuySickTicket(interaction,totalTicket){
        totalTicket = Number(totalTicket)
        const data = await supabase.from("Users")
                .select('goalId,longestStreak,totalDay,totalPoint,lastDone')
                .eq("id",interaction.user.id)
                .single()
        const {goalId,longestStreak,totalDay,totalPoint,lastDone} = data.body
        let goalName = 'Consistency'
        if (goalId) {
            const channelGoal = ChannelController.getChannel(interaction.client,CHANNEL_GOALS)
            const thread = await ChannelController.getThread(channelGoal,goalId)
            goalName = thread.name.split('by')[0]
        }
        const startDate = Time.getTodayDateOnly()
        const endDate = Time.getDateOnly(Time.getNextDate(totalTicket-1,startDate))
        const totalPriceTicket = SickDayController.calculatePriceSickTicket(totalTicket)
        const dataSickTicket = await SickDayController.checkSickTicket(interaction.user.id,startDate,endDate)

        if(data.body?.totalPoint < totalPriceTicket){
            await interaction.editReply(SickDayMessage.notHaveEnoughPoint(interaction.user.id))
        }else if(dataSickTicket.isAlreadyHaveSickTicket){
            await interaction.editReply(SickDayMessage.alreadyHaveSickTicket(dataSickTicket.date))
        }else{
            supabase.from('SickTickets')
                .insert({
                    UserId:interaction.user.id,
                    startDate,
                    endDate,
                    totalTicket
                })
                .then()
            const listSickTicket = []
            for (let i = 0; i < totalTicket; i++) {
                listSickTicket.push({
                    type:'sick',
                    UserId:interaction.user.id,
                    message:Time.getDateOnly(Time.getNextDate(i,startDate))
                })
            }

            supabase.from("Reminders")
                .insert(listSickTicket)
                .then(data=>{
                    console.log(data);
                })
            if (Time.onlyMissOneDay(lastDone)) {
                const missedDate = Time.getNextDate(-1)
                missedDate.setHours(8)
                await DailyStreakController.addSafetyDot(interaction.user.id,missedDate)
            }
            const pointLeft = totalPoint - totalPriceTicket
            UserController.updatePoint(pointLeft,interaction.user.id)
            const channelStreak = ChannelController.getChannel(interaction.client,CHANNEL_STREAK)

            UserController.updateLastSafety(Time.getTodayDateOnly(),interaction.user.id)
            await DailyStreakController.addSafetyDot(interaction.user.id,new Date())

            RequestAxios.get('todos/tracker/'+interaction.user.id)
            .then(async progressRecently=>{
                const avatarUrl = InfoUser.getAvatar(interaction.user)
                const sickTicketLeft = totalTicket - 1
                const buffer = await GenerateImage.tracker(interaction.user.username,goalName,avatarUrl,progressRecently,longestStreak,totalDay,pointLeft,false,0,true,true)
                const attachment = new MessageAttachment(buffer,`progress_tracker_${interaction.user.username}.png`)
                channelStreak.send(SickDayMessage.shareStreak(interaction.user.id,attachment,sickTicketLeft,totalTicket===1))
            })

            UserController.updateOnVacation(true,interaction.user.id)
            SickDayController.shareToProgress(interaction.client,[{name:interaction.user.username,id:interaction.user.id}])
            const startDateFormatted = Time.getFormattedDate(Time.getDate(startDate))
            const endDateFormatted = Time.getFormattedDate(Time.getNextDate(totalTicket,startDate))
            await interaction.editReply(SickDayMessage.successBuySickDayTicket(interaction.user.id,pointLeft,startDateFormatted,endDateFormatted))
        }
    }

    static async activateSickTicket(client){
        let ruleActivateSickTicket = new schedule.RecurrenceRule();
		ruleActivateSickTicket.hour = Time.minus7Hours(8)
		ruleActivateSickTicket.minute = 0
		schedule.scheduleJob(ruleActivateSickTicket,async function(){
            const data = await SickDayController.getAllActiveSickTicket(Time.getTodayDateOnly())
            const users = data.body.map(el => el.Users)
            SickDayController.shareToProgress(client,users)
            
            for (let i = 0; i < data.body.length; i++) {
                const sickTicket = data.body[i];
                const userId = sickTicket.UserId
                const {goalId,longestStreak,totalDay,totalPoint,lastDone} = sickTicket.Users
                const channelStreak = ChannelController.getChannel(client,CHANNEL_STREAK)
                const {user} = await MemberController.getMember(client,userId)

                const sickLeft = SickDayController.getSickLeft(sickTicket.endDate)
                let goalName = 'Consistency'
                if (goalId) {
                    const channelGoal = ChannelController.getChannel(client,CHANNEL_GOALS)
                    const thread = await ChannelController.getThread(channelGoal,goalId)
                    goalName = thread.name.split('by')[0]
                }

                UserController.updateLastSafety(Time.getTodayDateOnly(),userId)
                await DailyStreakController.addSafetyDot(userId,new Date())
                
                RequestAxios.get('todos/tracker/'+userId)
                .then(async progressRecently=>{
                    const avatarUrl = InfoUser.getAvatar(user)

                    const buffer = await GenerateImage.tracker(user.username,goalName,avatarUrl,progressRecently,longestStreak,totalDay,totalPoint,false,sickLeft,false,true)
                    const attachment = new MessageAttachment(buffer,`progress_tracker_${user.username}.png`)
                    channelStreak.send(SickDayMessage.shareStreak(user.id,attachment,sickLeft))
                })
            }
        })
    }

    static async shareToProgress(client,users){
        if(users.length === 0 ) return
        const sickGifs = [
            "https://media.giphy.com/media/13oAIJjaKPhf3y/giphy.gif",
            "https://media.giphy.com/media/xT77XZR8ZkwSnSQx8I/giphy.gif",
            "https://media.giphy.com/media/YLpZ4UmkixqmI/giphy.gif",
            "https://media.giphy.com/media/11RuG8n1SEkLqo/giphy.gif",
            "https://media.giphy.com/media/BfID0O1Qwzf8I/giphy.gif",
        ]

        const randomGif = sickGifs[Math.floor(Math.random()*sickGifs.length)]
        const channelProgress = ChannelController.getChannel(client,CHANNEL_TODO)
        const tagUsers = users.map(user=>MessageFormatting.tagUser(user.id))
        const msg = await channelProgress.send(SickDayMessage.shareProgress(tagUsers.join(' '),randomGif))
        let usersOnSickLeave = users[0].name
        for (let i = 1; i < users.length; i++) {
            const name = users[i].name;
            if(i === 2 && i !== users.length - 1){
                usersOnSickLeave += ', & others'
                break
            } 
            if(i === users.length - 1) usersOnSickLeave += `, & ${name}`
            else usersOnSickLeave += `, ${name}`
        }
        msg.startThread({
            name: `${usersOnSickLeave} on sick leave `,
        });
    }


    static async notifySickEnded(client){
        let ruleNotifySickEnded = new schedule.RecurrenceRule();
        ruleNotifySickEnded.hour = Time.minus7Hours(6)
        ruleNotifySickEnded.minute = 0
        schedule.scheduleJob(ruleNotifySickEnded,async function(){
			const dataSickTicket = await supabase.from('SickTickets')
                .select()
                .eq('endDate',Time.getDateOnly(Time.getNextDate(-1)))
            dataSickTicket.body.forEach(async sickTicket=>{
                const threadNotification = await ChannelController.getNotificationThread(client,sickTicket.UserId)
                threadNotification.send(SickDayMessage.sickDayEnded(sickTicket.UserId))
                UserController.updateOnVacation(false,sickTicket.UserId)
            })
		})
    }

    static getSickLeft(endSickDate){
        const todayDate = Time.getDate(Time.getTodayDateOnly())
        const endDate = Time.getDate(endSickDate)
        const diffDay =Time.getDiffDay(todayDate,endDate)
        return diffDay 
    }

    static async checkSickTicket(userId,startDate,endDate){
        const result = {
            isAlreadyHaveSickTicket: false,
            date:null
        }
        const data = await supabase.from("Reminders")
            .select()
            .gte('message',startDate)
            .lte('message',endDate)
            .eq("UserId",userId)
            .eq('type','sick')
            .order('message',{ascending:true})
        console.log("🚀 ~ file: SickDayController.js:220 ~ SickDayController ~ checkSickTicket ~ data", data,startDate,endDate)

        if (data.body.length > 0) {
            result.isAlreadyHaveSickTicket = true
            const dateOnly = data.body[0].message
            result.date = Time.getFormattedDate(Time.getDate(dateOnly),false,'long').split(',')[0]
        }
        return result
    }

    static async getAllActiveSickTicket(dateOnly){
       return await supabase.from("SickTickets")
            .select('*,Users(id,name,goalId,longestStreak,totalDay,totalPoint,lastDone)')
            .gte('endDate',dateOnly)
            .lte('startDate',dateOnly)
    }

    static async isHaveEnoughPoint(userId,totalPrice){
        const totalPointUser = await SickDayController.getTotalPoint(userId)
        return totalPointUser >= totalPrice
    }

    static calculatePriceSickTicket(totalTicket){
        return totalTicket * 150
    }
}

module.exports = SickDayController