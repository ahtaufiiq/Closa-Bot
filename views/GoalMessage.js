const { EmbedBuilder, channelMention, userMention, ButtonStyle } = require("discord.js")
const { CHANNEL_TODO, CHANNEL_GOALS } = require("../helpers/config")
const FormatString = require("../helpers/formatString")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const Time = require("../helpers/time")

class GoalMessage {

    static initWelcomeStartProject(){
        return {
            files:['./assets/images/banner_start_project.png'],
            content:`**Set a goal for your project & commit to it** :dart:

best of luck!
✌️ `,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton('startProject',"Start a Project").setEmoji('✨'),
                MessageComponent.addButton('start6WIC',"6-Week Challenge",ButtonStyle.Secondary).setEmoji('🕹️')
            )],
        }
    }
    static askUserWriteGoal(dayLeft,userId,isSixWeekChallenge=false){
        let content = `**Set a goal for your project** :dart: 

*We recommend to work on 6 weeks timeline to get meaningful result*

read this guideline before setting your goal → https://closa.me/how-to-set-right-goal`

        if(isSixWeekChallenge){
            content = `**Set a goal for your project **:dart: 

When setting your goal you can follow:
→ community deadline: \`\`next demo day in  ${dayLeft} ${dayLeft > 1 ? "days": "day"} — ${Time.getFormattedDate(Time.getNextDate(dayLeft))}\`\`
→ or set your own deadline ( *we recommend working in 6 weeks to get meaningful results*).
→ guideline for goal setting → https://closa.me/how-to-set-right-goal`
        }
        return {
            content,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`writeGoal_${userId}${isSixWeekChallenge?'_sixWeekChallenge':''}`,"🎯 Set project goal")
                )
            ]
        }
    }

    static replyStartSetGoal(notificationId,messageId){
        return `**For the next step check your** 🔔 notification → ${MessageFormatting.linkToInsideThread(notificationId)}/${messageId}`
    }

	static setDailyWorkTime(userId,fromSetting,isSixWeekChallenge = false){
        let command = `selectDailyWorkGoal`
        if(fromSetting) command = `setDailyWorkTime`
        return {
            content:`⬇️ continue start project

**How much time you want to work daily on your project?** ${userMention(userId)}`,
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addMenu( 
                        `${command}_${userId}${isSixWeekChallenge ? '_sixWeekChallenge' : ''}`,
                        "- Select daily work time goal -",
                        [
                            {
                                label: "25 min/day (Casual)",
                                value: "25_25 min/day"
                            },
                            {
                                label: "1 hour/day (Regular)",
                                value: "60_1 hour/day"
                            },
                            {
                                label: "2 hour/day (Serious) ",
                                value: "120_2 hour/day"
                            },
                            {
                                label: "4 hour/day (Intense)",
                                value: "240_4 hour/day"
                            },
                            {
                                label: '✎ Custom Time',
                                value: 'custom'
                            }
                        ]
                    ),
                )
            ]
        }
    }

    static preferredCoworkingTime(userId,isSixWeekChallenge=false){
        return {
            content:`**Schedule your preferred daily coworking time 🕖👩‍💻👨‍💻**`,
            components:[MessageComponent.createComponent(
                MessageComponent.addMenu( 
                    `selectPreferredCoworkingTime_${userId}${isSixWeekChallenge?'_sixWeekChallenge':''}`,
                    "- Select your default coworking time –",
                    [
                        {
                            label: "08.00 🕗",
                            value: "8.00"
                        },
                        {
                            label: "15.00 🕒",
                            value: "15.00"
                        },
                        {
                            label: "20.00 🕗",
                            value: "20.00"
                        },
                        {
                            label: 'Custom ⏲️',
                            value: 'custom'
                        }
                    ]
                ),
            )]
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

    static replySuccessSubmitGoal(userId,channelId,goalId){
        return `Congrats on starting your project ${MessageFormatting.tagUser(userId)}! 🎉

here's your project → ${MessageFormatting.linkToMessage(channelId,goalId)}`
    }

    static postGoal({project,goal,about,shareProgressAt,preferredCoworkingTime,deadlineGoal,user,files},isSixWeekChallenge=false){
        const buttons = [
            MessageComponent.addButton(`followGoal_${user.id}_${user.username}`,"Follow","SECONDARY"),
            MessageComponent.addButton(`editGoal_${user.id}${isSixWeekChallenge ? '_sixWeekChallenge' : ''}`,"Edit","SECONDARY"),
        ]
        if(isSixWeekChallenge){
            buttons.push(MessageComponent.addLinkButton('Share on Twitter',`https://twitter.com/intent/tweet?text=${ encodeURIComponent(GoalMessage.templateShareSixWIC(project,about).substring(0,300))}`).setEmoji({id:'1000905823368794214',name:'twitterlogo'}))
        }

        return {
            content:`${user} ${isSixWeekChallenge ? 'just joined 6-week idea challenge! 🔥':'just started a new project 🔥'}`,
            files,
            embeds:[ this.templateEmbedMessageGoal({project,goal,about,shareProgressAt,preferredCoworkingTime,deadlineGoal,user},isSixWeekChallenge) ],
            components: [MessageComponent.createComponent(
                ...buttons
            )]
        }
    }

    static templateEmbedMessageGoal({project,goal,about,shareProgressAt,preferredCoworkingTime,deadlineGoal,user},isSixWeekChallenge=false){
        const dayLeft = Time.getDiffDay(Time.getDate(),deadlineGoal)
        const formattedDate = Time.getFormattedDate(deadlineGoal)
        let dayLeftDescription = `(${dayLeft} ${dayLeft > 1 ? "days": "day"} left)`
        const fields = [
            { name: 'Goal 🎯', value:FormatString.truncateString( goal,1020) },
        ]

        if(isSixWeekChallenge) fields.push({ name: 'About project', value:FormatString.truncateString( about,1020) },)

        fields.push(
            { name: "I'll share my progress at", value:FormatString.truncateString( `${shareProgressAt} WIB every day`,1020) },
            { name: "Preferred coworking time", value:FormatString.truncateString( `${preferredCoworkingTime}`,1020) },
            { name: "Project deadline", value:FormatString.truncateString( `${formattedDate} ${dayLeft > 0 ? dayLeftDescription :'(ended)'}`,1020) }
        )

        return new EmbedBuilder()
        .setColor(isSixWeekChallenge ? '#0E827B' : "#ffffff")
        .setTitle(FormatString.truncateString(project,250) || null)
        .addFields(
            ...fields
        )
    }

    static shareProgress(msg,files,totalDay){
        const avatarUrl = InfoUser.getAvatar(msg.author)
        return {
			content:msg.content,
			embeds:[
				new EmbedBuilder()
					.setColor('#ffffff')
					.setTitle("↳ Reply or React on timeline ›")
					.setURL(MessageFormatting.linkToMessage(CHANNEL_TODO,msg.id))
					.setFooter({text:`by ${msg.author.username} — DAY ${totalDay}`,iconURL:avatarUrl})
			],
            files
		}
    }

    static followGoal(userId){
        return {
            content:"@everyone",
            embeds:[MessageComponent.embedMessage({description:`${MessageFormatting.tagUser(userId)} just left party`})]
        }
    }

    static infoThreadProject(UserId){
        return `**This is a place for all of your ⁠progress history** ${userMention(UserId)}

Every time you share your work at ${channelMention(CHANNEL_TODO)}—it will automatically send inside this thread as well.
so, you can always see the history of all your progress here.`
    }

    static templateShareSixWIC(projectName,aboutProject){
        return `Hi Twitter!

currently, I'm working on ${projectName} for the next few weeks.

${aboutProject}

this is my goal at @joinclosa:`
    }

    static searchProject(userId,goalMenus,isAnotherUser=false){
        const components = []

        components.push(MessageComponent.createComponent(
            MessageComponent.addMenu( 
                `searchProject`,
                "-- Select project --",
                goalMenus
            ),
        ))

        return {
            content:isAnotherUser? `Project by ${userMention(userId)}, select one to go to the project history:` :`Here's your project ${userMention(userId)}, select one to go to the project history:`,
            components
        }
    }
    static selectGoal(userId,goalMenus){
        const components = []

        if(goalMenus.length > 0){
            components.push(MessageComponent.createComponent(
                MessageComponent.addMenu( 
                    `selectProject_${userId}_${taskId}`,
                    "-Select project-",
                    goalMenus
                ),
            ))
        }else{
            components.push(MessageComponent.createComponent(
                MessageComponent.addButton(`addNewProject_${userId}_${taskId}`,"Add new project +").setEmoji('✨')
            ))
        }

        return {
            content:`Select the project you want to work on ${MessageFormatting.tagUser(userId)}`,
            components
        }
    }

    static setReminderShareProgress(userId){
        return {
            content:`**Set a reminder to share your daily progress ** 🔔`,
            components:[MessageComponent.createComponent(
                MessageComponent.addMenu( 
                    `setReminderShareProgress_${userId}`,
                    "– Remind me to share my progress at –",
                    [
                        {
                            label: "21.00 🔔",
                            value: "21.00"
                        },
                        {
                            label: "22.00 🔔",
                            value: "22.00"
                        },
                        {
                            label: "23.00 🔔",
                            value: "23.00"
                        },
                        {
                            label: '✏️ Set custom time',
                            value: 'custom'
                        }
                    ]
                ),
            )]
        }
    }
    static setDeadlineProject(userId){
        const sixWeekDeadlineDate = Time.getNextDate(7*6)
        const fourWeekDeadlineDate = Time.getNextDate(7*4)
        const twoWeekDeadlineDate = Time.getNextDate(7*2)
        return {
            content:`**Set deadline for your project 🗓️**`,
            components:[MessageComponent.createComponent(
                MessageComponent.addMenu( 
                    `setDeadlineProject_${userId}`,
                    "– Pick a deadline –",
                    [
                        {
                            label: `6 weeks — ${Time.getFormattedDate(sixWeekDeadlineDate)}`,
                            value: `${Time.getDateOnly(sixWeekDeadlineDate)}`
                        },
                        {
                            label: `4 weeks — ${Time.getFormattedDate(fourWeekDeadlineDate)}`,
                            value: `${Time.getDateOnly(fourWeekDeadlineDate)}`
                        },
                        {
                            label: `2 weeks — ${Time.getFormattedDate(twoWeekDeadlineDate)}`,
                            value: `${Time.getDateOnly(twoWeekDeadlineDate)}`
                        },
                        {
                            label: '✏️ Set custom date',
                            value: 'custom'
                        }
                    ]
                ),
            )]
        }
    }

    static startNewProject(userId,deadlineDate){
        return {
            content:`**Last, set a name & goal for your passion project** :dart:

\`\`explore / build / grow your passion projects.\`\`

Read & follow this guideline first, so you can avoid common mistakes.
↳ https://closa.me/how-to-set-right-goal`,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`startNewProject_${userId}_${deadlineDate}`,"🎯 Set name & goal")
                )
            ]
        }
    }
}

module.exports = GoalMessage