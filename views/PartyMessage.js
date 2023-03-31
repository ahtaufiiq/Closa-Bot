const { EmbedBuilder } = require("discord.js")
const { CHANNEL_NOTIFICATION, CHANNEL_HIGHLIGHT, GUILD_ID, CHANNEL_GOALS, CHANNEL_TODO, CHANNEL_PARTY_ROOM, CHANNEL_GENERAL, CHANNEL_REFLECTION, CHANNEL_CELEBRATE } = require("../helpers/config")
const FormatString = require("../helpers/formatString")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const Time = require("../helpers/time")
class PartyMessage {
    static initAccountabilityMode(){
        return { 
            content:`**Select your accountability mode:**` , 
            files:["https://cdn.discordapp.com/attachments/954303982812151818/1082998117567311992/Set-goal_5.png"],
            components: [
                MessageComponent.createComponent(MessageComponent.addEmojiButton("joinPartyMode","Party Mode",'🥳'),MessageComponent.addEmojiButton("startSoloMode","Solo Mode",'🫡')),
            ] 
        }
    }
    static initSoloMode(){
        return { 
            content:`${MessageFormatting.customEmoji().thumbsupkid} **Solo mode**
It's a mode where you work on yourself as solo for your \`\`passion projects\`\` but keep accountable

\`\`\`diff
- Difficulty: Hard
• Accountability: You'll accountable for yourself & closa community.
+ Avg. timeline: 4 Weeks
\`\`\`` , 
            components: [MessageComponent.createComponent(MessageComponent.addButton("startSoloMode","Start"))] 
        }
    }
    static contentWaitingRoom(totalPeopleWaitingFor,listPeople){
        return `**🛋 Waiting Room**
----
:arrow_forward: Status → \`\`${totalPeopleWaitingFor > 0 ? `Waiting for ${totalPeopleWaitingFor} people to set goal` : "Currently matching you with your group party, please wait..."}\`\`
----
${listPeople}`
    }
    static embedMessageWaitingRoom(time){
        return {
            embeds:[MessageComponent.embedMessage({
                title:"🎊 PARTY MODE",
                description:`Time before group match making:
:hourglass_flowing_sand: **${time}** 

You will be grouped with members up to 4 people`}
            )],
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`joinPartyMode`,'Join Party').setDisabled(time === "0 m"),
                MessageComponent.addButton(`leaveWaitingRoom`, "Leave waiting room","SECONDARY").setDisabled(time === '0 m')
            )]
        }
    }

    static replySuccessStartSoloMode(notificationId){
        return `**You've selected solo mode.** 
For the next step check your 🔔 **notification** → ${MessageFormatting.linkToInsideThread(notificationId)}`
    }
    static replySuccessStartPartyMode(notificationId){
        return `You've joined party mode waiting room ✅

Next, follow the step on your 🔔 **notification** → ${MessageFormatting.linkToInsideThread(notificationId)}`
    }
    static replyAlreadyJoinWaitingRoom(){
        return `⚠️ You've joined the waiting room.`
    }

    static partyRoom(partyNumber,members,totalMember,isFull=false){
        return {
            embeds:[
                new EmbedBuilder()
                .setColor(isFull ? "#8b3636" :"#4ba341")
                .setTitle(`PARTY #${partyNumber}`)
                .setDescription("—————————")
                .addFields(
                    { name: 'Members:', value: `${members}\n\`${totalMember}/4 Total members\`` },
                )
            ],
            components:[
                MessageComponent.createComponent(
                    isFull ? MessageComponent.addDisabledButton(`joinPartyRoom_null_${partyNumber}`,"Full","DANGER") : MessageComponent.addButton(`joinPartyRoom_null_${partyNumber}`,"Join"),
                    MessageComponent.addButton(`leavePartyRoom_null_${partyNumber}`,"Leave","SECONDARY")
                )
            ]
        }
    }

    static remindUserAttendKicoff(userId,kickoffDate,eventId){
        return {
            content:`**Your goal has been recorded ${MessageFormatting.tagUser(userId)} :white_check_mark:**
See you in our kick-off day on \`\`${kickoffDate} at 20.00 WIB\`\`! :rocket:

Click :bell: **interested** to get notified when the event started.`,
        }
    }

    static remind30MinutesBeforeKickoff(eventId){
        return `Hi @everyone!
30 minutes before our kick-off day 🚀

Prepare yourself :success:
${MessageFormatting.linkToEvent(eventId)}`
    }

    static descriptionKickoffEvent(){
        return `You will be grouped during the kick-off day if you select #party-mode

The goal of this event is to kick-off together your project with closa members.

Agenda
19.50 – Open Gate
20.00 – Opening 
20.05 – Meet Accountability Partners
20.30 – Set Goal together with Accountability Partners.
21.00 – Ended

Rules: 
• come on time, respect other members' time.
• turn on the camera during the session.`
    }

    static askUserWriteHighlight(userId){
        return {
            content:`✅ <@${userId}> your goal has been submitted to <#${CHANNEL_GOALS}>

**Next, write your highlight of the day** → on <#${CHANNEL_HIGHLIGHT}> `,
            components:[
                MessageComponent.createComponent(MessageComponent.addLinkButton("Learn more about 🔆highlight","https://closa.notion.site/Highlight-8173c92b7c014beb9e86f05a54e91386"))
            ]
        }
    }

    static endOfOnboarding(){
        return `**That's all you are set! **:tada: 
looking forward for your <#${CHANNEL_TODO}> !

https://tenor.com/view/usagyuuun-confetti-sorpresa-gif-13354314`
    }

    static settingReminderHighlight(userId){
        return {
            content:`**Your highlight successfully scheduled! <@${userId}>** :white_check_mark:

Do you want to be reminded to schedule your highlight at \`\`07.30 WIB\`\` every day?
> p.s: *91% of people who set highlight are would like to get things done.*`,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`defaultReminder_${userId}`,"Yes, set at 07.30 WIB","PRIMARY"),
                    MessageComponent.addEmojiButton(`customReminder_${userId}`,"Custom Reminder","SECONDARY",'⏰'),
                    MessageComponent.addButton(`noReminder_${userId}`,"No","SECONDARY"),
                )
            ]
        }
    }
    static settingReminderHighlightExistingUser(userId,prevDefaultTime){
        return {
            content:`**Your highlight successfully scheduled! <@${userId}>** :white_check_mark:

Continue to set highlight reminder at \`\`${prevDefaultTime} WIB\`\` every day?
> p.s: *91% of people who set highlight are would like to get things done.*`,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`defaultReminder_${userId}_${prevDefaultTime}`,`Yes, set at ${prevDefaultTime} WIB`,"PRIMARY"),
                    MessageComponent.addButton(`customReminder_${userId}`,"Edit Default Time","PRIMARY"),
                    MessageComponent.addButton(`noReminder_${userId}`,"No","SECONDARY"),
                )
            ]
        }
    }
    
    static replyDefaultReminder(time='07.30'){
        return `**Your daily highlight reminder at ${time} WIB is set!** 🔔`
    }

    static replyCustomReminder(){
        return `Try typing \`\`/remind highlight at\`\` in this channel.

For example: 
\`\`\`/remind highlight at 08.00\`\`\`  
*Please use 24h for time format.*`
    }
    static replyNoHighlightReminder(){
        return `Highlight reminder is not set.

You can type \`\`/remind highlight\`\` here, if you want to set your reminder in the future.
Thank you!`
    }

    static warningReplaceExistingGoal(userId,accountabilityMode='party'){
        return {
            content:`Are you sure want to take another ${accountabilityMode} mode? 
Your future progress will be updated to your new project.`,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`continueReplaceGoal_${userId}_${accountabilityMode}`,"Yes, continue"),
                    MessageComponent.addButton(`cancelReplaceGoal_${userId}_${accountabilityMode}`,"No","SECONDARY"),
                )
            ]
        }
    }

    static cancelReplaceGoal(accountabilityMode='party'){
        return `New ${accountabilityMode} mode has been canceled.`
    }

    static confirmationLeaveParty(userId,partyId){
        return {
            content:`Are you sure to leave your party?`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`acceptLeaveParty_${userId}_${partyId}`,"Yes"),
                MessageComponent.addButton(`declineLeaveParty_${userId}_${partyId}`,"Cancel","SECONDARY"),
            )]
        }
    }

    static succesLeaveParty(partyId){
        return `You just left party ${partyId}.`
    }

    static declineLeaveParty(){
        return "Leave party canceled."
    }

    static leaveBeforeJoinedParty(){
        return `Don't trick yourself :P
You are not belong to any party at the moment.`
    }

    static leaveOtherPartyRoom(msgId){
        return `Cannot leave the party you are not belong with.
Go your party room instead → ${MessageFormatting.linkToMessage(CHANNEL_PARTY_ROOM,msgId)}`
    }

    static confirmationJoinParty(userId,partyId){
        return {
            content:`Are you sure to join party ${partyId}? ${MessageFormatting.tagUser(userId)}`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`acceptJoinParty_${userId}_${partyId}`,"Yes"),
                MessageComponent.addButton(`declineJoinParty_${userId}_${partyId}`,"Cancel","SECONDARY"),
            )]
        }
    }

    static shareLinkPartyRoom(msgId){
        return `Share your party room using this link →  ${MessageFormatting.linkToMessage(CHANNEL_PARTY_ROOM,msgId)} (copy & share the link)`
    }

    static userJoinedParty(userId){
        return `${MessageFormatting.tagUser(userId)} joined the party`
    }
    static userLeaveParty(userId){
        return {
            content:"@everyone",
            embeds:[MessageComponent.embedMessage({description:`${MessageFormatting.tagUser(userId)} just left party`})]
        }
    }

    static replyPartyIsFull(leftFor){
        return `the party is full. cannot join the party
please join another party.`
    }

    static replyCancelJoinParty(){
        return "Join party has been canceled."
    }

    static replySuccessJoinParty(userId,msgId){
        return `**Hi ${MessageFormatting.tagUser(userId)} you've joined a party! 🎉**
Go to your party room → ${MessageFormatting.linkToInsideThread(msgId)}`
    }

    static welcomingPartyRoom(partyId,tagPartyMembers){
       return `**Welcome to Party #${partyId}**! ${tagPartyMembers}
**Let's introduce yourself and connect with each other :raised_hands:**

**What you can do inside this party?**
• Casual chit-chat.
• Remind if someone not making a progress.
• Discuss your group meetup or 1 on 1 session.
• Invite someone to join virtual co-working session at closa cafe.

This party will active for the next \`\`28 days\`\` until celebration day.
And then, it will automatically disbanded.
*Because every story has a beginning and an ending*:sparkles:.

Wish you all success with your project!
let's make some good memories~`
    }

    static reminderSetHighlightAfterJoinParty(userId){
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)}, 
You next step is to write your highlight of the day → on ${MessageFormatting.tagChannel(CHANNEL_HIGHLIGHT)}`,
            components:[MessageComponent.createComponent(
                MessageComponent.addLinkButton('Learn more about 🔆highlight',"https://closa.notion.site/Highlight-8173c92b7c014beb9e86f05a54e91386")
            )]
        }
    }

    static alreadyJoinPartyRoom(userId,msgId){
        return `You already joined a party ${MessageFormatting.tagUser(userId)}.
Go to your party room instead → ${MessageFormatting.linkToInsideThread(msgId)}`
    }
    static alreadyJoinWaitingRoom(){
        return `⚠️ You've joined the waiting room.`
    }

    static replyCannotJoinPartyBeforeSetGoal(userId,notificationId){
        return `**Hi ${MessageFormatting.tagUser(userId)}, cannot join the party because you haven't set your 🎯goals yet.**

Continue to the next step here → ${MessageFormatting.linkToInsideThread(notificationId)}`
    }

    static announceOpenPartyMode(date){
        return `Hi @everyone! The **PARTY MODE** for our next cohort is open now!  :green_circle:

Go to ${MessageFormatting.tagChannel(CHANNEL_PARTY_ROOM)} to join group accountability group  before our next cohort begin.
\`\`Open until ${date} at 20.30\`\``
    }

    static reminderOpenPartyMode(){
        return `Hi @everyone! if you want to have accountability group for our next cohort.

→ join ${MessageFormatting.tagChannel(CHANNEL_PARTY_ROOM)}

\`\`Open until Tomorrow at 20.30\`\` (but better join now).`
    }

    static replyOutsiderMemberCannotChat(){
        return `your chat has been deleted, because you are not belong to the party.`
    }

    static replyCannotMentionNotPartyMember(){
        return "cannot mention other members outside the party"
    }

    static remindSharePartyWhenSomeoneLeaveParty(userId,msgId){
        return `Hi ${MessageFormatting.tagUser(userId)}, you have 1 party slot available.
Share it on ${MessageFormatting.tagChannel(CHANNEL_GENERAL)}. So, someone who haven't join any party can join yours.

\`\`Copy your party room link\`\` → ${MessageFormatting.linkToMessage(CHANNEL_PARTY_ROOM,msgId)}`
    }

    static replyCannotJoinPartyFullAfterSetGoal(userId){
        return `Hi ${MessageFormatting.tagUser(userId)} your goal are set! ✅

**Next, find & join available party** → ${MessageFormatting.tagChannel(CHANNEL_PARTY_ROOM)}`
    }
    
    static replyImmediatelyJoinParty(userId,msgId){
        return `**Hi ${MessageFormatting.tagUser(userId)} you've joined a party! 🎉**
Go to your party room → ${MessageFormatting.linkToInsideThread(msgId)}`
    }

    static remindPartyWillEnded2Days(){
        return ":bell: **Reminder**: The party will be ended in 2 days. @everyone"
    }

    static remindPartyWillEndedToday(){
        return ":bell: **Reminder**: The party will be ended today at 22.00 WIB @everyone"
    }

    static remindPartyWillEnded30Minutes(){
        return ":bell: **Reminder**: The party will be ended in 30 minutes @everyone"
    }

    static remindPartyWillEnded5Minutes(){
        return ":bell: **Reminder**: The party will be ended in 5 minutes, Let's have the last minutes chat @everyone 💬"
    }

    static remindPartyWillEndedNow(){
        return "See you on next journey 👊 @everyone"
    }

    static partyReminder(inactiveUserId,activeUserId){
        return `Hi ${MessageFormatting.tagUser(inactiveUserId)}, how are you doing? is everything okay?
bacause you haven't update your #✅progress in the past two days.

${MessageFormatting.tagUser(activeUserId)} please check how your partner doing.
let's support each other to make progress 🙌`
    }

    static notifyMemberShareReflection(userId,msgIdReflection,project){
        return {
			content:`${MessageFormatting.tagUser(userId)} **just posted a reflection 📝**`,
			embeds:[
				new EmbedBuilder()
					.setColor('#ffffff')
					.setTitle("See reflection →")
					.setURL(MessageFormatting.linkToMessage(CHANNEL_REFLECTION,msgIdReflection))
					.setFooter({text:project})
			]
		}
    }

    static notifyMemberShareCelebration(userId,msgIdCelebration,project){
        return {
			content:`${MessageFormatting.tagUser(userId)} **just posted a celebration 🎉**`,
			embeds:[
				new EmbedBuilder()
					.setColor('#ffffff')
					.setTitle("See celebration →")
					.setURL(MessageFormatting.linkToMessage(CHANNEL_CELEBRATE,msgIdCelebration))
					.setFooter({text:project})
			]
		}
    }

    static shareAchievementBadge(user,streak,files){
        return {
            content:`**Congrats ${user} on achieving ${streak} day streak! **
**Let's celebrate together @everyone 🥳🎉**`,
            files
        }
    }

    static headlineProgressRecap(partyNumber){
        return `:eight_spoked_asterisk: **Hi Party ${partyNumber}, here's progress recap from yesterday** @everyone
\`\`\`${Time.getFormattedDate(Time.getNextDate(-1))}
...\`\`\``
    }

    static shareProgress(username,avatarUrl,time,msgContent,msgId){
        return new EmbedBuilder()
            .setColor('#ffffff')
            .setTitle("see on timeline ›")
            .setURL(MessageFormatting.linkToMessage(CHANNEL_TODO,msgId))
            .setDescription(FormatString.truncateString(msgContent.split('\n')[0],100) || null)
            .setFooter({iconURL:avatarUrl,text:`${username} · Yesterday at ${time} WIB`})
    }

}

module.exports = PartyMessage