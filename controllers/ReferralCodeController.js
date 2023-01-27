const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")
const schedule = require('node-schedule');
const referralCodes = require('referral-codes');
const ChannelController = require("./ChannelController");
const ReferralCodeMessage = require("../views/ReferralCodeMessage");
const LocalData = require("../helpers/LocalData.js");
const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const GenerateImage = require("../helpers/GenerateImage");
const { MessageAttachment } = require("discord.js");
class ReferralCodeController{
    static showModalRedeem(interaction){
        if(interaction.customId === 'redeem'){
			const modal = new Modal()
			.setCustomId("modalReferral")
			.setTitle("Referral Code")
			.addComponents(
				new TextInputComponent()
					.setCustomId('referral')
					.setLabel("Enter your referral code")
					.setStyle("SHORT")
					.setRequired(true)
			)
			showModal(modal, {
				client: interaction.client, // Client to show the Modal through the Discord API.
				interaction: interaction, // Show the modal with interaction data.
			});
			return true
		}
        return false
    }

    static async interactionClaimReferral(interaction,targetUserId){
        if (interaction.user.id !== targetUserId) {
            await interaction.editReply("⚠️ Can't claim other people's referrals")
            return
        }
        const dataReferral = await ReferralCodeController.getReferrals(targetUserId)
        if (dataReferral) {
            if (dataReferral.allReferralAlreadyBeenRedeemed) {
                await interaction.editReply(ReferralCodeMessage.allReferralAlreadyBeenRedeemed())
            }else{
                const totalDays = await ReferralCodeController.getTotalDays(targetUserId)
                await interaction.editReply(ReferralCodeMessage.showReferralCode(targetUserId,dataReferral.referralCode,dataReferral.expired,totalDays))
                ReferralCodeController.updateIsClaimed(targetUserId)
            }
        }else{
            await interaction.editReply(ReferralCodeMessage.dontHaveReferralCode())
        }
    }

    static async interactionGenerateReferral(interaction,targetUserId){
        if (interaction.user.id !== targetUserId) {
            await interaction.editReply("⚠️ Can't claim other people's referrals")
            return
        }

        const referralCodes = ReferralCodeController.getActiveReferralCodeFromMessage(interaction.message.content)
        const expire = ReferralCodeController.getExpiredDateFromMessage(interaction.message.content)
        
        if (referralCodes.length > 0) {
            const files = []

            for (let i = 0; i < referralCodes.length; i++) {
                const referralCode = referralCodes[i];
                const buffer = await GenerateImage.referralTicket(referralCode,expire)
                const attachment = new MessageAttachment(buffer,`referral_ticket_${interaction.user.username}.png`)
                files.push(attachment)
            }
            interaction.editReply({
                content:'**Share this referral ticket to your friends.**',
                files
            })
        }else{
            interaction.editReply(ReferralCodeMessage.allReferralAlreadyBeenRedeemed())
        }
    }
    static async generateReferral(client,user,threadProgress){
        const userId = user.id
        const isGenerateNewReferral = await ReferralCodeController.isEligibleGenerateNewReferral(userId)
        if (!isGenerateNewReferral) return

        const totalActiveReferral = await ReferralCodeController.getTotalActiveReferral(userId)
        if(totalActiveReferral > 1) return

        const totalNewReferral = await ReferralCodeController.getTotalNewReferral(userId,totalActiveReferral)
        if(totalNewReferral === 0) return

        const codes = referralCodes.generate({
            count:totalNewReferral,
            charset:referralCodes.charset(referralCodes.Charset.ALPHANUMERIC).toUpperCase(),
            length:10
        })
        const expiredDate = Time.getNextDate(14)
        const values = codes.map(code=>{
            return {
                UserId:userId,
                referralCode:code,
                expired:Time.getDateOnly(expiredDate),
                isRedeemed:false,
            }
        })

        ReferralCodeController.saveReminderClaimReferral(userId)
            .then(()=>{
                ReferralCodeController.remindToClaimReferral(client,userId)
            })
        
        await supabase.from("Referrals")
            .insert(values)

        supabase.from("Users")
        .select('id,notificationId')
        .eq("id",userId)
        .single()
        .then(async data=>{
            const isAdditionalReferral = totalActiveReferral === 1
            const {id:userId,notificationId} = data.body
            const formattedExpiredDate = Time.getFormattedDate(expiredDate)
            ChannelController.sendToNotification(
                client,
                ReferralCodeMessage.sendReferralCode(userId,totalNewReferral,isAdditionalReferral,formattedExpiredDate),
                userId,
                notificationId
            )
            user.send(ReferralCodeMessage.sendReferralCode(userId,totalNewReferral,isAdditionalReferral,formattedExpiredDate))
                .catch(err=>console.log("Cannot send message to user"))
        })
    }

    static async giftMilestoneDailyStreak(client,user,totalStreak=7){
        const userId = user.id
        const totalNewReferral = 1

        const codes = referralCodes.generate({
            count:totalNewReferral,
            charset:referralCodes.charset(referralCodes.Charset.ALPHANUMERIC).toUpperCase(),
            length:10
        })
        const expiredDate = Time.getNextDate(14)
        const values = codes.map(code=>{
            return {
                UserId:userId,
                referralCode:code,
                expired:Time.getDateOnly(expiredDate),
                isRedeemed:false,
            }
        })

        ReferralCodeController.saveReminderClaimReferral(userId)
            .then(()=>{
                ReferralCodeController.remindToClaimReferral(client,userId)
            })
        
        await supabase.from("Referrals")
            .insert(values)

        const totalActiveReferral = await ReferralCodeController.getTotalActiveReferral(userId)

        ChannelController.sendToNotification(
            client,
            ReferralCodeMessage.achieveFirstDailyStreak(totalNewReferral,totalActiveReferral,totalStreak,userId),
            userId,
        )
        user.send(ReferralCodeMessage.achieveFirstDailyStreak(totalNewReferral,totalActiveReferral,totalStreak,userId)) 
            .catch(err=>console.log("Cannot send message to user"))
    }

    static remindToClaimReferral(client,userId){
        if (userId) {
            supabase.from('Reminders')
                .select(',Users(notificationId)')
                .eq('type',"claimReferral")
                .eq('UserId',userId)
                .gte('time',new Date().toUTCString())
                .then(data=>{
                    if (data.body) {
                        data.body.forEach(async reminder=>{
                            schedule.scheduleJob(reminder.time,async function() {
                                const type = reminder.message === '5 days' ? 5 : 2
                                ChannelController.sendToNotification(
                                    client,
                                    ReferralCodeMessage.reminderClaimReferral(reminder.UserId,type),
                                    userId,
                                    reminder.Users.notificationId
                                )
                            })
                        })
                    }
                })
        }else{
            supabase.from('Reminders')
                .select('time,message,UserId,Users(notificationId)')
                .eq('type',"claimReferral")
                .gte('time',new Date().toUTCString())
                .then(data=>{
                    if (data.body) {
                        data.body.forEach(async reminder=>{
                            schedule.scheduleJob(reminder.time,async function() {
                                const type = reminder.message === '5 days' ? 5 : 2
                                ChannelController.sendToNotification(
                                    client,
                                    ReferralCodeMessage.reminderClaimReferral(reminder.UserId,type),
                                    reminder.UserId,
                                    reminder.Users.notificationId
                                )
                            })
                        })
                    }
                })
        }
    }

    static async saveReminderClaimReferral(userId){
        const reminder5Days = Time.getNextDate(9)
        const reminder2Days = Time.getNextDate(2)

        reminder5Days.setHours(Time.minus7Hours(8))
        reminder5Days.setMinutes(15)
        reminder2Days.setHours(Time.minus7Hours(8))
        reminder2Days.setMinutes(15)
        const data = await supabase.from('Reminders')
        .insert([
            {
                time:reminder5Days,
                message:'5 days',
                UserId:userId,
                type:"claimReferral"
            },
            {
                time:reminder2Days,
                message:'2 days',
                UserId:userId,
                type:'claimReferral'
            }
        ])
        return data
    }

    static async getTotalNewReferral(userId,totalActiveReferral){
        const data = await supabase.from("Users")
                .select('totalDaysThisCohort')
                .eq('id',userId)
                .single()
                
        const totalDaysThisCohort = data.body.totalDaysThisCohort
        let totalNewReferral = 0
        if (totalDaysThisCohort >= 18) {
            totalNewReferral = 2
        }else if(totalDaysThisCohort >= 12){
            totalNewReferral = 1
        }
        
        if(totalActiveReferral === 1 && totalNewReferral > 0){
            totalNewReferral -= 1
        }

        return totalNewReferral
    }

    static async getTotalActiveReferral(userId){
        const data = await supabase.from("Referrals")
            .select('id')
            .eq("UserId",userId)
            .gte("expired",Time.getTodayDateOnly())
        return data.body.length
    }

    static async isEligibleGenerateNewReferral(userId){
        const dataUser = await supabase.from("Users")
            .select("longestStreak")
            .eq('id',userId)
            .single()
        

        return dataUser.body?.longestStreak >= 7
    }

    static async getReferrals(userId){
        const data = await supabase.from("Referrals")
            .select()
            .eq('UserId',userId)
            .gte("expired",Time.getTodayDateOnly())

        if (data.body?.length > 0) {
            let allReferralAlreadyBeenRedeemed = true
            const referral = data.body.map(code=>{
                if(!code.isRedeemed) allReferralAlreadyBeenRedeemed = false
                return `${code.referralCode}${code.isRedeemed ? " (redeemed ✅)" :''}`
            })
            const expired = Time.getFormattedDate(Time.getDate(data.body[0].expired))
            return {
                expired,
                allReferralAlreadyBeenRedeemed,
                referralCode:referral.join('\n'),
            }
        }else{
            return null
        }
    }

    static async validateReferral(referralCode){
        const data = await supabase.from("Referrals")
            .select()
            .eq('referralCode',referralCode)
            .single()
        const response = {
            valid:true,
            description:"",
            ownedBy:null
        }
        if (data.body) {
            const referral = data.body
            response.ownedBy = data.body.UserId
            if (Time.getTodayDateOnly() > referral.expired ) {
                response.valid = false
                response.description = "expired"  
            }else if(referral.isRedeemed){
                response.valid = false
                response.description = 'redeemed'
            }
        }else{
            response.valid = false
            response.description = "invalid"
        }
        return response
    }

    static updateIsClaimed(userId){
        supabase.from("Referrals")
                .update({isClaimed:true})
                .eq('UserId',userId)
                .then()
                            
    }

    static async getTotalInvited(userId){
        const {data,count} = await supabase.from("Referrals")   
            .select('id', { count: 'exact' })
            .eq('isRedeemed',true)
            .eq('UserId',userId)
        return count

    }

    static async getTotalDays(userId) {
        const data = await supabase.from("Users")
        .select('totalDay')
        .eq("id",userId)
        .single()

        return data.body.totalDay
    }
    static async getTotalDaysThisCohort(userId) {
        const data = await supabase.from("Users")
        .select('totalDaysThisCohort')
        .eq("id",userId)
        .single()

        return data.body.totalDaysThisCohort
    }

    static async updateTotalDaysThisCohort(userId){
        const totalDaysThisCohort = await ReferralCodeController.getTotalDaysThisCohort(userId)

        const data = await supabase.from("Users")
            .update({totalDaysThisCohort:totalDaysThisCohort+1})
            .eq('id',userId)
        return data
    }

    static async resetTotalDaysThisCohort(){
        const {kickoffDate} = LocalData.getData()

        const date =  Time.getDate(kickoffDate)
        schedule.scheduleJob(date,function(){
            supabase.from("Users")
                .update({totalDaysThisCohort:0})
                .gt('totalDaysThisCohort',0)
                .then()
        })
        
    }

    static isTimeToGenerateReferral(){
        const {celebrationDate} = LocalData.getData()
        const oneWeekBeforeCelebration = Time.getDateOnly(Time.getNextDate(-8,celebrationDate))
        const todayDate = Time.getTodayDateOnly()

        return todayDate >= oneWeekBeforeCelebration && todayDate <= celebrationDate
    }

    

    static getExpiredDateFromMessage(msg){
        return msg.split('```')[0].split('*')[5].toUpperCase()
    }

    static getActiveReferralCodeFromMessage(msg){
        const referrals = msg.split('```')[1].split('\n')
        const referralCodes = []
        referrals.forEach(referral=>{
            if (!referral.includes("(redeemed ✅)") && referral !== '') {
                referralCodes.push(referral)
            }
        })
        
        return referralCodes
    }

    static async isFirstTimeRedeemReferral(userId){
        const data = await supabase.from("Referrals")
            .select("id")
            .eq('redeemedBy',userId)
        
        return data.body?.length === 0
    }

    static async isEligibleToRedeemRederral(userId){
        const data = await supabase.from("Users")
            .select('endMembership')
            .eq("id",userId)
            .single()
            
        return data.body?.endMembership === null
    }
}

module.exports = ReferralCodeController