const { CHANNEL_NOTIFICATION } = require("../helpers/config")
const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")
const GuidelineInfoMessage = require("../views/GuidelineInfoMessage")
const ChannelController = require("./ChannelController")
const ReferralCodeController = require("./ReferralCodeController")
const UserController = require("./UserController")
const schedule = require('node-schedule');
class GuidelineInfoController {

    static async generateGuideline(client,userId){
        const notificationThread = await ChannelController.getNotificationThread(client,userId)
        const [isHaveReferral,dataUser] = await Promise.all([
            GuidelineInfoController.isHaveReferral(userId),
            UserController.getDetail(userId,'endMembership')
        ])
        let endMembership = dataUser.body?.endMembership
        if(endMembership) endMembership = Time.getFormattedDate(Time.getDate(endMembership),false,'long')
		const msgGuideline = await notificationThread.send(GuidelineInfoMessage.guideline(userId,endMembership,isHaveReferral))
		GuidelineInfoController.addNewData(userId,msgGuideline.id)
    }

    static async resetDataTotalNotification(UserId){
        return await supabase.from("GuidelineInfos")
            .update({totalNotification:0})
            .eq('UserId',UserId)
    }
    static async updateDataShowTestimonial(UserId,showSubmitTestimonial=false){
        return await supabase.from("GuidelineInfos")
            .update({showSubmitTestimonial})
            .eq('UserId',UserId)
    }

    static async deleteData(UserId){
        return await supabase.from("GuidelineInfos")
            .delete()
            .eq("UserId",UserId)
    }

    static async isHaveReferral(UserId){
        const data = await supabase.from("Referrals")
            .select('id')
            .eq("UserId",UserId)
            .is('redeemedBy',null)
        return data.body.length > 0
    }
    
    static async isHaveProfile(UserId){
        const data = await supabase.from("Intros")
            .select('id')
            .eq('UserId',UserId)
            .limit(1)
            .single()
        return !!data.body
    }

    static async addNewData(UserId,msgGuidelineId){
        return await supabase.from("GuidelineInfos")
            .insert({
                UserId,
                id:msgGuidelineId,
            })
    }

    static async getData(UserId){
        const [data, isHaveReferral,isHaveProfile,totalReferral] = await Promise.all([
            supabase.from("GuidelineInfos")
                .select("*,Users(endMembership)")
                .eq('UserId',UserId)
                .single(),
            GuidelineInfoController.isHaveReferral(UserId),
            GuidelineInfoController.isHaveProfile(UserId),
            ReferralCodeController.getTotalInvited(response.ownedBy)
        ])
        if(!data.body) return {isHaveReferral,isHaveProfile}
        
        const {id,showSubmitTestimonial,totalNotification} = data.body
        let endMembership = data.body.Users.endMembership
        if(endMembership) endMembership = Time.getFormattedDate(Time.getDate(endMembership),false,'long')

        return {
            isHaveProfile,
            isHaveReferral,
            totalNotification,
            showSubmitTestimonial,
            endMembership,
            msgGuidelineId:id,
            totalReferral
        }
    }

    static async deleteNotification(thread,totalNotification){
        if(totalNotification <= 0) return

        await thread.bulkDelete(totalNotification <= 100 ? totalNotification : 100)
        totalNotification -= 100
        if(totalNotification > 0) GuidelineInfoController.deleteNotification(thread,totalNotification)
    }

    static async updateMessageGuideline(client,UserId){
        const {isHaveReferral,isHaveProfile,showSubmitTestimonial,endMembership,msgGuidelineId,totalReferral} = await GuidelineInfoController.getData(UserId)
        const threadNotification = await ChannelController.getNotificationThread(client,UserId)
        const msg = await ChannelController.getMessage(threadNotification,msgGuidelineId)
        msg.edit(GuidelineInfoMessage.guideline(UserId,endMembership,isHaveProfile,isHaveReferral,showSubmitTestimonial,totalReferral))
    }

    static async updateAllGuideline(client){
        let ruleUpdateAllGuideline = new schedule.RecurrenceRule();
		ruleUpdateAllGuideline.hour = Time.minus7Hours(0)
		ruleUpdateAllGuideline.minute = 1
		schedule.scheduleJob(ruleUpdateAllGuideline,async function(){
            const dataUser = await supabase.from("GuidelineInfos")
                .select('*,Users(id,notificationId)')
                .gt('totalNotification',0)
            const channelNotification = ChannelController.getChannel(client,CHANNEL_NOTIFICATION)
            dataUser.body.forEach(async ({Users:{id,notificationId}})=>{
                try {
                    const {isHaveReferral,isHaveProfile,totalNotification,showSubmitTestimonial,endMembership,msgGuidelineId,totalReferral} = await GuidelineInfoController.getData(id)
                    const threadNotification = await ChannelController.getThread(channelNotification,notificationId)
                    
                    GuidelineInfoController.deleteNotification(threadNotification,totalNotification)
                    GuidelineInfoController.resetDataTotalNotification(id)
                    const msg = await ChannelController.getMessage(threadNotification,msgGuidelineId)
                    msg.edit(GuidelineInfoMessage.guideline(id,endMembership,isHaveProfile,isHaveReferral,showSubmitTestimonial,totalReferral))
                } catch (error) {
                    ChannelController.sendError(error,id)
                }

            })
        })
    }
}

module.exports = GuidelineInfoController