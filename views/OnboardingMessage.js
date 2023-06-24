const { ButtonStyle, channelMention, userMention } = require("discord.js")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const { CHANNEL_GUIDELINE, CHANNEL_START_PROJECT, CHANNEL_UPCOMING_SESSION, CHANNEL_CLOSA_CAFE, CHANNEL_TODO, CHANNEL_CREATE_SESSION, CHANNEL_SESSION_GOAL, CHANNEL_STREAK } = require("../helpers/config")

class OnboardingMessage {

    static generateInitialIconStep(statusCompletedQuest){
        const iconStep = []
        if(!statusCompletedQuest){
            iconStep.push('⏳','🔳','🔳')
        }else{
            statusCompletedQuest.firstQuest ? iconStep.push('✅') : iconStep.push('🔳')
            statusCompletedQuest.secondQuest ? iconStep.push('✅') : iconStep.push('🔳')
            statusCompletedQuest.thirdQuest ? iconStep.push('✅') : iconStep.push('🔳')
        }
        return iconStep
    }
    static guidelineInfoQuest(userId,step,statusCompletedQuest,fromGuidelines=false){
        const buttons = []
        if(!fromGuidelines) buttons.push(MessageComponent.addLinkButton('Watch Demo (3 mins)','https://www.loom.com/share/244afe1607a64c77995145a61c04b0f1').setEmoji('▶️'))
        const iconStep = OnboardingMessage.generateInitialIconStep(statusCompletedQuest)

        if(step === 'firstQuest') {
            buttons.push(MessageComponent.addButton(`continueFirstQuest_${userId}_guideline`,"Start Quest"))
            iconStep[0] = '⏳'
        }else if(step === 'secondQuest'){
            buttons.push(MessageComponent.addButton(`continueSecondQuest_${userId}_guideline`,"Continue Quest 2"))
            iconStep[1] = '⏳'
        }else if(step === 'thirdQuest'){
            buttons.push(MessageComponent.addButton(`continueThirdQuest_${userId}_guideline`,"Continue Quest 3"))
            iconStep[2] = '⏳'
        }

        return {
            content:`${fromGuidelines ? `Here's your onboarding quest progress ${userMention(userId)}`:`Welcome to closa ${userMention(userId)}!`}

\`\`\`complete the onboarding quests to boost your productivity 🚀\`\`\`
✅ **Quest 0** — Joined closa discord server.
${iconStep[0]} **Quest 1** — set a goal & deadline for your ideas → ${MessageFormatting.tagChannel(CHANNEL_START_PROJECT)}
${iconStep[1]} **Quest 2** — join coworking session to stay focused → ${MessageFormatting.tagChannel(CHANNEL_SESSION_GOAL)}
${iconStep[2]} **Quest 3** — share your daily progress with others → ${MessageFormatting.tagChannel(CHANNEL_TODO)} (*complete quest 1 first*)

**Good luck! **

${fromGuidelines ? '' : `\`\`if you want to learn more\`\` → ${MessageFormatting.tagChannel(CHANNEL_GUIDELINE)}`} `,
            components: [MessageComponent.createComponent(
                ...buttons
            )]
        }

    }

    static welcomeMessage(userId){
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)} welcome to closa! :wave: 

> A place where you work on your ideas from start to finish.
> Join daily coworking, meet new friends, & get more done.

Complete the first quest to boost your productivity :scroll: :
1. set a goal for your idea.
2. join a coworking session.
3. share your progress with others.`,
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addButton(`startOnboarding_${userId}_guideline`,"Get started"),
                    MessageComponent.addButton('startOnboardingLater',"I'll start later",ButtonStyle.Secondary)
                )
            ]
        }
    }

    static introQuest(userId){
        return {
            content:`:scroll: Here's your first quest ${MessageFormatting.tagUser(userId)}

1. start your project & set your goal
2. join a coworking session
3. share your first progress

you can watch this video first (3 min), 
then click continue to open access to more channels.`,
            components: [MessageComponent.createComponent(
                MessageComponent.addLinkButton('Watch Demo (3 mins)','https://www.loom.com/share/244afe1607a64c77995145a61c04b0f1').setEmoji('▶️'),
                MessageComponent.addButton(`continueFirstQuest_${userId}`,"Continue"),
            )]
        }
    }

    static firstQuest(userId){
        return `:scroll: **Quest (1/3)**
        
Hi ${userMention(userId)}, start working on your idea here → ${MessageFormatting.tagChannel(CHANNEL_START_PROJECT)}`
    }

    static secondQuest(userId){
        return {
            content:`:scroll: **Quest (2/3)**

Now, join or schedule a coworking session to work on your project ${MessageFormatting.tagUser(userId)}`,
            files:['./assets/images/banner_coworking_session.png'],
            components:[MessageComponent.createComponent(
                MessageComponent.addButton('replySecondQuest','Join now'),
                MessageComponent.addButton(`reminderCoworking`,"I'll join later").setStyle(ButtonStyle.Secondary),
                MessageComponent.addLinkButton('Watch video (2 mins)','https://www.loom.com/share/fd2e8488d168404789ed12f7a98a7523?t=30').setEmoji('▶️')
            )]
        }
    }

    static replySecondQuest(userId){
        return `Here's how to join a coworking session ${userMention(userId)}:
1. Write 1 specific task you want to get done → ${channelMention(CHANNEL_SESSION_GOAL)}
2. Join → ${channelMention(CHANNEL_CLOSA_CAFE)} / available voice channel
3. Then turn on camera :camera_with_flash: __or__ share your screen :desktop: 

\`\`rules:\`\` *if you turning-on camera, make sure people can see you.*`
    }

    static thirdQuest(userId){
        return {
            content:`:scroll: **Quest (3/3)**

The final step, share your first progress! ${MessageFormatting.tagUser(userId)} 🥳`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton('replyThirdQuest','Share Progress')
            )]
        }
    }

    static replyThirdQuest(){
        return `**copy & follow the template below then share your daily progress here → ${MessageFormatting.tagChannel(CHANNEL_TODO)}:**
\`\`\`
✅ Today:  *title of what you've done*

> replace this section with your all of your progress recap of the day:
> *Recap all of your progress in 1 post, it's enough, no need to post multiple times a day.*
> *Post in a story telling format—like you talk with your friends*
> *Don't just posting a list of task done without context/story format*
> *You can attach image/gif/video to show more about your progress.*

➡️ Next → *your next plan*
\`\`\`
after sharing your progress, give supportive reactions to others as well ❤️`
    }

    static completedQuest(userId,files){
        return {
            files,
            content:`Congratulation ${MessageFormatting.tagUser(userId)}!
you just completed your quest :partying_face::tada:

now you have invite code to give your friend \`\`early access\`\` to closa :gift: 
feel free to invite your friends to closa!`,
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton(`claimReferral_${userId}`,'Invite Friends','🎁')
            )]
        }
    }

    static replyStartLater(){
        return `Alright, i'll remind you later to get started ✌️
if you want to start sooner, you can follow closa ${MessageFormatting.tagChannel(CHANNEL_GUIDELINE)}`
    }

    static reminderToStartOnboarding(userId,onboardingStep){
        let textButton = 'Get started'
        let command = 'startOnboarding'
        let content = `Hi ${MessageFormatting.tagUser(userId)}, are you ready to work on your idea today?`
        if(onboardingStep === 'firstQuest') command = 'continueFirstQuest'
        else if(onboardingStep === 'secondQuest'){
            command = 'continueSecondQuest'
            content = `Hi ${MessageFormatting.tagUser(userId)}, let's continue on quest (2/3): join your first coworking session`
            textButton = 'Join'
        }else if(onboardingStep === 'thirdQuest'){
            command = 'continueThirdQuest'
            content = `Hi ${MessageFormatting.tagUser(userId)}, let's continue the final step: share your first progress! ${MessageFormatting.tagUser(userId)} 🥳`
            textButton = 'Share Progress'
        }
        return {
            content,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`${command}_${userId}_fromReminder`,textButton),
                onboardingStep === 'secondQuest' 
                    ? MessageComponent.addLinkButton('watch demo (3 min)','https://www.loom.com/share/fd2e8488d168404789ed12f7a98a7523?t=30').setEmoji('▶️') 
                    : MessageComponent.addButton(`remindOnboardingAgain_${userId}`,"I'll start later",ButtonStyle.Secondary)
            )]
        }
    }

    static remindOnboardingAgain(){
        return `Alright, i'll remind you again later :handshake: 
if you want to start soon go to ${MessageFormatting.tagChannel(CHANNEL_GUIDELINE)}`
    }

    static turnOffReminderOnboarding(userId){
        return `Hi ${MessageFormatting.tagUser(userId)}, we've sent you reminders in the past 7 days (to work on your ideas). 
Seems you're not ready yet—so we'll open access to all channels for you 🔓

if you want to get started anytime soon please follow → ${MessageFormatting.tagChannel(CHANNEL_GUIDELINE)}`
    }

    static guidelines(){
        return {
            content:`**Welcome to closa!**
> a place to work on your ideas from start to finish alongside other creators.
> join daily coworking, meet friends, & boost productivity.
            
\`\`\`HOW TO USE CLOSA TO BOOST YOUR PRODUCTIVITY\`\`\`
**⁠1.** Start working on your ideas & set goal → ${channelMention(CHANNEL_START_PROJECT)} :dart: 

**Repeat step 2 & 3 every day** :repeat: 
> *this is what will make you stay productive each day at closa* :rocket: 

**2.** Join coworking session to boost productivity & stay focused :man_technologist::woman_technologist::white_check_mark:
-  first ⁠write 1 specific task you want to get done → ${channelMention(CHANNEL_SESSION_GOAL)}
-  then join the voice channel to cowork → ${channelMention(CHANNEL_CLOSA_CAFE)} (*default*)

**3.** ${channelMention(CHANNEL_TODO)} – post your progress in a story-telling format. 
> *While you're at it give supportive reactions to others* :heart:

**⁠4.** ${channelMention(CHANNEL_STREAK)} – try to keep your streak and don't miss your progress twice in a row.

The key to stay consistent when you're not feeling it:
> *small progress is still progress* :sparkles:
**↓**`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`onboardingFromGuideline`,"Check my quest"),
                MessageComponent.addLinkButton('Watch Demo (3 mins)','https://www.loom.com/share/244afe1607a64c77995145a61c04b0f1').setEmoji('▶️'),
            )]
        }
    }

    static replySetReminderCoworking(UserId,time,isMoreThanTenMinutes){
        return `your coworking time scheduled at ${time} ${userMention(UserId)} ✅

${isMoreThanTenMinutes ? "*i'll remind you 10 minutes before the schedule begin*" : ''}`
    }

    static reminderCoworking(UserId,time){
        return `Hi ${userMention(UserId)}, reminder to join the coworking session at ${time}
1. Join → ${channelMention(CHANNEL_CLOSA_CAFE)} / available voice channel.
2. then set your ${channelMention(CHANNEL_SESSION_GOAL)}`
    }
}

module.exports = OnboardingMessage