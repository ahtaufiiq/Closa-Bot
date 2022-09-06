const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")
const referralCodes = require('referral-codes');
const ChannelController = require("./ChannelController");
const ReferralCodeMessage = require("../views/ReferralCodeMessage");
class ReferralCodeController{
    static async generateReferral(client,userId,total=3){
        const codes = referralCodes.generate({
            count:total,
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
        
        const data = await supabase.from("Referrals")
            .insert(values)
        console.log('masuk');
        
        supabase.from("Users")
        .select('id,notification_id')
        .eq("id",userId)
        .single()
        .then(async data=>{
            console.log(data);
            const notificationThread = await ChannelController.getNotificationThread(client,data.body.id,data.body.notification_id)
            notificationThread.send(ReferralCodeMessage.sendReferralCode(data.body.id,total))
        })
        
    }

    static async getReferrals(userId){
        const data = await supabase.from("Referrals")
            .select()
            .eq('UserId',userId)
            .eq("isRedeemed",false)
            .gte("expired",Time.getTodayDateOnly())

        if (data.body?.length > 0) {
            const referral = data.body.map(code=>{
                return `${code.referralCode} ${code.isRedeemed ? "(redeemed ✅)" :''}`
            })
            const expired = Time.getFormattedDate(Time.getDate(data.body[0].expired))
            return {
                expired,
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
        const response = {
            valid:true,
            description:""
        }
        if (data.body?.length > 0) {
            const referral = data.body[0]
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
}

module.exports = ReferralCodeController