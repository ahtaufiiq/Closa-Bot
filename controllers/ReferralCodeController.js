const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")
const schedule = require('node-schedule');
const referralCodes = require('referral-codes');
const ChannelController = require("./ChannelController");
const ReferralCodeMessage = require("../views/ReferralCodeMessage");
const LocalData = require("../helpers/getData");
const RequestAxios = require("../helpers/axios");
class ReferralCodeController{
    static async generateReferral(client,userId){
        const isGenerateNewReferral = await ReferralCodeController.isEligibleGenerateNewReferral(userId)
        if (!isGenerateNewReferral) return

        const totalReferral = await ReferralCodeController.getTotalReferral(userId)
        if(totalReferral === 0) return

        const codes = referralCodes.generate({
            count:totalReferral,
            charset:referralCodes.charset(referralCodes.Charset.ALPHANUMERIC).toUpperCase(),
            length:10
        })

        const values = codes.map(code=>{
            return {
                UserId:userId,
                referralCode:code,
                expired:Time.getDateOnly(Time.getNextDate(18)),
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
        .select('id,notification_id')
        .eq("id",userId)
        .single()
        .then(async data=>{
            const notificationThread = await ChannelController.getNotificationThread(client,data.body.id,data.body.notification_id)
            notificationThread.send(ReferralCodeMessage.sendReferralCode(data.body.id,totalReferral))
        })
    }

    static remindToClaimReferral(client,userId){
        if (userId) {
            supabase.from('Reminders')
                .select('*,Users(notification_id)')
                .eq('type',"claimReferral")
                .eq('UserId',userId)
                .gte('time',new Date().toUTCString())
                .then(data=>{
                    data.body.forEach(async reminder=>{
                        schedule.scheduleJob(reminder.time,async function() {
                            const type = reminder.message === '5 days' ? 5 : 2
                            const notificationThread = await ChannelController.getNotificationThread(client,reminder.UserId,reminder.Users.notification_id)
                            notificationThread.send(ReferralCodeMessage.reminderClaimReferral(reminder.UserId,type))
                        })
                    })
                })
        }else{
            supabase.from('Reminders')
                .select('*,Users(notification_id)')
                .eq('type',"claimReferral")
                .gte('time',new Date().toUTCString())
                .then(data=>{
                    data.body.forEach(async reminder=>{
                        schedule.scheduleJob(reminder.time,async function() {
                            const type = reminder.message === '5 days' ? 5 : 2
                            const notificationThread = await ChannelController.getNotificationThread(client,reminder.UserId,reminder.Users.notification_id)
                            notificationThread.send(ReferralCodeMessage.reminderClaimReferral(reminder.UserId,type))
                        })
                    })
                })
        }
    }

    static async saveReminderClaimReferral(userId){
        const reminder5Days = Time.getNextDate(13)
        const reminder2Days = Time.getNextDate(16)

        reminder5Days.setHours(Time.minus7Hours(8))
        reminder5Days.setMinutes(0)
        reminder2Days.setHours(Time.minus7Hours(8))
        reminder2Days.setMinutes(0)
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

    static async getTotalReferral(userId){
        const data = await RequestAxios.get(`todos/tracker/${userId}`)
        const totalDone = data.length
        if (totalDone >= 12) {
            return 1
        }else if(totalDone >= 18){
            return 2
        }else{
            return 0
        }
    }

    static async isEligibleGenerateNewReferral(userId){
        const data = await supabase.from("Referrals")
            .select('id')
            .eq("UserId",userId)
            .gte("expired",Time.getTodayDateOnly())
        
        if (data.body?.length > 0) return false

        const dataUser = await supabase.from("Users")
            .select("longest_streak")
            .eq('id',userId)
            .single()
        

        return dataUser.body?.longest_streak >= 7
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

    static isTimeToGenerateReferral(){
        const {celebrationDate} = LocalData.getData()
        const oneWeekBeforeCelebration = Time.getDateOnly(Time.getNextDate(-7,celebrationDate))
        const todayDate = Time.getTodayDateOnly()

        return todayDate > oneWeekBeforeCelebration && todayDate <= celebrationDate
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
            .select('end_membership')
            .eq("id",userId)
            .single()
            
        return data.body?.end_membership === null
    }
}

module.exports = ReferralCodeController