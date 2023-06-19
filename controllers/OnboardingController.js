
const schedule = require('node-schedule');
const MemberController = require('./MemberController');
const { ROLE_ONBOARDING_WELCOME, CHANNEL_NOTIFICATION, ROLE_ONBOARDING_LATER, ROLE_NEW_MEMBER, ROLE_ONBOARDING_PROJECT, ROLE_ONBOARDING_COWORKING, ROLE_ONBOARDING_PROGRESS } = require('../helpers/config');
const ChannelController = require('./ChannelController');
const OnboardingMessage = require('../views/OnboardingMessage');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const GuidelineInfoController = require('./GuidelineInfoController');
const UserController = require('./UserController');
const ReferralCodeController = require('./ReferralCodeController');
const GenerateImage = require('../helpers/GenerateImage');
const { AttachmentBuilder } = require('discord.js');

class OnboardingController {

    static async welcomeOnboarding(client,user){
        await Promise.all([
            MemberController.addRole(client,user.id,ROLE_ONBOARDING_PROJECT),
            MemberController.addRole(client,user.id,ROLE_ONBOARDING_COWORKING),
            MemberController.addRole(client,user.id,ROLE_ONBOARDING_PROGRESS),
        ])
        const channelNotifications = ChannelController.getChannel(client,CHANNEL_NOTIFICATION)
		const msg = await channelNotifications.send(`${user}`)
        await supabase.from("Users")
			.update({
                notificationId:msg.id,
                onboardingStep:'firstQuest',
            })
			.eq('id',user.id)
		ChannelController.createThread(msg,user.username)
			.then(async thread=>{
				const msgGuideline = await thread.send(OnboardingMessage.guidelineInfoQuest(user.id,'firstQuest'))
                GuidelineInfoController.addNewData(user.id,msgGuideline.id)
			})
        
        
    }

    static async startOnboarding(interaction){
        const UserId = interaction.user.id
        const value = interaction.customId.split("_")[2]
        await OnboardingController.updateOnboardingStep(interaction.client,UserId,'firstQuest')
        OnboardingController.addReminderToStartOnboarding(UserId)

        MemberController.removeRole(interaction.client,UserId,ROLE_ONBOARDING_LATER)

        await MemberController.addRole(interaction.client,UserId,ROLE_ONBOARDING_PROJECT)
        if(value === 'fromReminder'){
            ChannelController.deleteMessage(interaction.message)
        }else {
            GuidelineInfoController.incrementTotalNotification(1,UserId)
        }
        const reply = await interaction.editReply(OnboardingMessage.firstQuest(interaction.user.id))
    }

    static async continueFirstQuest(interaction){
        interaction.editReply(OnboardingMessage.firstQuest(interaction.user.id))
    }

    static async onboardingLater(interaction){
        const UserId = interaction.user.id
        MemberController.addRole(interaction.client,UserId,ROLE_ONBOARDING_LATER)
        MemberController.addRole(interaction.client,UserId,ROLE_NEW_MEMBER)

        interaction.editReply(OnboardingMessage.replyStartLater())
        GuidelineInfoController.incrementTotalNotification(1,UserId)
    }

    static addReminderToStartOnboarding(UserId){
        const data = []
        for (let i = 1; i <= 8; i++) {
            const time = Time.getNextDate(i)
            const type = i === 8 ? 'turnOffReminderOnboarding' : 'reminderStartOnboarding'
            data.push({
                UserId,
                type,
                time,
                message:Time.getDateOnly(time),
            })

        }
        supabase.from("Reminders")
            .insert(data)
            .then()
    }

    static deleteReminderToStartOnboarding(UserId){
        supabase.from("Reminders")
            .delete()
            .eq('UserId',UserId)
            .or('type.eq.reminderStartOnboarding,type.eq.turnOffReminderOnboarding')
            .then()
    }

    static reminderStartOnboarding(client){
        let ruleRemindOnboarding = new schedule.RecurrenceRule();
        ruleRemindOnboarding.hour = Time.minus7Hours(19)
        ruleRemindOnboarding.minute = 20
        schedule.scheduleJob(ruleRemindOnboarding,async function(){
            supabase.from("Reminders")
                .select('*,Users(notificationId,onboardingStep)')
                .or('type.eq.reminderStartOnboarding,type.eq.turnOffReminderOnboarding')
                .eq('message',Time.getTodayDateOnly())
                .then(data=>{
                    data.body?.forEach(({Users:{notificationId,onboardingStep},type,UserId})=>{
                        let msgContent
                        if(type === 'reminderStartOnboarding') msgContent = OnboardingMessage.reminderToStartOnboarding(UserId,onboardingStep)
                        else {
                            msgContent = OnboardingMessage.turnOffReminderOnboarding(UserId)
                            MemberController.addRole(client,UserId,ROLE_NEW_MEMBER)
                        }
                        ChannelController.sendToNotification(client,msgContent,UserId,notificationId)
                    })
                })
        })    
    }

    static async isHasRoleOnboardingProject(client,userId){
        return await MemberController.hasRole(client,userId,ROLE_ONBOARDING_PROJECT)
    }

    static async isHasRoleOnboardingCoworking(client,userId){
        return await MemberController.hasRole(client,userId,ROLE_ONBOARDING_COWORKING)
    }

    static async isHasRoleOnboardingProgress(client,userId){
        return await MemberController.hasRole(client,userId,ROLE_ONBOARDING_PROGRESS)
    }

    static async updateOnboardingStep(client,UserId,step){
        await supabase.from("Users")
            .update({onboardingStep:step})
            .eq('id',UserId)
            
        return await GuidelineInfoController.updateMessageGuideline(client,UserId)
    }
    
    static async handleOnboardingProject(client,user){
        const isHasRoleOnboardingProject = await OnboardingController.isHasRoleOnboardingProject(client,user.id)
        if(isHasRoleOnboardingProject){
            GuidelineInfoController.updateStatusCompletedQuest(user.id,'firstQuest')
            const isHasRoleOnboardingCoworking = await OnboardingController.isHasRoleOnboardingCoworking(client,user.id)
            if(isHasRoleOnboardingCoworking){
                OnboardingController.updateOnboardingStep(client,user.id,'secondQuest')
                setTimeout(() => {
                    ChannelController.sendToNotification(
                        client,OnboardingMessage.secondQuest(user.id),user.id
                    )
                }, 1000 * 15);
            }else{
                OnboardingController.updateOnboardingStep(client,user.id,'thirdQuest')
                setTimeout(() => {
                    ChannelController.sendToNotification(
                        client,OnboardingMessage.thirdQuest(user.id),user.id
                    )
                }, 1000 * 15);
            }
            await MemberController.removeRole(client,user.id,ROLE_ONBOARDING_PROJECT)
        }
    }

    static async handleOnboardingCoworking(client,user){
        const userId = user.id
        const isHasRoleOnboardingCoworking = await OnboardingController.isHasRoleOnboardingCoworking(client,userId)
        if(isHasRoleOnboardingCoworking){
            GuidelineInfoController.updateStatusCompletedQuest(userId,'secondQuest')
            UserController.getDetail(userId,'goalId,lastDone')
                .then(data=>{
                    if(data.body.lastDone){
                        OnboardingController.updateOnboardingStep(client,userId,'done')
                        ReferralCodeController.addNewReferral(userId,3)
                        OnboardingController.deleteReminderToStartOnboarding(userId)
                        setTimeout(async () => {
                            const files = []
                            const totalReferralCode = await ReferralCodeController.getTotalActiveReferral(userId)
                            const coverWhite = await GenerateImage.referralCover(totalReferralCode,user,false)
                            files.push(new AttachmentBuilder(coverWhite,{name:`referral_coverWhite_${user.username}.png`}))
                            ChannelController.sendToNotification(
                                client,
                                OnboardingMessage.completedQuest(userId,files),
                                userId
                            )
                        }, 1000 * 15);
                    }else if(data.body.goalId){
                        setTimeout(() => {
                            ChannelController.sendToNotification(
                                client,
                                OnboardingMessage.thirdQuest(userId),
                                userId
                            )
                            OnboardingController.updateOnboardingStep(client,userId,'thirdQuest')
                        }, 1000 * 15);
                    }else{
                        setTimeout(() => {
                            ChannelController.sendToNotification(
                                client,
                                OnboardingMessage.firstQuest(userId),
                                userId
                            )
                        }, 1000 * 15);
                    }
                })

                await Promise.all([
                    MemberController.addRole(client,userId,ROLE_ONBOARDING_PROGRESS),
                    MemberController.removeRole(client,userId,ROLE_ONBOARDING_COWORKING)
                ])
        }
    }
}

module.exports = OnboardingController