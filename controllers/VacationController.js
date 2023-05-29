const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const { AttachmentBuilder } = require("discord.js")
const RequestAxios = require("../helpers/axios")
const { CHANNEL_STREAK, CHANNEL_GOALS, CHANNEL_SHOP, ROLE_365STREAK, ROLE_100STREAK, ROLE_30STREAK, ROLE_7STREAK, CHANNEL_TODO } = require("../helpers/config")
const GenerateImage = require("../helpers/GenerateImage")
const InfoUser = require("../helpers/InfoUser")
const LocalData = require("../helpers/LocalData")
const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")
const VacationMessage = require("../views/VacationMessage")
const ChannelController = require("./ChannelController")
const schedule = require('node-schedule');
const DailyStreakController = require("./DailyStreakController");
const MemberController = require('./MemberController');
const UserController = require('./UserController');
const MessageFormatting = require('../helpers/MessageFormatting');
const getRandomValue = require('../helpers/getRandomValue');
const PartyController = require('./PartyController');

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
            UserController.getTotalPoint(interaction.user.id)
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

    static async interactionBuyOneVacationTicket(interaction){
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
        if(data.body?.totalPoint >= 250){
            VacationController.updateMessageTotalTicketSold(interaction.client,1)

            supabase.from('VacationTickets')
                .insert({
                    UserId:interaction.user.id,
                    startDate:Time.getTodayDateOnly(),
                    endDate: Time.getTodayDateOnly(),
                    totalTicket: 1
                })
                .then()
            VacationController.addSafetyDotIfMissOnce(interaction.user.id,lastDone)
            const pointLeft = totalPoint - 250
            UserController.updatePoint(pointLeft,interaction.user.id)
            const channelStreak = ChannelController.getChannel(interaction.client,CHANNEL_STREAK)

            UserController.updateLastSafety(Time.getTodayDateOnly(),interaction.user.id)
            await DailyStreakController.addSafetyDot(interaction.user.id,new Date())

            RequestAxios.get('todos/tracker/'+interaction.user.id)
            .then(async progressRecently=>{
                const avatarUrl = InfoUser.getAvatar(interaction.user)

                const buffer = await GenerateImage.tracker(interaction.user,goalName,avatarUrl,progressRecently,longestStreak,totalDay,pointLeft,true,0,true)
                const attachment = new AttachmentBuilder(buffer,{name:`progress_tracker_${interaction.user.username}.png`})
                channelStreak.send(VacationMessage.onVacationMode(interaction.user.id,attachment,0,true))
            })

            UserController.updateOnVacation(true,interaction.user.id)
            PartyController.updateDataProgressRecap(interaction.user.id,'vacation')
            VacationController.shareToProgress(interaction.client,[{name:interaction.user.username,id:interaction.user.id}])
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
        .select('goalId,longestStreak,totalDay,totalPoint,lastDone')
        .eq("id",interaction.user.id)
        .single()

        if(data.body?.totalPoint >= totalPrice){
            const {goalId,longestStreak,totalDay,totalPoint,lastDone} = data.body
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
                    const date = Time.getDateOnly(Time.getNextDate(i,startDate))
                    if(date !== Time.getTodayDateOnly()){
                        listVacationTicket.push({
                            type:'vacation',
                            UserId:interaction.user.id,
                            message: date
                        })
                    }
                }

                supabase.from("Reminders")
                    .insert(listVacationTicket)
                    .then()

                supabase.from('VacationTickets')
                    .insert({
                        UserId:interaction.user.id,
                        startDate,
                        endDate,
                        totalTicket
                    })
                    .then()

                const pointLeft = totalPoint - 250
                UserController.updatePoint(pointLeft,interaction.user.id)
                if(startDate === Time.getTodayDateOnly()){
                    const channelStreak = ChannelController.getChannel(interaction.client,CHANNEL_STREAK)
                    VacationController.addSafetyDotIfMissOnce(interaction.user.id,lastDone)
                    UserController.updateLastSafety(Time.getTodayDateOnly(),interaction.user.id)
                    await DailyStreakController.addSafetyDot(interaction.user.id,new Date())
                    PartyController.updateDataProgressRecap(interaction.user.id,'vacation')
                    VacationController.shareToProgress(interaction.client,[{name:interaction.user.username,id:interaction.user.id}])
                    RequestAxios.get('todos/tracker/'+interaction.user.id)
                        .then(async progressRecently=>{
                            const avatarUrl = InfoUser.getAvatar(interaction.user)

                            const vacationTicketLeft = totalTicket - 1
                            const isBuyOneVacation = totalTicket === 1
            
                            const buffer = await GenerateImage.tracker(interaction.user,goalName,avatarUrl,progressRecently,longestStreak,totalDay,pointLeft,true,vacationTicketLeft,isBuyOneVacation)
                            const attachment = new AttachmentBuilder(buffer,{name:`progress_tracker_${interaction.user.username}.png`})
                            channelStreak.send(VacationMessage.onVacationMode(interaction.user.id,attachment,vacationTicketLeft,isBuyOneVacation))
                        })

                    UserController.updateOnVacation(true,interaction.user.id)
                }
                const formattedStartDate = Time.getFormattedDate(Time.getDate(startDate))
                const formattedEndDate = Time.getFormattedDate(Time.getDate(comebackDate))
                await interaction.editReply(VacationMessage.successBuyVacationTicket(interaction.user.id,totalTicket,pointLeft,formattedStartDate,formattedEndDate))
            }

            
        }else{
            await interaction.editReply(VacationMessage.notHaveEnoughPoint(interaction.user.id))
        }
    }

    static async addSafetyDotIfMissOnce(userId,lastDone){
        if (Time.onlyMissOneDay(lastDone)) {
            const missedDate = Time.getNextDate(-1)
            missedDate.setHours(8)
            await DailyStreakController.addSafetyDot(userId,missedDate)
        }
    }

    static async activateVacationTicket(client){
        let ruleActivateVacation = new schedule.RecurrenceRule();
		ruleActivateVacation.hour = Time.minus7Hours(8)
		ruleActivateVacation.minute = 0
		schedule.scheduleJob(ruleActivateVacation,async function(){
            const data = await VacationController.getAllActiveVacationTicket(Time.getTodayDateOnly())
            const users = data.body.map(el => el.Users)
            VacationController.shareToProgress(client,users)
            
            for (let i = 0; i < data.body.length; i++) {
                const vacation = data.body[i];
                const userId = vacation.UserId
                PartyController.updateDataProgressRecap(userId,'vacation')
                const {goalId,longestStreak,totalDay,totalPoint,lastDone} = vacation.Users
                const channelStreak = ChannelController.getChannel(client,CHANNEL_STREAK)
                const {user} = await MemberController.getMember(client,userId)

                const vacationLeft = VacationController.getVacationLeft(vacation.endDate)
                let goalName = 'Consistency'
                if (goalId) {
                    const channelGoal = ChannelController.getChannel(client,CHANNEL_GOALS)
                    const thread = await ChannelController.getThread(channelGoal,goalId)
                    goalName = thread.name.split('by')[0]
                }
                VacationController.addSafetyDotIfMissOnce(userId,lastDone)
                UserController.updateLastSafety(Time.getTodayDateOnly(),userId)
                await DailyStreakController.addSafetyDot(userId,new Date())
                
                RequestAxios.get('todos/tracker/'+userId)
                .then(async progressRecently=>{
                    const avatarUrl = InfoUser.getAvatar(user)

                    const buffer = await GenerateImage.tracker(user,goalName,avatarUrl,progressRecently,longestStreak,totalDay,totalPoint,true,vacationLeft)
                    const attachment = new AttachmentBuilder(buffer,{name:`progress_tracker_${user.username}.png`})
                    channelStreak.send(VacationMessage.onVacationMode(user.id,attachment,vacationLeft))
                })


                UserController.updateOnVacation(true,userId)
            }
        })
    }

    static async shareToProgress(client,users){
        if(users.length === 0 ) return
        const vacationGifs = [
            "https://media.giphy.com/media/mHHIyJFfa2UTARzFLw/giphy.gif",
            "https://media.giphy.com/media/fsnNbATnG7YT2lSfQV/giphy.gif",
            "https://media.giphy.com/media/Yk4zL0BFKh2D2gAZ0p/giphy.gif",
            "https://media.giphy.com/media/TFYyfFrqxuExEM5r04/giphy.gif",
            "https://media.giphy.com/media/58wR2Nv7nDOZ9d7yBg/giphy.gif",
            "https://media.giphy.com/media/et6C65bTNXPZiSkj7X/giphy.gif",
            "https://media.giphy.com/media/C2L2bXRnv2chSO1mAH/giphy.gif",
            "https://media.giphy.com/media/l4FAS5vgLprhkrt04/giphy.gif",
            "https://media.giphy.com/media/3ohuPA1HiVmrcwKOuA/giphy.gif",
            "https://media.giphy.com/media/WoKPNOr1jrdsc/giphy.gif",
            "https://media.giphy.com/media/l2SqfuVPmWDuydRHa/giphy.gif",
            "https://media.giphy.com/media/KD2SBgMMWCkLCxC32Z/giphy.gif",
        ]

        const randomGif = getRandomValue(vacationGifs)
        const channelProgress = ChannelController.getChannel(client,CHANNEL_TODO)
        const tagUsers = users.map(user=>MessageFormatting.tagUser(user.id))
        const msg = await channelProgress.send(VacationMessage.vacationModeOn(tagUsers.join(' '),randomGif))
        let usersOnVacation = users[0].name
        for (let i = 1; i < users.length; i++) {
            const name = users[i].name;
            if(i === 2 && i !== users.length - 1){
                usersOnVacation += ', & others'
                break
            } 
            if(i === users.length - 1) usersOnVacation += `, & ${name}`
            else usersOnVacation += `, ${name}`
        }
        msg.startThread({
            name: `${usersOnVacation} on vacation mode `,
        });
    }

    static showModalCustomDate(interaction){
        if(interaction.customId.includes('useTicketCustomDate')){
            const modal = new Modal()
                .setCustomId(interaction.customId)
                .setTitle("🗓 Vacation start on")
                .addComponents(
                    new TextInputComponent().setCustomId('customDate').setLabel("Start Date").setPlaceholder("e.g. 18 December").setStyle("SHORT").setRequired(true),
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
                .eq('endDate',Time.getDateOnly(Time.getNextDate(-1)))
            dataVacation.body.forEach(async vacation=>{
                ChannelController.sendToNotification(
                    client,
                    VacationMessage.vacationDayEnded(vacation.UserId),
                    vacation.UserId
                )
                UserController.updateOnVacation(false,vacation.UserId)
            })
		})
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
    	const totalTicket = Number(msg.embeds[0].description.split('each')[1].match(/(\d+)/)[0] ) + totalNewTicket

        msg.edit(VacationMessage.initShopVacation(totalTicket))
    }

    static async getAllActiveVacationTicket(dateOnly){
       return await supabase.from("VacationTickets")
            .select('*,Users(id,name,goalId,longestStreak,totalDay,totalPoint,lastDone)')
            .gte('endDate',dateOnly)
            .lte('startDate',dateOnly)
    }

    static async isHaveEnoughPoint(userId,totalPrice){
        const totalPointUser = await UserController.getTotalPoint(userId)
        return totalPointUser >= totalPrice
    }

    static calculatePriceVacationTicket(totalTicket){
        return totalTicket * 250
    }
}

module.exports = VacationController