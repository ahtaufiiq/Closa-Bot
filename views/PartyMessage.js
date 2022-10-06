const { MessageEmbed, MessageActionRow, MessageButton, SelectMenuInteraction, MessageSelectMenu, MessageAttachment } = require("discord.js")
const { CHANNEL_NOTIFICATION, CHANNEL_HIGHLIGHT } = require("../helpers/config")
class PartyMessage {
    static initSoloMode(){
        return { 
            content:`*Solo mode* — you'll accountable for yourself & closa community.` , 
            components: [this.createComponent(this.addButton("writeGoalSolo","🤟 Write goal"))] 
        }
    }
    static contentWaitingRoom(totalPeopleWaitingFor,listPeople){
        return `**🛋 Waiting Room**
Waiting for **${totalPeopleWaitingFor}** people to set goal
${listPeople}`
    }
    static embedMessageWaitingRoom(time){
        return {
            embeds:[this.embedMessage("🎊 PARTY MODE",`**${time}** before kick-off day & group match-making.`)],
            components:[this.createComponent(
                this.addButton('joinParty','Join Party'),
                this.addButton('leaveWaitingRoom', "Leave waiting room","SECONDARY")
            )]
        }
    }

    static replySuccessJoinParty(){
        return `**You've joined party mode.** 
For the next step follow the step on your → <#${CHANNEL_NOTIFICATION}>`
    }

    static pickYourRole(userId){
        return {
            content:`**Pick your role**
p.s: *you can always change it in the next cohort*`,
            components:[this.createComponent(
                this.addButton(`roleDeveloper_${userId}`,"🌐 Developers"),
                this.addButton(`roleDesigner_${userId}`,"🟦 Designer"),
                this.addButton(`roleCreator_${userId}`,"▶️ Creators"),
            )]
        }
    }

    static pickYourGoalCategory(role,userId){
        let options = []
        switch (role) {
            case "developer":
                options = [
                    { label:"Build a website ", value:"Build a website "},
                    { label:"Build an app", value:"Build an app"},
                    { label:"Coding interview preparation", value:"Coding interview preparation"},
                    { label:"Learn new front-end stacks", value:"Learn new front-end stacks"},
                    { label:"Learn new back-end stacks", value:"Learn new back-end stacks"},
                    { label:"Learn new mobile stacks", value:"Learn new mobile stacks"},
                    { label:"Learn new tech stacks", value:"Learn new tech stacks"}
                ]
                break;
            case "designer":
                options = [
                    { label:"Writing case study",value:"Writing case study"},
                    { label:"Design exploration",value:"Design exploration"},
                    { label:"Building personal website",value:"Building personal website"},
                    { label:"Learn design things",value:"Learn design things"},
                ]
                break;
            case "creator":
                options = [
                    { label:"Create new content",value:"Create new content"},
                    { label:"Learn new skills",value:"Learn new skills"},
                    { label:"Building Audience",value:"Building Audience"},
                ]
                break;
            default:
                break;
        }
        return {
            content:"pick your goal category:",
            components:[
                this.createComponent(
                    this.addMenu(
                        `goalCategory_${userId}`,
                        "Reply",
                        options
                    )
                )
            ]
        }
    }
    
    static pickCoworkingTime(userId){
        return {
            content:`**Pick your favorite working time:**
Morning Club — co-working hour from 07.00 – 11.30 WIB 
Night Club — co-working hour from 19.30 – 22.00  WIB

p.s: *you can always join the other club*`,
            components:[
                this.createComponent(
                    this.addButton(`morningTime_${userId}`,"🌤️ Morning"),
                    this.addButton(`nightTime_${userId}`,"🌙 Night"),
                )
            ]
        }
    }

    static askUserWriteGoal(dayLeft,userId){
        return {
            content:`**Post your goal & let the community know**
You have **${dayLeft} ${dayLeft > 1 ? "days": "day"} left** before the next cohort deadline (celebration day).
Make sure to set your goal based on the deadline to match with community timeline.`,
            components:[
                this.createComponent(
                    this.addButton(`writeGoalParty_${userId}`,"Write goal")
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

    static partyRoom(partyNumber,members,totalExistingMembers,totalFreeTrialMember){
        return {
            embeds:[
                new MessageEmbed()
                .setColor("4ba341")
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
            content:`Hi <@${userId}>, your next steps is to write your highlight of the day → on <#${CHANNEL_HIGHLIGHT}> `,
            components:[
                this.createComponent(this.addLinkButton("Learn more about 🔆highlight","https://closa.notion.site/Highlight-8173c92b7c014beb9e86f05a54e91386"))
            ]
        }
    }

    static settingReminderHighlight(userId){
        return {
            content:`**Your highlight successfully scheduled!** :high_brightness:

Would you like to be reminded to schedule your highlight at \`\`07.30 WIB\`\` every day?
> p.s: *91% of people who set highlight are would like to get things done.*`,
            components:[
                this.createComponent(
                    this.addButton(`defaultReminder_${userId}`,"yes"),
                    this.addButton(`customReminder_${userId}`,"custom reminder"),
                )
            ]
        }
    }
    
    static replyDefaultReminder(){
        return `**Your highlight reminder is set!** ✅
We will remind you to schedule your highlight at 07.30 WIB every day.`
    }

    static replyCustomReminder(){
        return `**Use /slash command to set your reminder**
Try typing \`\`/remind highlight at\`\` in this channel.

For example: 
\`\`\`/remind highlight at 08.00\`\`\`  
Please use 24h for time format.`
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