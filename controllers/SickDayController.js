const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const { AttachmentBuilder } = require("discord.js")
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
const getRandomValue = require('../helpers/getRandomValue');
const PartyController = require('./PartyController');
const AdvanceReportController = require('./AdvanceReportController');

class SickDayController{

    static async interactionShopSickTicket(interaction){
        const totalPoint = await UserController.getTotalPoint(interaction.user.id)
        interaction.editReply(SickDayMessage.optionHowManySickDay(interaction.user.id,totalPoint))
    }

    static async interactionOptionSickTicket(interaction,value){
        const totalTicket = Number(value)
        const totalPoint = SickDayController.calculatePriceSickTicket(totalTicket)
        const isHaveEnoughPoint = await SickDayController.isHaveEnoughPoint(interaction.user.id,totalPoint)

        if(isHaveEnoughPoint) await interaction.editReply(SickDayMessage.confirmationBuySickDay(interaction.user.id,totalTicket,totalPoint))
        else await interaction.editReply(SickDayMessage.notHaveEnoughPoint(interaction.user.id))
    }

    static async interactionBuySickTicket(interaction,totalTicket){
        totalTicket = Number(totalTicket)
        const data = await supabase.from("Users")
                .select('goalId,longestStreak,totalDay,totalPoint,lastDone')
                .eq("id",interaction.user.id)
                .single()
        const {goalId,longestStreak,totalDay,totalPoint,lastDone} = data.data
        let goalName = 'Consistency'
        if (goalId) {
            const thread = await ChannelController.getGoalThread(interaction.client,goalId)
            goalName = thread.name.split('by')[0]
        }
        const startDate = Time.getTodayDateOnly()
        const endDate = Time.getDateOnly(Time.getNextDate(totalTicket-1,startDate))
        const totalPriceTicket = SickDayController.calculatePriceSickTicket(totalTicket)
        const dataSickTicket = await SickDayController.checkSickTicket(interaction.user.id,startDate,endDate)

        if(data.data?.totalPoint < totalPriceTicket){
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
                const date = Time.getDateOnly(Time.getNextDate(i,startDate))
                if(date !== Time.getTodayDateOnly()){
                    listSickTicket.push({
                        type:'sick',
                        UserId:interaction.user.id,
                        message: date
                    })
                }
            }

            supabase.from("Reminders")
                .insert(listSickTicket)
                .then()
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

            DailyStreakController.generateHabitBuilder(interaction.client,interaction.user,false,0,true,true)
                .then(files=>{
                    const sickTicketLeft = totalTicket - 1
                    channelStreak.send(SickDayMessage.shareStreak(interaction.user.id,files,sickTicketLeft,totalTicket===1))
                })
            UserController.updateOnVacation(true,interaction.user.id)
            SickDayController.shareToProgress(interaction.client,[{name:interaction.user.username,id:interaction.user.id}])
            AdvanceReportController.updateDataWeeklyPurchaseTicket(interaction.user.id,'sick')
            PartyController.updateDataProgressRecap(interaction.user.id,'sick')
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
            const users = data.data.map(el => el.Users)
            SickDayController.shareToProgress(client,users)
            
            for (let i = 0; i < data.data.length; i++) {
                const sickTicket = data.data[i];
                const userId = sickTicket.UserId
                AdvanceReportController.updateDataWeeklyPurchaseTicket(userId,'sick')
                PartyController.updateDataProgressRecap(userId,'sick')
                const {goalId,longestStreak,totalDay,totalPoint,lastDone} = sickTicket.Users
                const channelStreak = ChannelController.getChannel(client,CHANNEL_STREAK)
                const {user} = await MemberController.getMember(client,userId)

                const sickLeft = SickDayController.getSickLeft(sickTicket.endDate)
                let goalName = 'Consistency'
                if (goalId) {
                    const thread = await ChannelController.getGoalThread(client,goalId)
                    goalName = thread.name.split('by')[0]
                }

                UserController.updateLastSafety(Time.getTodayDateOnly(),userId)
                await DailyStreakController.addSafetyDot(userId,new Date())
                
                DailyStreakController.generateHabitBuilder(client,user,false,sickLeft,false,true)
                    .then(files=>{
                        channelStreak.send(SickDayMessage.shareStreak(user.id,files,sickLeft))
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

        const randomGif = getRandomValue(sickGifs)
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
        }).then(thread => thread.setArchived(true))
    }


    static async notifySickEnded(client){
        let ruleNotifySickEnded = new schedule.RecurrenceRule();
        ruleNotifySickEnded.hour = Time.minus7Hours(6)
        ruleNotifySickEnded.minute = 0
        schedule.scheduleJob(ruleNotifySickEnded,async function(){
			const dataSickTicket = await supabase.from('SickTickets')
                .select()
                .eq('endDate',Time.getDateOnly(Time.getNextDate(-1)))
            dataSickTicket.data.forEach(async sickTicket=>{
                ChannelController.sendToNotification(
                    client,
                    SickDayMessage.sickDayEnded(sickTicket.UserId),
                    sickTicket.UserId
                )
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

        if (data.data.length > 0) {
            result.isAlreadyHaveSickTicket = true
            const dateOnly = data.data[0].message
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
        const totalPointUser = await UserController.getTotalPoint(userId)
        return totalPointUser >= totalPrice
    }

    static calculatePriceSickTicket(totalTicket){
        return totalTicket * 150
    }
}

module.exports = SickDayController