const { MessageEmbed } = require("discord.js")
const { CHANNEL_TODO } = require("../helpers/config")
const FormatString = require("../helpers/formatString")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const Time = require("../helpers/time")

class GoalMessage {
    static askUserWriteGoal(dayLeft,descriptionDeadline,userId,valueMenu){
        return {
            content:`**Set your goal for a passion project**

You have **${dayLeft} ${dayLeft > 1 ? "days": "day"} left** before the next cohort deadline (${descriptionDeadline} day).

*Make sure to estimate your goal according community timeline above.*`,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`writeGoal_${userId}_${valueMenu}`,"🎯 Set your goal")
                )
            ]
        }
    }

    static remindToWriteGoal(userId){
        return `Hi ${MessageFormatting.tagUser(userId)} you haven't pick your role & set your goals yet. 
Please follow the step below until finish. `
    }

    static pickYourRole(userId,type="party"){
        return {
            content:`**Pick your role ${MessageFormatting.tagUser(userId)}**
p.s: *you can always change it in the next cohort*`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`roleDeveloper_${userId}_${type}`,"💻 Developers"),
                MessageComponent.addButton(`roleDesigner_${userId}_${type}`,"🏀 Designer"),
                MessageComponent.addButton(`roleCreator_${userId}_${type}`,"🎨 Creators"),
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
                MessageComponent.createComponent(
                    MessageComponent.addMenu(
                        `goalCategory_${userId}`,
                        "– Select –",
                        options
                    )
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
        let typeAccountability = value.split('-')[0]
        return {
            content:"**REVIEW & SUBMIT YOUR GOAL 📝**\n↓",
            embeds:[ this.templateEmbedMessageGoal({project,goal,about,typeAccountability,shareProgressAt,role,deadlineGoal,user}) ],
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`postGoal_${user.id}_${value}`, "🚀 SUBMIT"),
                    MessageComponent.addButton(`editGoal_${user.id}_${value}`,"Edit","SECONDARY"),
                )
            ]
        }
    }
    static postGoal({project,goal,about,shareProgressAt,role,deadlineGoal,user,value}){
        if(!value) value = `party-${role}`
        let typeAccountability = value.split('-')[0]
        return {
            content:`${user} just started a new project 🔥`,
            embeds:[ this.templateEmbedMessageGoal({project,goal,about,shareProgressAt,typeAccountability,role,deadlineGoal,user}) ],
            components: [MessageComponent.createComponent(
                MessageComponent.addButton(`editGoal_${user.id}_${value}`,"Edit","SECONDARY")
            )]
        }
    }

    static templateEmbedMessageGoal({project,goal,about,shareProgressAt,typeAccountability='party',role,deadlineGoal,user}){
        let {dayLeft,deadlineDate} = deadlineGoal
        const formattedDate = Time.getFormattedDate(Time.getDate(deadlineDate))
        let dayLeftDescription = `(${dayLeft} ${dayLeft > 1 ? "days": "day"} left)`
        return new MessageEmbed()
        .setColor("#ffffff")
        .setTitle(FormatString.truncateString(project,250))
        .setThumbnail(InfoUser.getAvatar(user))
        .addFields(
            { name: 'Goal 🎯', value:FormatString.truncateString( goal,1020) },
            { name: 'About project', value:FormatString.truncateString( about,1020) },
            { name: "I'll share my progress at", value:FormatString.truncateString( `${shareProgressAt} WIB every day`,1020) },
            { name: "Accountability", value:FormatString.truncateString( typeAccountability === 'solo' ? "Solo Mode" : "Party Mode",1020) },
            { name: "Role", value:FormatString.truncateString( role,1020) },
            { name: "Community deadline", value:FormatString.truncateString( `${formattedDate} ${dayLeft > 0 ? dayLeftDescription :'(ended)'}`,1020) },
        )
    }

    static shareProgress(msg,files,totalDay){
        const avatarUrl = InfoUser.getAvatar(msg.author)
        return {
			content:msg.content,
			embeds:[
				new MessageEmbed()
					.setColor('#ffffff')
					.setTitle("↳ Reply or React on timeline ›")
					.setURL(MessageFormatting.linkToMessage(CHANNEL_TODO,msg.id))
					.setFooter({text:`by ${msg.author.username} — DAY ${totalDay}`,iconURL:avatarUrl})
			],
            files
		}
    }
}

module.exports = GoalMessage