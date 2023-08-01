const { ButtonStyle, channelMention, userMention } = require("discord.js")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const { CHANNEL_GUIDELINE, CHANNEL_START_PROJECT, CHANNEL_UPCOMING_SESSION, CHANNEL_CLOSA_CAFE, CHANNEL_TODO, CHANNEL_CREATE_SESSION, CHANNEL_SESSION_GOAL, CHANNEL_STREAK, CLIENT_ID } = require("../helpers/config")

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
✅ **Quest 0** — joined closa discord server.
${iconStep[0]} **Quest 1** — set a goal & deadline for your ideas → ${MessageFormatting.tagChannel(CHANNEL_START_PROJECT)}
${iconStep[1]} **Quest 2** — join coworking session to stay focused → ${MessageFormatting.tagChannel(CHANNEL_SESSION_GOAL)}
${iconStep[2]} **Quest 3** — share your daily progress with others → ${MessageFormatting.tagChannel(CHANNEL_TODO)} (*complete quest 1 first*)

**Good luck! **

${fromGuidelines ? `\`\`p.s\`\` *all of your next steps will be sent to your* :bell: **notification**` : `\`\`if you want to learn more\`\` → ${MessageFormatting.tagChannel(CHANNEL_GUIDELINE)}`} `,
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
Seems you're not ready yet—so we'll turn-off the reminder notification for you.

if you want to get started anytime soon please follow → ${MessageFormatting.tagChannel(CHANNEL_GUIDELINE)}`
    }

    static guidelines(){
        return {
            content:`__**Welcome to closa!**__
> Where builders work on their passion projects from start to finish.
> Join daily coworking, track your progress, & boost productivity. 

Let's get started:

**⁠1. **Set goals on your passion project → ${channelMention(CHANNEL_START_PROJECT)}

> Repeat steps 2 & 3 every day :repeat: 

**2. **Join daily coworking session to boost your productivity :man_technologist::woman_technologist:
- first ⁠write 1 specific task to get done → ${channelMention(CHANNEL_SESSION_GOAL)}
- then join the coworking channel → ⁠ ${channelMention(CHANNEL_CLOSA_CAFE)} (on-cam/sharescreen)

**3. ** Share all your progress recap in story-telling format → ${channelMention(CHANNEL_TODO)}\`(1x /day)\`
- try to keep your streak in your first week → ${channelMention(CHANNEL_STREAK)}

**complete all the steps above to unlock all channels** :unlock:
**↓**`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`onboardingFromGuideline`,"Check my quest").setEmoji('📜'),
                MessageComponent.addButton(`remindContinueQuest`,"🔔 Remind me later",ButtonStyle.Secondary),
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

    static welcomingNewUser(user){
        return `Welcome to closa ${user}!

> A smart discord server where builders stay productive together.
> Join daily coworking, track your progress, & ship your passion projects faster.

\`\`note:\`\` we'll use this direct message to send you reminders so you stay on track.

**To get started go to →** ${channelMention(CHANNEL_GUIDELINE)}`
    }

    static howToActivateDM(UserId){
        return {
            content:`Hi ${userMention(UserId)}, please activate your direct message 
so ${userMention(CLIENT_ID)} bot can send you reminder & help you stay on track.

here's how to activate your direct message:
1. right click on closa server logo on the left panel.
2. choose "privacy settings".
3. toggle "on" direct message. 

the bot will only remind you one or two times a day. so don't worry.

once you turn the DM on, verify with the button below:`,
            files:['./assets/images/how_to_activate_dm.png'],
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton(`verifyDM_${UserId}`,'Verify DM','✉️')
            )]
        }
    }

    static replySuccessActivateDM(){
        return `Successfully activate DM ✅`
    }

    static replyFailedActivateDM(){
        return `Verification failed, can't send you a DM ❌

please turn on your direct message first.
right click on closa server logo > click "privacy settings" > toggle "on" direct message`
    }

    static successVerifyDM(user){
        return `Your reminder succesfully activated ✅

welcome to closa ${user}!

> A smart discord server where builders stay productive together.
> Join daily coworking, track your progress, & ship your passion projects faster.

\`\`note:\`\` we'll use this direct message to send you reminders to help you stay on track.

**To get started go to →** ${channelMention(CHANNEL_GUIDELINE)}`
    }

    static setReminderContinueQuest(){
        return {
            content:`**Select your preferred time** ⏲️`,
            components:[MessageComponent.createComponent(
                MessageComponent.addMenu( 
                    `setReminderContinueQuest`,
                    "-- pick time below --",
                    [
                        {
                            label: "tomorrow 08.00 🕗",
                            value: "8.00"
                        },
                        {
                            label: "tomorrow 15.00 🕒",
                            value: "15.00"
                        },
                        {
                            label: "tomorrow 20.00 🕗",
                            value: "20.00"
                        },
                        {
                            label: 'Custom date & time ⏲️',
                            value: 'custom'
                        }
                    ]
                ),
            )]
        }
    }
}

module.exports = OnboardingMessage