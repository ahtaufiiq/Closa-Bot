const DiscordWebhook = require("../helpers/DiscordWebhook")
const { CHANNEL_NOTIFICATION } = require("../helpers/config")
const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")
const GuidelineInfoMessage = require("../views/GuidelineInfoMessage")
const OnboardingMessage = require("../views/OnboardingMessage")
const ChannelController = require("./ChannelController")
const MemberController = require("./MemberController")
const ReferralCodeController = require("./ReferralCodeController")
const UserController = require("./UserController")
const schedule = require('node-schedule');
class GuidelineInfoController {

    static async generateGuideline(client,userId,notificationId){

        const {isHaveProfile,showSubmitTestimonial,endMembership,totalInvite,onboardingStep,statusCompletedQuest} = await GuidelineInfoController.getData(userId)
        let msgContent 
        
        if(onboardingStep) msgContent = OnboardingMessage.guidelineInfoQuest(userId,onboardingStep,statusCompletedQuest)
        else msgContent = GuidelineInfoMessage.guideline(userId,endMembership,isHaveProfile,showSubmitTestimonial,totalInvite)

        const notificationThread = await ChannelController.getNotificationThread(client,userId,notificationId)
        let msgGuidelineId
        if(!notificationThread){
            const channelNotifications = ChannelController.getChannel(client,CHANNEL_NOTIFICATION)
            const {user} = await MemberController.getMember(client,userId)
            const thread = await ChannelController.createPrivateThread(channelNotifications,user.username)
            const msgGuideline = await thread.send(msgContent)
            msgGuidelineId = msgGuideline.id
            supabase.from("Users")
			.update({notificationId:thread.id})
			.eq('id',userId)
            .then()
        }else{
            const msgGuideline = await notificationThread.send(msgContent)
            msgGuidelineId = msgGuideline.id
        }
		GuidelineInfoController.addNewData(userId,msgGuidelineId)
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
        return data.data.length > 0
    }
    
    static async isHaveProfile(UserId){
        const data = await supabase.from("Intros")
            .select('id')
            .eq('UserId',UserId)
            .limit(1)
            .single()
        return !!data.data
    }

    static async addNewData(UserId,msgGuidelineId){
        const data = await supabase.from("GuidelineInfos")
            .select()
            .eq('UserId',UserId)
            .single()
        if(data.data){
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
        const [data,isHaveProfile,totalInvite] = await Promise.all([
            supabase.from("GuidelineInfos")
                .select("*,Users(endMembership,onboardingStep)")
                .eq('UserId',UserId)
                .single(),
            GuidelineInfoController.isHaveProfile(UserId),
            ReferralCodeController.getTotalInvited(UserId)
        ])
        if(!data.data) return {isHaveProfile,totalInvite}
        
        const {id,showSubmitTestimonial,totalNotification,statusCompletedQuest} = data.data
        let {endMembership,onboardingStep} = data.data.Users
        if(onboardingStep !== 'done' && onboardingStep !== null) return {onboardingStep,statusCompletedQuest,totalNotification,msgGuidelineId:id,}
        if(endMembership) endMembership = Time.getFormattedDate(Time.getDate(endMembership),false,'long')

        return {
            isHaveProfile,
            totalNotification,
            showSubmitTestimonial,
            endMembership,
            msgGuidelineId:id,
            totalInvite
        }
    }

    static async deleteNotification(thread,totalNotification){
        if(!totalNotification) return DiscordWebhook.sendError('deleteNotification',`${thread.name}: ${totalNotification}`)

        try {
            await thread.bulkDelete(totalNotification <= 100 ? totalNotification : 100)
            totalNotification -= 100
            if(totalNotification > 0) GuidelineInfoController.deleteNotification(thread,totalNotification)
        } catch (error) {
            DiscordWebhook.sendError(error,`${thread.name}: ${totalNotification}`)            
        }
    }

    static async updateMessageGuideline(client,UserId){
        const {isHaveProfile,showSubmitTestimonial,endMembership,msgGuidelineId,totalInvite,onboardingStep,statusCompletedQuest} = await GuidelineInfoController.getData(UserId)
        const threadNotification = await ChannelController.getNotificationThread(client,UserId)
        const msg = await ChannelController.getMessage(threadNotification,msgGuidelineId)
        if(threadNotification.archived) {
            await threadNotification.setArchived(false)
        }
        if(onboardingStep) msg.edit(OnboardingMessage.guidelineInfoQuest(UserId,onboardingStep,statusCompletedQuest))
        else msg.edit(GuidelineInfoMessage.guideline(UserId,endMembership,isHaveProfile,showSubmitTestimonial,totalInvite))
        
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
            for (let i = 0; i < dataUser.data.length; i++) {
                await Time.wait(5000)
                const {Users:{id,notificationId}} = dataUser.data[i];
                try {
                    const {isHaveProfile,totalNotification,showSubmitTestimonial,endMembership,msgGuidelineId,totalInvite,onboardingStep,statusCompletedQuest} = await GuidelineInfoController.getData(id)
                    const threadNotification = await ChannelController.getThread(channelNotification,notificationId)
                    if(!threadNotification){
                        DiscordWebhook.sendError('delete notification: Thread undefined',id)
                        continue
                    }
                    if(threadNotification.archived) {
                        await threadNotification.setArchived(false)
                    }
                    await GuidelineInfoController.deleteNotification(threadNotification,totalNotification)
                    GuidelineInfoController.resetDataTotalNotification(id)
                    let guideline
                    if(onboardingStep) guideline = OnboardingMessage.guidelineInfoQuest(id,onboardingStep,statusCompletedQuest)
                    else guideline = GuidelineInfoMessage.guideline(id,endMembership,isHaveProfile,showSubmitTestimonial,totalInvite)

                    const msg = await ChannelController.getMessage(threadNotification,msgGuidelineId)
                    if(!msg) {
                        DiscordWebhook.sendError('delete notification: msg undefined',id)
                        const msgGuideline = await threadNotification.send('.')
                        await msgGuideline.edit(guideline)
                        await GuidelineInfoController.addNewData(id,msgGuideline.id)
                    }else{
                        await msg.edit(guideline)
                    }
                    await threadNotification.setArchived(true)
                } catch (error) {
                    DiscordWebhook.sendError(error,id)
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

        const statusCompletedQuest = {...data.data.statusCompletedQuest}
        statusCompletedQuest[step] = true
        const updatedData = await supabase.from("GuidelineInfos")
            .update({statusCompletedQuest})
            .eq('UserId',UserId)
            .select()
            .single()
        return data.data.statusCompletedQuest[step] === updatedData.data.statusCompletedQuest[step]

    }
}

module.exports = GuidelineInfoController