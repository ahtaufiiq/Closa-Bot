const { MessageEmbed, MessageActionRow, MessageButton, SelectMenuInteraction, MessageSelectMenu, MessageAttachment } = require("discord.js")
const { CHANNEL_NOTIFICATION, CHANNEL_HIGHLIGHT, GUILD_ID } = require("../helpers/config")
const InfoUser = require("../helpers/InfoUser")
class PartyMessage {
    static initSoloMode(){
        return { 
            content:`:love_you_gesture: *Solo mode* — you'll accountable for yourself & closa community.` , 
            components: [this.createComponent(this.addButton("writeGoalSolo","Start"))] 
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

    static replySuccessStartSoloMode(notificationId){
        return `**You've selected solo mode.** 
For the next step check your 🔔 **notification** → https://discord.com/channels/${GUILD_ID}/${notificationId}`
    }
    static replySuccessJoinParty(notificationId){
        return `**You've joined party mode.** 
        For the next step follow the step on your 🔔 **notification** → https://discord.com/channels/${GUILD_ID}/${notificationId}`
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
            case `developer`:
                options = [
                    { label:`Build a website `, value:`${type}-developer-Build a website `},
                    { label:`Build an app`, value:`${type}-developer-Build an app`},
                    { label:`Coding interview preparation`, value:`${type}-developer-Coding interview preparation`},
                    { label:`Learn new front-end stacks`, value:`${type}-developer-Learn new front-end stacks`},
                    { label:`Learn new back-end stacks`, value:`${type}-developer-Learn new back-end stacks`},
                    { label:`Learn new mobile stacks`, value:`${type}-developer-Learn new mobile stacks`},
                    { label:`Learn new tech stacks`, value:`${type}-developer-Learn new tech stacks`},
                    { label:`Other`, value:`${type}-developer-Other`}
                ]
                break;
            case `designer`:
                options = [
                    { label:`Writing case study`,value:`${type}-designer-Writing case study`},
                    { label:`Design exploration`,value:`${type}-designer-Design exploration`},
                    { label:`Building personal website`,value:`${type}-designer-Building personal website`},
                    { label:`Learn design things`,value:`${type}-designer-Learn design things`},
                    { label:`Other`, value:`${type}-designer-Other`}
                ]
                break;
            case `creator`:
                options = [
                    { label:`Create new content`,value:`${type}-creator-Create new content`},
                    { label:`Learn new skills`,value:`${type}-creator-Learn new skills`},
                    { label:`Building Audience`,value:`${type}-creator-Building Audience`},
                    { label:`Other`, value:`${type}-creator-Other`}
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

    static askUserWriteGoal(dayLeft,userId,valueMenu){
        return {
            content:`**Post your goal & let the community know**
You have **${dayLeft} ${dayLeft > 1 ? "days": "day"} left** before the next cohort deadline (celebration day).
Make sure to set your goal based on the deadline to match with community timeline.`,
            components:[
                this.createComponent(
                    this.addButton(`writeGoalParty_${userId}_${valueMenu}`,"🎯 Write goal")
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

    static reviewYourGoal({project,goal,about,shareProgressAt,role,dayLeft,user,value}){
        const typeAccountability = value.split('-')[0]
        return {
            content:"**REVIEW YOUR GOAL 📝**\n↓",
            embeds:[ this.templateEmbedMessageGoal({project,goal,about,typeAccountability,shareProgressAt,role,dayLeft,user}) ],
            components:[
                this.createComponent(
                    this.addButton(`postGoal_${user.id}_${value}`,"Post & commit","PRIMARY"),
                    this.addButton(`editGoal_${user.id}_${value}`,"Edit","SECONDARY"),
                )
            ]
        }
    }
    static postGoal({project,goal,about,shareProgressAt,role,dayLeft,user,value}){
        const typeAccountability = value.split('-')[0]
        return {
            content:`from ${user}`,
            embeds:[ this.templateEmbedMessageGoal({project,goal,about,shareProgressAt,typeAccountability,role,dayLeft,user}) ],
            
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
            content:`**Your goal has been submitted ✅**

Next, write your highlight of the day → on <#${CHANNEL_HIGHLIGHT}> `,
            components:[
                this.createComponent(this.addLinkButton("Learn more about 🔆highlight","https://closa.notion.site/Highlight-8173c92b7c014beb9e86f05a54e91386"))
            ]
        }
    }


    static settingReminderHighlight(userId){
        return {
            content:`**Your highlight successfully scheduled!** :white_check_mark:

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
    
    static replyDefaultReminder(){
        return `**Your daily highlight reminder at 07.30 WIB is set!** 🔔`
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

    static templateEmbedMessageGoal({project,goal,about,shareProgressAt,typeAccountability='party',role,dayLeft,user}){
        
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
            { name: "Timeline", value: `${dayLeft} days left before celebration day` },
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