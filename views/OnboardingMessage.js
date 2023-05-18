const { ButtonStyle } = require("discord.js")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const { CHANNEL_GUIDELINE, CHANNEL_START_PROJECT, CHANNEL_UPCOMING_SESSION, CHANNEL_CLOSA_CAFE, CHANNEL_TODO, CHANNEL_CREATE_SESSION, CHANNEL_SESSION_GOAL, CHANNEL_STREAK } = require("../helpers/config")

class OnboardingMessage {

    static step(userId,step){
        if(step === 'welcome') return OnboardingMessage.welcomeMessage(userId)
        else return OnboardingMessage.guidelineInfoQuest(userId,step)
    }

    static guidelineInfoQuest(userId,step){
        const buttons = [MessageComponent.addLinkButton('Watch Demo (3 mins)','https://www.loom.com/share/244afe1607a64c77995145a61c04b0f1').setEmoji('▶️')]
        if(step === 'firstQuest') buttons.push(MessageComponent.addButton(`continueFirstQuest_${userId}_guideline`,"Continue"))
        if(step === 'secondQuest') buttons.push(MessageComponent.addButton(`continueSecondQuest_${userId}_guideline`,"Continue Quest 2"))
        if(step === 'thirdQuest') buttons.push(MessageComponent.addButton(`continueThirdQuest_${userId}_guideline`,"Continue Quest 3"))
        return {
            content:`:scroll: Here's your first quest ${MessageFormatting.tagUser(userId)}

1. start your project & set your goal
2. join a coworking session
3. share your first progress

you can watch this video first`,
            components: [MessageComponent.createComponent(
                ...buttons
            )]
        }
    }

    static welcomeMessage(userId){
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)} welcome to closa!

> A place where you work on your ideas from start to finish.
> Join daily coworking, meet new friends, & get more done.

**Are you ready to work on your ideas?**`,
            components: [
                MessageComponent.createComponent(MessageComponent.addLinkButton('Watch Demo (3 mins)','https://www.loom.com/share/244afe1607a64c77995145a61c04b0f1').setEmoji('▶️')),
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
        return {
            content:`:scroll: **Quest (1/3)**

Start your project & set a goal ${MessageFormatting.tagUser(userId)}`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton('replyFirstQuest','Start')
            )]
        }
    }

    static replyFirstQuest(){
        return `start a project & set your goal here → ${MessageFormatting.tagChannel(CHANNEL_START_PROJECT)}`
    }

    static secondQuest(userId){
        return {
            content:`:scroll: **Quest (2/3)**

Now, join or schedule a coworking session to work on your project ${MessageFormatting.tagUser(userId)}`,
            files:['./assets/images/banner_coworking_session.png'],
            components:[MessageComponent.createComponent(
                MessageComponent.addButton('replySecondQuest','Join')
            )]
        }
    }

    static replySecondQuest(){
        return `Here's how:
• join now ${MessageFormatting.tagChannel(CHANNEL_CLOSA_CAFE)}
• or schedule here → ${MessageFormatting.tagChannel(CHANNEL_UPCOMING_SESSION)}`
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
        return `share your daily progress here → ${MessageFormatting.tagChannel(CHANNEL_TODO)}`
    }

    static completedQuest(userId,files){
        return {
            files,
            content:`Congratulation ${MessageFormatting.tagUser(userId)}!
you just completed your quest :partying_face::tada:

now you have \`\`3 invite codes\`\` :gift: 
feel free to give your friends early access to closa`,
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton(`claimReferral_${userId}`,'Invite Friends','🎁')
            )]
        }
    }

    static replyStartLater(){
        return `Alright, i'll remind you later to get started ✌️
if you want to start sooner, you can follow closa ${MessageFormatting.tagChannel(CHANNEL_GUIDELINE)}`
    }

    static reminderToStartOnboarding(userId){
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)}, are you ready to work on your idea today?`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`startOnboarding_${userId}_fromReminder`,'Get started'),
                MessageComponent.addButton(`remindOnboardingAgain_${userId}`,"I'll start later",ButtonStyle.Secondary)
            )]
        }
    }

    static remindOnboardingAgain(){
        return `Alright, i'll remind you again later :handshake: 
if you want to start soon go to ${MessageFormatting.tagChannel(CHANNEL_GUIDELINE)}`
    }

    static turnOffReminderOnboarding(){
        return `Seems like this notification didn't work for you.
so we will turn it off. 🔕`
    }

    static guidelines(){
        return {
            content:`\`\`\`START HERE\`\`\`
1. ${MessageFormatting.tagChannel(CHANNEL_START_PROJECT)} at closa and set your goal.

**REPEAT STEPS 2 to 4 EVERY DAY** :repeat: 
*this is what will make you stay productive each day at closa:*

2. Coworking — join ${MessageFormatting.tagChannel(CHANNEL_CLOSA_CAFE)}  or schedule a session on ${MessageFormatting.tagChannel(CHANNEL_CREATE_SESSION)} / ${MessageFormatting.tagChannel(CHANNEL_UPCOMING_SESSION)}

3. Set ${MessageFormatting.tagChannel(CHANNEL_SESSION_GOAL)} — write 1 specific task you want to get done.

4. ${MessageFormatting.tagChannel(CHANNEL_TODO)} – Post your progress in a story-telling format. While you're at it give supportive reactions to others :heart:

5. ${MessageFormatting.tagChannel(CHANNEL_STREAK)} – Try to keep your streak and don't miss your progress twice in a row. 

The key to stay consistent when you're not feeling it:
> *** small progress is still progress***`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`startOnboarding_${userId}_guideline`,"Get started"),
                MessageComponent.addLinkButton('Watch Demo (3 mins)','https://www.loom.com/share/244afe1607a64c77995145a61c04b0f1').setEmoji('▶️')
            )]
        }
    }
}

module.exports = OnboardingMessage