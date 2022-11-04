const { MessageEmbed, MessageActionRow, MessageButton, SelectMenuInteraction, MessageSelectMenu, MessageAttachment } = require("discord.js")
const { CHANNEL_NOTIFICATION, CHANNEL_HIGHLIGHT, GUILD_ID, CHANNEL_GOALS, CHANNEL_TODO, CHANNEL_PARTY_ROOM } = require("../helpers/config")
const InfoUser = require("../helpers/InfoUser")
const MessageFormatting = require("../helpers/MessageFormatting")
const Time = require("../helpers/time")
class PartyMessage {
    static initSoloMode(){
        return { 
            content:`${MessageFormatting.customEmoji().thumbsupkid} **Solo mode**
It's a mode where you work on yourself as solo for your \`\`passion projects\`\` but keep accountable

\`\`\`diff
- Difficulty: Hard
• Accountability: You'll accountable for yourself & closa community.
+ Avg. timeline: 4 Weeks
\`\`\`` , 
            components: [this.createComponent(this.addButton("startSoloMode","Start"))] 
        }
    }
    static contentWaitingRoom(totalPeopleWaitingFor,listPeople){
        return `**🛋 Waiting Room**
----
:arrow_forward: Status → \`\`${totalPeopleWaitingFor > 0 ? `Waiting for **${totalPeopleWaitingFor}** people to set goal` : "Currently matching you with your group party, please wait..."}\`\`
----
${listPeople}`
    }
    static embedMessageWaitingRoom(time){
        return {
            embeds:[this.embedMessage("🎊 PARTY MODE",`Time before group match making:
:hourglass_flowing_sand: **${time}** 

You will be grouped with members up to 4 people`)],
            components:[this.createComponent(
                this.addButton(`joinPartyMode`,'Join Party'),
                this.addButton(`leaveWaitingRoom`, "Leave waiting room","SECONDARY")
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

    static pickYourRole(userId,type="party"){
        return {
            content:`**Pick your role ${MessageFormatting.tagUser(userId)}**
p.s: *you can always change it in the next cohort*`,
            components:[this.createComponent(
                this.addButton(`roleDeveloper_${userId}_${type}`,"💻 Developers"),
                this.addButton(`roleDesigner_${userId}_${type}`,"🏀 Designer"),
                this.addButton(`roleCreator_${userId}_${type}`,"🎨 Creators"),
            )]
        }
    }

    static pickYourGoalCategory(role,userId,type='party'){
        let options = []
        switch (role) {
            case `Developer`:
                options = [
                    { label:`Coding interview preparation`, value:`${type}-Developer-Coding interview preparation`},
                    { label:`Build personal website`, value:`${type}-Developer-Build personal website`},
                    { label:`Build a web app`, value:`${type}-Developer-Build a web app`},
                    { label:`Build a mobile app`, value:`${type}-Developer-Build a mobile app`},
                    { label:`Learn new front-end stacks`, value:`${type}-Developer-Learn new front-end stacks`},
                    { label:`Learn new back-end stacks`, value:`${type}-Developer-Learn new back-end stacks`},
                    { label:`Learn new mobile stacks`, value:`${type}-Developer-Learn new mobile stacks`},
                    { label:`Learn new tech stacks`, value:`${type}-Developer-Learn new tech stacks`},
                    { label:`Other`, value:`${type}-Developer-Other`}
                ]
                break;
            case `Designer`:
                options = [
                    { label:`Writing case study`,value:`${type}-Designer-Writing case study`},
                    { label:`Design exploration`,value:`${type}-Designer-Design exploration`},
                    { label:`Build design portfolio`,value:`${type}-Designer-Build design portfolio`},
                    { label:`Building personal website`,value:`${type}-Designer-Building personal website`},
                    { label:`Learn design skills`,value:`${type}-Designer-Learn design skills`},
                    { label:`Other`, value:`${type}-Designer-Other`}
                ]
                break;
            case `Creator`:
                options = [
                    { label:`Create new content`,value:`${type}-Creator-Create new content`},
                    { label:`Learn new skills`,value:`${type}-Creator-Learn new skills`},
                    { label:`Building Audience`,value:`${type}-Creator-Building Audience`},
                    { label:`Other`, value:`${type}-Creator-Other`}
                ]
                break;
            default:
                break;
        }
        return {
            content:"Pick your goal category:",
            components:[
                this.createComponent(
                    this.addMenu(
                        `goalCategory_${userId}`,
                        "– Select –",
                        options
                    )
                )
            ]
        }
    }
    
    static pickCoworkingTime(userId){
        return {
            content:`**Pick your favorite working time:**
🌤️ *Morning Club* — co-working hour from 07.00 – 11.30 WIB 
🌙 *Night Club* — co-working hour from 19.30 – 22.00  WIB

p.s: *you can always join the other club*`,
            components:[
                this.createComponent(
                    this.addButton(`morningTime_${userId}`,"🌤️ Morning"),
                    this.addButton(`nightTime_${userId}`,"🌙 Night"),
                )
            ]
        }
    }

    static askUserWriteGoal(dayLeft,descriptionDeadline,userId,valueMenu){
        return {
            content:`**Set your goal for a passion project**

You have **${dayLeft} ${dayLeft > 1 ? "days": "day"} left** before the next cohort deadline (${descriptionDeadline} day).

*Make sure to estimate your goal according community timeline above.*`,
            components:[
                this.createComponent(
                    this.addButton(`writeGoal_${userId}_${valueMenu}`,"🎯 Set your goal")
                )
            ]
        }
    }

    static replySuccessSubmitGoal(dayLeft){
        let textDayLeft = `${dayLeft} days`
        if (dayLeft === 0) {
            textDayLeft = 'Today' 
        }else if(dayLeft === 1){
            textDayLeft = "Tomorrow"
        }
        return `**Your goal are set!**

See you on our kick-off day! (in ${textDayLeft})
You will be matched with other members on the kick-off day at 20.30 WIB`
    }

    static reviewYourGoal({project,goal,about,shareProgressAt,role,deadlineGoal,user,value}){
        const typeAccountability = value.split('-')[0]
        return {
            content:"**REVIEW YOUR GOAL 📝**\n↓",
            embeds:[ this.templateEmbedMessageGoal({project,goal,about,typeAccountability,shareProgressAt,role,deadlineGoal,user}) ],
            components:[
                this.createComponent(
                    this.addButton(`postGoal_${user.id}_${value}`,typeAccountability === 'party' ? "Submit":"Post & commit","PRIMARY"),
                    this.addButton(`editGoal_${user.id}_${value}`,"Edit","SECONDARY"),
                )
            ]
        }
    }
    static postGoal({project,goal,about,shareProgressAt,role,deadlineGoal,user,value='party'}){
        const typeAccountability = value.split('-')[0]
        return {
            content:`${user} just started a new project 🔥`,
            embeds:[ this.templateEmbedMessageGoal({project,goal,about,shareProgressAt,typeAccountability,role,deadlineGoal,user}) ],
        }
    }

    static partyRoom(partyNumber,members,totalMember,leaderId){
        const {totalExistingMembers,totalTrialMember} = totalMember
        return {
            embeds:[
                new MessageEmbed()
                .setColor("#4ba341")
                .setTitle(`PARTY #${partyNumber}`)
                .setDescription("—————————")
                .addFields(
                    { name: 'Members:', value: `${members}—————————\n\n\`${totalExistingMembers}/3 Existing members \`\n\`${totalTrialMember}/1 Free Trial Member\`` },
                )
            ],
            components:[
                this.createComponent(
                    this.addButton(`joinPartyRoom_${leaderId}_${partyNumber}`,"Join")
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
        return `Hi @here!
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
                this.createComponent(this.addLinkButton("Learn more about 🔆highlight","https://closa.notion.site/Highlight-8173c92b7c014beb9e86f05a54e91386"))
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
                this.createComponent(
                    this.addButton(`defaultReminder_${userId}`,"Yes, set at 07.30 WIB","PRIMARY"),
                    this.addButton(`customReminder_${userId}`,"Let me custom my own reminder","PRIMARY"),
                    this.addButton(`noReminder_${userId}`,"No","SECONDARY"),
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
                this.createComponent(
                    this.addButton(`defaultReminder_${userId}_${prevDefaultTime}`,`Yes, set at ${prevDefaultTime} WIB`,"PRIMARY"),
                    this.addButton(`customReminder_${userId}`,"Edit Default Time","PRIMARY"),
                    this.addButton(`noReminder_${userId}`,"No","SECONDARY"),
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
            content:`Are you sure want to take another solo mode? 
Your future progress will be updated to your new project.`,
            components:[
                this.createComponent(
                    this.addButton(`continueReplaceGoal_${userId}_${accountabilityMode}`,"Yes, continue"),
                    this.addButton(`cancelReplaceGoal_${userId}_${accountabilityMode}`,"No","SECONDARY"),
                )
            ]
        }
    }

    static cancelReplaceGoal(accountabilityMode='party'){
        return `New ${accountabilityMode} mode has been canceled.`
    }

    static confirmationJoinParty(userId,partyId){
        return {
            content:`Are you sure to join party ${partyId}? ${MessageFormatting.tagUser(userId)}`,
            components:[this.createComponent(
                this.addButton(`acceptJoinParty_${userId}_${partyId}`,"Yes"),
                this.addButton(`declineJoinParty_${userId}_${partyId}`,"Cancel","SECONDARY"),
            )]
        }
    }

    static shareLinkPartyRoom(msgId){
        return `Share your party room using this link →  ${MessageFormatting.linkToMessage(CHANNEL_PARTY_ROOM,msgId)} (copy & share the link)`
    }

    static userJoinedParty(userId){
        return `${MessageFormatting.tagUser(userId)} joined the party`
    }

    static replyCancelJoinParty(){
        return "Join party has been canceled."
    }

    static replySuccessJoinParty(userId,msgId){
        return `**Hi ${MessageFormatting.tagUser(userId)} you've joined a party! 🎉**
Go to your party room → ${MessageFormatting.linkToInsideThread(msgId)}`
    }

    static welcomingPartyRoom(partyId){
       return `**Welcome to Party #${partyId}**! @here
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
            components:[this.createComponent(
                this.addLinkButton('Learn more about 🔆highlight',"https://closa.notion.site/Highlight-8173c92b7c014beb9e86f05a54e91386")
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

    static templateEmbedMessageGoal({project,goal,about,shareProgressAt,typeAccountability='party',role,deadlineGoal,user}){
        let {dayLeft,deadlineDate} = deadlineGoal
        const formattedDate = Time.getFormattedDate(Time.getDate(deadlineDate))
        let dayLeftDescription = `(${dayLeft} ${dayLeft > 1 ? "days": "day"} left)`
        return new MessageEmbed()
        .setColor("#ffffff")
        .setTitle(project)
        .setThumbnail(InfoUser.getAvatar(user))
        .addFields(
            { name: 'Goal 🎯', value: goal },
            { name: 'About project', value: about },
            { name: "I'll share my progress at", value: `${shareProgressAt} WIB every day` },
            { name: "Accountability", value: typeAccountability === 'party' ? "Party Mode" : "Solo Mode" },
            { name: "Role", value: role },
            { name: "Timeline", value: `${formattedDate} ${dayLeft > 0 ? dayLeftDescription :'(ended)'}` },
        )
    }

    static createComponent(...buttons){
        return new MessageActionRow()
            .addComponents(
                ...buttons
            )
    }

    static addButton(id,text,style="SUCCESS"){
        return new MessageButton()
            .setCustomId(id)
            .setLabel(text)
            .setStyle(style)
    }
    static addLinkButton(text,link){
        return new MessageButton()
            .setLabel(text)
            .setURL(link)
            .setStyle("LINK")
    }

    static addMenu(id,placeholder,options){
        return new MessageSelectMenu()
            .setCustomId(id)
            .setPlaceholder(placeholder)
            .addOptions(options)
    }

    static embedMessage(title,description,color="#00B264"){
        return new MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
    }
}

module.exports = PartyMessage