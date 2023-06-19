const { CHANNEL_NOTIFICATION } = require("../helpers/config")
const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")
const GuidelineInfoMessage = require("../views/GuidelineInfoMessage")
const OnboardingMessage = require("../views/OnboardingMessage")
const ChannelController = require("./ChannelController")
const ReferralCodeController = require("./ReferralCodeController")
const UserController = require("./UserController")
const schedule = require('node-schedule');
class GuidelineInfoController {

    static async generateGuideline(client,userId,notificationId){
        const notificationThread = await ChannelController.getNotificationThread(client,userId,notificationId)
 
        const {isHaveReferral,isHaveProfile,showSubmitTestimonial,endMembership,totalReferral,onboardingStep,statusCompletedQuest} = await GuidelineInfoController.getData(userId)
        let msgContent 
        
        if(onboardingStep) msgContent = OnboardingMessage.guidelineInfoQuest(userId,onboardingStep,statusCompletedQuest)
        else msgContent = GuidelineInfoMessage.guideline(userId,endMembership,isHaveProfile,isHaveReferral,showSubmitTestimonial,totalReferral)

		const msgGuideline = await notificationThread.send(msgContent)
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
        const data = await supabase.from("GuidelineInfos")
            .select()
            .eq('UserId',UserId)
            .single()
        if(data.body){
            return await supabase.from("GuidelineInfos")
                .update({id:msgGuidelineId})
                .eq("UserId",UserId)
        }else{
            return await supabase.from("GuidelineInfos")
                .insert({
                    UserId,
                    id:msgGuidelineId,
                })
        }
    }

    static async getData(UserId){
        const [data, isHaveReferral,isHaveProfile,totalReferral] = await Promise.all([
            supabase.from("GuidelineInfos")
                .select("*,Users(endMembership,onboardingStep)")
                .eq('UserId',UserId)
                .single(),
            GuidelineInfoController.isHaveReferral(UserId),
            GuidelineInfoController.isHaveProfile(UserId),
            ReferralCodeController.getTotalInvited(UserId)
        ])
        if(!data.body) return {isHaveReferral,isHaveProfile,totalReferral}
        
        const {id,showSubmitTestimonial,totalNotification,statusCompletedQuest} = data.body
        let {endMembership,onboardingStep} = data.body.Users
        if(onboardingStep !== 'done' && onboardingStep !== null) return {onboardingStep,statusCompletedQuest,totalNotification,msgGuidelineId:id,}
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
        if(!totalNotification) return ChannelController.sendError('deleteNotification',`${thread.name}: ${totalNotification}`)

        try {
            await thread.bulkDelete(totalNotification <= 100 ? totalNotification : 100)
            totalNotification -= 100
            if(totalNotification > 0) GuidelineInfoController.deleteNotification(thread,totalNotification)
        } catch (error) {
            ChannelController.sendError(error,`${thread.name}: ${totalNotification}`)            
        }
    }

    static async updateMessageGuideline(client,UserId){
        const {isHaveReferral,isHaveProfile,showSubmitTestimonial,endMembership,msgGuidelineId,totalReferral,onboardingStep,statusCompletedQuest} = await GuidelineInfoController.getData(UserId)
        const threadNotification = await ChannelController.getNotificationThread(client,UserId)
        const msg = await ChannelController.getMessage(threadNotification,msgGuidelineId)

        if(onboardingStep) msg.edit(OnboardingMessage.guidelineInfoQuest(UserId,onboardingStep,statusCompletedQuest))
        else msg.edit(GuidelineInfoMessage.guideline(UserId,endMembership,isHaveProfile,isHaveReferral,showSubmitTestimonial,totalReferral))
        
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
            for (let i = 0; i < dataUser.body.length; i++) {
                await Time.wait(1000)
                const {Users:{id,notificationId}} = dataUser.body[i];
                try {
                    const {isHaveReferral,isHaveProfile,totalNotification,showSubmitTestimonial,endMembership,msgGuidelineId,totalReferral,onboardingStep,statusCompletedQuest} = await GuidelineInfoController.getData(id)
                    const threadNotification = await ChannelController.getThread(channelNotification,notificationId)
                    if(!threadNotification) return ChannelController.sendError('Thread undefined',id)
                    if(threadNotification.archived) {
                        await threadNotification.setArchived(false)
                    }
                    
                    const msg = await ChannelController.getMessage(threadNotification,msgGuidelineId)
                    if(!msg) return ChannelController.sendError('msg undefined',id)
                    if(onboardingStep) msg.edit(OnboardingMessage.guidelineInfoQuest(id,onboardingStep,statusCompletedQuest))
                    else msg.edit(GuidelineInfoMessage.guideline(id,endMembership,isHaveProfile,isHaveReferral,showSubmitTestimonial,totalReferral))

                    GuidelineInfoController.deleteNotification(threadNotification,totalNotification)
                    GuidelineInfoController.resetDataTotalNotification(id)
                } catch (error) {
                    ChannelController.sendError(error,id)
                }
                
            }
        })
    }

    static async incrementTotalNotification(total,UserId){
        return await supabase.rpc('incrementTotalNotification', { x: total, row_id: UserId })
    }

    static async updateStatusCompletedQuest(UserId,step){
        const data = await supabase.from("GuidelineInfos")
        .select('statusCompletedQuest')
        .eq('UserId',UserId)
        .single()

        const statusCompletedQuest = {...data.body.statusCompletedQuest}
        statusCompletedQuest[step] = true
        const updatedData = await supabase.from("GuidelineInfos")
            .update({statusCompletedQuest})
            .eq('UserId',UserId)
            .single()
        return data.body.statusCompletedQuest[step] === updatedData.body.statusCompletedQuest[step]

    }
}

module.exports = GuidelineInfoController