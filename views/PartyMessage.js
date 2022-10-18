const { MessageEmbed, MessageActionRow, MessageButton, SelectMenuInteraction, MessageSelectMenu, MessageAttachment } = require("discord.js")
const { CHANNEL_NOTIFICATION, CHANNEL_HIGHLIGHT, GUILD_ID, CHANNEL_GOALS } = require("../helpers/config")
const InfoUser = require("../helpers/InfoUser")
const Time = require("../helpers/time")
class PartyMessage {
    static initSoloMode(){
        return { 
            content:`:love_you_gesture: *Solo mode* — you'll accountable for yourself & closa community.` , 
            components: [this.createComponent(this.addButton("startSoloMode","Start"))] 
        }
    }
    static contentWaitingRoom(totalPeopleWaitingFor,listPeople){
        return `**🛋 Waiting Room**
Waiting for **${totalPeopleWaitingFor}** people to set goal
${listPeople}`
    }
    static embedMessageWaitingRoom(time,msgId){
        return {
            embeds:[this.embedMessage("🎊 PARTY MODE",`**${time}** before kick-off day & group match-making.
You will be grouped with members up to 4 people`)],
            components:[this.createComponent(
                this.addButton(`joinParty_${msgId}`,'Join Party'),
                this.addButton(`leaveWaitingRoom_${msgId}`, "Leave waiting room","SECONDARY")
            )]
        }
    }

    static replySuccessStartAccountabilityMode(notificationId,accountabilityMode='party'){
        return `**You've selected ${accountabilityMode} mode.** 
For the next step check your 🔔 **notification** → https://discord.com/channels/${GUILD_ID}/${notificationId}`
    }

    static pickYourRole(userId,type="party"){
        return {
            content:`**Pick your role**
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
                    { label:`Build a website `, value:`${type}-Developer-Build a website `},
                    { label:`Build an app`, value:`${type}-Developer-Build an app`},
                    { label:`Coding interview preparation`, value:`${type}-Developer-Coding interview preparation`},
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
                    { label:`Building personal website`,value:`${type}-Designer-Building personal website`},
                    { label:`Learn design things`,value:`${type}-Designer-Learn design things`},
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
                        "[–Select–]",
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
            content:`**Post your goal & let the community know**
You have **${dayLeft} ${dayLeft > 1 ? "days": "day"} left** before the next cohort deadline (${descriptionDeadline} day).
Make sure to set your goal based on the deadline to match with community timeline.`,
            components:[
                this.createComponent(
                    this.addButton(`writeGoal_${userId}_${valueMenu}`,"🎯 Write goal")
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

    static reviewYourGoal({project,goal,about,shareProgressAt,role,deadlineDate,user,value}){
        const typeAccountability = value.split('-')[0]
        return {
            content:"**REVIEW YOUR GOAL 📝**\n↓",
            embeds:[ this.templateEmbedMessageGoal({project,goal,about,typeAccountability,shareProgressAt,role,deadlineDate,user}) ],
            components:[
                this.createComponent(
                    this.addButton(`postGoal_${user.id}_${value}`,"Post & commit","PRIMARY"),
                    this.addButton(`editGoal_${user.id}_${value}`,"Edit","SECONDARY"),
                )
            ]
        }
    }
    static postGoal({project,goal,about,shareProgressAt,role,deadlineDate,user,value}){
        const typeAccountability = value.split('-')[0]
        return {
            content:`from ${user}`,
            embeds:[ this.templateEmbedMessageGoal({project,goal,about,shareProgressAt,typeAccountability,role,deadlineDate,user}) ],
            
        }
    }

    static partyRoom(partyNumber,members,totalExistingMembers,totalFreeTrialMember){
        return {
            embeds:[
                new MessageEmbed()
                .setColor("#4ba341")
                .setTitle(`PARTY #${partyNumber}`)
                .setDescription("—————————")
                .addFields(
                    { name: 'Members:', value: '@apri 👑 — learn flutter\n\n@taufiq — learn flutter\n\n@someone — learn flutter\n\n*empty slot for trial member*\n\n—————————' },
		            { name: '\u200B', value: '\`3/3 Pro members \`\n\`0/1 Free Trial Member\`' },
                )
            ],
            components:[
                this.createComponent(
                    this.addButton(`joinParty_${partyNumber}`,"Join")
                )
            ]
        }
    }

    static askUserWriteHighlight(userId){
        return {
            content:`✅ <@${userId}> your goal has been submitted to <#${CHANNEL_GOALS}>

Next, write your highlight of the day → on <#${CHANNEL_HIGHLIGHT}> `,
            components:[
                this.createComponent(this.addLinkButton("Learn more about 🔆highlight","https://closa.notion.site/Highlight-8173c92b7c014beb9e86f05a54e91386"))
            ]
        }
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

    static templateEmbedMessageGoal({project,goal,about,shareProgressAt,typeAccountability='party',role,deadlineDate,user}){
        
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
            { name: "Timeline", value:  Time.getFormattedDate(Time.getDate(deadlineDate))},
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