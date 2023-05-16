
const schedule = require('node-schedule');
const MemberController = require('./MemberController');
const { ROLE_ONBOARDING_WELCOME, CHANNEL_NOTIFICATION, ROLE_ONBOARDING_LATER, ROLE_NEW_MEMBER, ROLE_ONBOARDING_PROJECT, ROLE_ONBOARDING_COWORKING, ROLE_ONBOARDING_PROGRESS } = require('../helpers/config');
const ChannelController = require('./ChannelController');
const OnboardingMessage = require('../views/OnboardingMessage');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const GuidelineInfoController = require('./GuidelineInfoController');
const UserController = require('./UserController');

class OnboardingController {

    static async welcomeOnboarding(client,user){
        await MemberController.addRole(client,user.id,ROLE_ONBOARDING_WELCOME)
        const channelNotifications = ChannelController.getChannel(client,CHANNEL_NOTIFICATION)
		const msg = await channelNotifications.send(`${user}`)
        await supabase.from("Users")
			.update({
                notificationId:msg.id,
                onboardingStep:'welcome',
            })
			.eq('id',user.id)
		ChannelController.createThread(msg,user.username)
			.then(async thread=>{
				const msgGuideline = await thread.send(OnboardingMessage.welcomeMessage(user.id))
                GuidelineInfoController.addNewData(user.id,msgGuideline.id)
			})
        
        
    }

    static async startOnboarding(interaction){
        const UserId = interaction.user.id
        const value = interaction.customId.split("_")[2]
        OnboardingController.updateOnboardingStep(interaction.client,UserId,'firstQuest')

        MemberController.removeRole(interaction.client,UserId,ROLE_ONBOARDING_LATER)
        MemberController.removeRole(interaction.client,UserId,ROLE_ONBOARDING_WELCOME)

        MemberController.addRole(interaction.client,UserId,ROLE_ONBOARDING_PROJECT)
        OnboardingController.deleteReminderToStartOnboarding()
        if(value === 'fromReminder'){
            ChannelController.deleteMessage(interaction.message)
        }else if(value === 'guideline'){
            GuidelineInfoController.incrementTotalNotification(1,UserId)
        }
        await interaction.editReply(OnboardingMessage.introQuest(UserId))
    }

    static async continueFirstQuest(interaction){
        interaction.editReply(OnboardingMessage.firstQuest(interaction.user.id))
    }

    static async onboardingLater(interaction){
        const UserId = interaction.user.id
        MemberController.addRole(interaction.client,UserId,ROLE_ONBOARDING_LATER)
        MemberController.addRole(interaction.client,UserId,ROLE_NEW_MEMBER)
        MemberController.removeRole(interaction.client,UserId,ROLE_ONBOARDING_WELCOME)

        OnboardingController.addReminderToStartOnboarding(UserId)
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
                .select('*,Users(notificationId)')
                .or('type.eq.reminderStartOnboarding,type.eq.turnOffReminderOnboarding')
                .eq('message',Time.getTodayDateOnly())
                .then(data=>{
                    data.body?.forEach(({Users:{notificationId},type,UserId})=>{
                        let msgContent
                        if(type === 'reminderStartOnboarding') msgContent = OnboardingMessage.reminderToStartOnboarding(UserId)
                        else msgContent = OnboardingMessage.turnOffReminderOnboarding()
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
            
        GuidelineInfoController.updateMessageGuideline(client,UserId)

    }
}

module.exports = OnboardingController