const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const { MessageAttachment } = require("discord.js")
const RequestAxios = require("../helpers/axios")
const { CHANNEL_STREAK, CHANNEL_GOALS, CHANNEL_SHOP, ROLE_365STREAK, ROLE_100STREAK, ROLE_30STREAK, ROLE_7STREAK } = require("../helpers/config")
const GenerateImage = require("../helpers/GenerateImage")
const InfoUser = require("../helpers/InfoUser")
const LocalData = require("../helpers/LocalData")
const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")
const VacationMessage = require("../views/VacationMessage")
const ChannelController = require("./ChannelController")
const schedule = require('node-schedule');
const DailyStreakController = require("./DailyStreakController")

class VacationController{
    static async getMaxHoldVacationTicket(userId){
        const dataUser = await supabase.from("Users")
            .select('longestStreak')
            .eq('id',userId)
            .single()
        const {longestStreak} = dataUser.body

        if(!longestStreak) return 1
        else if(longestStreak >=365) return 7
        else if(longestStreak >=100) return 5
        else if(longestStreak >=30) return 3
        else if(longestStreak >=7) return 2
        else return 1
    }

    static async interactionShopVacationTicket(interaction){
        const [maxHoldVacation,totalPoint] = await Promise.all([
            VacationController.getMaxHoldVacationTicket(interaction.user.id),
            VacationController.getTotalPoint(interaction.user.id)
        ])
        interaction.editReply(VacationMessage.showListVacationTicket(interaction.user.id,totalPoint,maxHoldVacation))
    }

    static async interactionSelectOptionVacationTicket(interaction,valueMenu){
        const [totalTicket,isLocked] = valueMenu.split("-")
        if(isLocked){
            const idBadgeStreak = VacationController.getIdBadgeBasedOnTotalTicket(totalTicket)
            await interaction.editReply(VacationMessage.cannotClickLockedButton(idBadgeStreak))
        }else{
            const totalPoint = VacationController.calculatePriceVacationTicket(totalTicket)
            const isHaveEnoughPoint = await VacationController.isHaveEnoughPoint(interaction.user.id,totalPoint)

            if(isHaveEnoughPoint) await interaction.editReply(VacationMessage.confirmationBuyVacationTicket(interaction.user.id,totalTicket,totalPoint))
            else await interaction.editReply(VacationMessage.notHaveEnoughPoint(interaction.user.id))
        }
    }

    static async getTotalPoint(userId){
        const data = await supabase.from("Users")
            .select('totalPoint')
            .eq('id',userId)
            .single()
        return data.body.totalPoint
    }

    static async interactionBuyOneVacationTicket(interaction){
        const data = await supabase.from("Users")
                .select('goalId,longestStreak,totalDay,totalPoint')
                .eq("id",interaction.user.id)
                .single()
        const {goalId,longestStreak,totalDay,totalPoint} = data.body
        let goalName = 'Consistency'
        if (goalId) {
            const channelGoal = ChannelController.getChannel(interaction.client,CHANNEL_GOALS)
            const thread = await ChannelController.getThread(channelGoal,goalId)
            goalName = thread.name.split('by')[0]
        }
        if(data.body?.totalPoint >= 500){
            VacationController.updateMessageTotalTicketSold(interaction.client,1)

            supabase.from('VacationTickets')
                .insert({
                    UserId:interaction.user.id,
                    startDate:Time.getTodayDateOnly(),
                    endDate: Time.getTodayDateOnly(),
                    totalTicket: 1
                })
                .then()

            const pointLeft = totalPoint - 500
            VacationController.updatePoint(pointLeft,interaction.user.id)
            const channelStreak = ChannelController.getChannel(interaction.client,CHANNEL_STREAK)
            RequestAxios.get('todos/tracker/'+interaction.user.id)
            .then(async progressRecently=>{
                const avatarUrl = InfoUser.getAvatar(interaction.user)

                const buffer = await GenerateImage.tracker(interaction.user.username,goalName,avatarUrl,progressRecently,longestStreak,totalDay,pointLeft,true,0,true)
                const attachment = new MessageAttachment(buffer,`progress_tracker_${interaction.user.username}.png`)
                channelStreak.send({
                    content:`${interaction.user} in vacation mode 🏖`,
                    files:[
                        attachment
                    ]
                })
            })
            const todayDate = Time.getFormattedDate(Time.getDate())
            const tomorrowDate = Time.getFormattedDate(Time.getNextDate(1))
            await interaction.editReply(VacationMessage.successBuyOneVacationTicket(interaction.user.id,pointLeft,todayDate,tomorrowDate))

        }else{
            await interaction.editReply(VacationMessage.notHaveEnoughPoint(interaction.user.id))
        }
        interaction.message.delete()
    }

    static async interactionBuyTicketViaShop(interaction,totalTicket,startDate){
        const totalPrice = VacationController.calculatePriceVacationTicket(totalTicket)
        const data = await supabase.from("Users")
        .select('goalId,longestStreak,totalDay,totalPoint')
        .eq("id",interaction.user.id)
        .single()

        if(data.body?.totalPoint >= totalPrice){
            const {goalId,longestStreak,totalDay,totalPoint} = data.body
            const endDate = Time.getDateOnly(Time.getNextDate(totalTicket-1,startDate))
            const dataVacationUser = await VacationController.checkVacationTicket(interaction.user.id,startDate,endDate)

            if(dataVacationUser.isAlreadyHaveVacationTicket){
                await interaction.editReply(VacationMessage.pickAnotherDate(interaction.user.id,totalTicket,dataVacationUser.date))
            }else{
                const comebackDate = Time.getDateOnly(Time.getNextDate(totalTicket,startDate))
                let goalName = 'Consistency'
                if (goalId) {
                    const channelGoal = ChannelController.getChannel(interaction.client,CHANNEL_GOALS)
                    const thread = await ChannelController.getThread(channelGoal,goalId)
                    goalName = thread.name.split('by')[0]
                }

                VacationController.updateMessageTotalTicketSold(interaction.client,totalTicket)

                const listVacationTicket = []
                for (let i = 0; i < totalTicket; i++) {
                    listVacationTicket.push({
                        type:'vacation',
                        UserId:interaction.user.id,
                        message:Time.getDateOnly(Time.getNextDate(i,startDate))
                    })
                }

                supabase.from("Reminders")
                    .insert(listVacationTicket)
                    .then(data=>{
                        console.log(data);
                    })

                supabase.from('VacationTickets')
                    .insert({
                        UserId:interaction.user.id,
                        startDate,
                        endDate,
                        totalTicket
                    })
                    .then()

                const pointLeft = totalPoint - 500
                VacationController.updatePoint(pointLeft,interaction.user.id)
                if(startDate === Time.getTodayDateOnly()){
                    const channelStreak = ChannelController.getChannel(interaction.client,CHANNEL_STREAK)
                    await DailyStreakController.addSafetyDot(interaction.user.id,new Date())

                    RequestAxios.get('todos/tracker/'+interaction.user.id)
                        .then(async progressRecently=>{
                            const avatarUrl = InfoUser.getAvatar(interaction.user)

                            const vacationTicketLeft = totalTicket - 1
                            const isBuyOneVacation = totalTicket === 1
            
                            const buffer = await GenerateImage.tracker(interaction.user.username,goalName,avatarUrl,progressRecently,longestStreak,totalDay,pointLeft,true,vacationTicketLeft,isBuyOneVacation)
                            const attachment = new MessageAttachment(buffer,`progress_tracker_${interaction.user.username}.png`)
                            channelStreak.send({
                                content:`${interaction.user} in vacation mode 🏖`,
                                files:[
                                    attachment
                                ]
                            })
                        })
                }
                const formattedStartDate = Time.getFormattedDate(Time.getDate(startDate))
                const formattedEndDate = Time.getFormattedDate(Time.getDate(comebackDate))
                await interaction.editReply(VacationMessage.successBuyVacationTicket(interaction.user.id,totalTicket,pointLeft,formattedStartDate,formattedEndDate))
            }

            
        }else{
            await interaction.editReply(VacationMessage.notHaveEnoughPoint(interaction.user.id))
        }
    }

    static showModalCustomDate(interaction){
        if(interaction.customId.includes('useTicketCustomDate')){
            const modal = new Modal()
                .setCustomId(interaction.customId)
                .setTitle("🗓 Vacation start on")
                .addComponents(
                    new TextInputComponent().setCustomId('customDate').setLabel("Start Date").setPlaceholder("e.g. December 29").setStyle("SHORT").setRequired(true),
                )
			showModal(modal, { client: interaction.client, interaction: interaction});
            return true
        }else{
            return false
        }
    }

    static async notifyVacationEnded(client){
        let ruleNotifyVacationEnded = new schedule.RecurrenceRule();
        ruleNotifyVacationEnded.hour = Time.minus7Hours(6)
        ruleNotifyVacationEnded.minute = 0
        schedule.scheduleJob(ruleNotifyVacationEnded,async function(){
			const dataVacation = await supabase.from('VacationTickets')
                .select()
                .eq('endDate',Time.getTodayDateOnly())
            dataVacation.body.forEach(async vacation=>{
                const threadNotification = await ChannelController.getNotificationThread(client,vacation.UserId)
                threadNotification.send(VacationMessage.vacationDayEnded(vacation.UserId))
            })
		})
    }

    static async updatePoint(pointLeft,userId){
        return await supabase.from("Users")
            .update({totalPoint:pointLeft})
            .eq('id',userId)
    }

    static getVacationLeft(endVacationDate){
        const todayDate = Time.getDate(Time.getTodayDateOnly())
        const endDate = Time.getDate(endVacationDate)
        const diffDay =Time.getDiffDay(todayDate,endDate)
        return diffDay 
    }

    static async checkVacationTicket(userId,startDate,endDate){
        const result = {
            isAlreadyHaveVacationTicket: false,
            date:null
        }
        const data = await supabase.from("Reminders")
            .select()
            .gte('message',startDate)
            .lte('message',endDate)
            .eq("UserId",userId)
            .eq('type','vacation')
            .order('message',{ascending:true})

        if (data.body.length > 0) {
            result.isAlreadyHaveVacationTicket = true
            const dateOnly = data.body[0].message
            result.date = Time.getFormattedDate(Time.getDate(dateOnly),false,'long').split(',')[0]
        }
        return result
    }

    static getIdBadgeBasedOnTotalTicket(totalTicket){
        const data = {
            2:ROLE_7STREAK,
            3:ROLE_30STREAK,
            5:ROLE_100STREAK,
            7:ROLE_365STREAK
        }
        return data[totalTicket]
    }

    static async updateMessageTotalTicketSold(client,totalNewTicket){
        const {msgIdShop} = LocalData.getData()
        const channelShop = ChannelController.getChannel(client,CHANNEL_SHOP)
        const msg = await ChannelController.getMessage(channelShop,msgIdShop)
    	const totalTicket = Number(msg.content.match(/(\d+)/)[0] ) + totalNewTicket

        msg.edit(VacationMessage.initShopVacation(totalTicket))
    }

    static async getActiveVacationTicket(userId,dateOnly){
       return await supabase.from("VacationTickets")
            .select()
            .gte('endDate',dateOnly)
            .lte('startDate',dateOnly)
            .eq("UserId",userId)
            .limit(1)
            .single()
    }

    static async getAllActiveVacationTicket(dateOnly){
       return await supabase.from("VacationTickets")
            .select()
            .gte('endDate',dateOnly)
            .lte('startDate',dateOnly)
            .limit(1)
            .single()
    }

    static async isHaveEnoughPoint(userId,totalPrice){
        const totalPointUser = await VacationController.getTotalPoint(userId)
        return totalPointUser >= totalPrice
    }

    static calculatePriceVacationTicket(totalTicket){
        return totalTicket * 500
    }
}

module.exports = VacationController