const { EmbedBuilder } = require("discord.js")
const { CHANNEL_CLOSA_CAFE, CHANNEL_TODO, CHANNEL_SESSION_GOAL } = require("../helpers/config")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const Time = require("../helpers/time")
const UserController = require("../controllers/UserController")

class FocusSessionMessage{

    //-----------------------    Daily Streak    -----------------------// 
    
    static report(user,data){
        
        const {daily,weekly,monthly,all,average,dailyStreak,longestStreak} = data
        const avatarUrl = InfoUser.getAvatar(user)
        return new EmbedBuilder()
            .setColor('#FEFEFE')
            .addFields(
                {
                name:`Timeframe ${FocusSessionMessage.addSpace(5)} Hours`,
                value:`Daily:${FocusSessionMessage.addSpace(8,"\u2002")}**${daily}** h
Weekly:${FocusSessionMessage.addSpace(6,"\u2002")}${weekly} h
Monthly:${FocusSessionMessage.addSpace(5,"\u2002")}\u202F\u0020${monthly} h
All-time:${FocusSessionMessage.addSpace(5,"\u2002")}\u202F\u0020${all} h`,
                inline:true
                },
                {
                    name:"\u200B",
                    value:`Average/day (${Time.getThisMonth()}): \u2005**${average}** h\n\nCurrent study streak: \u2005${dailyStreak} days\nLongest study streak: \u2005${longestStreak} days`
                }
            )
            .setFooter({text:`${user.username}`, iconURL:avatarUrl})

    }

    static addSpace(n,unicode="\u2005"){
        let str = ""
        for (let i = 0; i < n; i++) {
            str += unicode 
        }
        return str
    }
    static report2(user){
        const {daily,weekly,monthly,all,average,dailyStreak,longestStreak} = {
            daily: '0.67',
            weekly: '9.67',
            monthly: '1.27',
            all: '1.27',
            average: '0.09',
            dailyStreak: '1',
            longestStreak: '3',
          }
        const avatarUrl = InfoUser.getAvatar(user)
        return new EmbedBuilder()
            .setColor('#FEFEFE')
            .addFields(
                {
                    name:`Timeframe ${FocusSessionMessage.addSpace(5)} Hours`,
                    value:`Daily:${FocusSessionMessage.addSpace(8,"\u2002")}**${daily}** h
Weekly:${FocusSessionMessage.addSpace(6,"\u2002")}${weekly} h
Monthly:${FocusSessionMessage.addSpace(5,"\u2002")}\u202F${monthly} h
All-time:${FocusSessionMessage.addSpace(5,"\u2002")}\u202F\u0020${all} h`,
                    inline:true
                },
                {
                    name:"\u200B",
                    value:`Average/day (${Time.getThisMonth()}): \u2005**${average}** h\n\nCurrent study streak: \u2005${dailyStreak} days\nLongest study streak: \u2005${longestStreak} days`
                }
            )
            .setFooter({text:`${user.username}`, iconURL:avatarUrl})

    }

    static startFocusSession(userId,voiceRoomId,isAlreadyJoinVoiceChannel=false){
        if(isAlreadyJoinVoiceChannel){
            return `hi ${MessageFormatting.tagUser(userId)}, now please **turn-on video** :camera_with_flash: or **sharescreen** :computer: to get started & stay accountable.
            
your time tracker will automatically start right after.`
        }else{
            return `hi ${MessageFormatting.tagUser(userId)}, now please join → ${MessageFormatting.tagChannel(voiceRoomId ? voiceRoomId : CHANNEL_CLOSA_CAFE)}

then **turn-on video** :camera_with_flash: or **sharescreen** :computer: to get started & stay accountable.
your time tracker will automatically start right after.`
        }
    }

    static messageTimer({focusTime,breakTime,totalTime,isFocus,dailyWorkTime,totalTimeToday},taskName,projectName,userId,isLive=true){
        const components = []
        if(isLive && isFocus){
            components.push(MessageComponent.createComponent(
                MessageComponent.addEmojiButton(`breakFiveMinute_${userId}`,'5 min break','☕'),
                MessageComponent.addEmojiButton(`breakFifteenMinute_${userId}`,'15 min break','🍱')
            ))
        }
        return {
            content:`\`\`\`Focus time ${isLive ? 'started' : 'ended'}\`\`\`
💻 Work: \`\`${Time.convertTime(totalTime,'short')}\`\` in total
⏲️ Focus: \`\`${Time.convertTime(focusTime,'short')}\`\` ${isFocus && isLive ? '— **LIVE :red_circle:**':''}
☕ Breaks: \`\`${Time.convertTime(breakTime,'short')}\`\` ${!isFocus && isLive ? '— **LIVE :red_circle:**':''}
🎯 Goal: \`\`${Math.round((totalTime + totalTimeToday) / Number(dailyWorkTime) * 100) }%\`\` from \`\`${Time.convertTime(dailyWorkTime,'short')}\`\` daily work time goal

\`\`\`
Project: ${projectName}
➡️ Task: ${taskName}
\`\`\`
${isLive ? `\`\`\`💡 pro tip:
• take frequent breaks to improve your productivity.
• try to hit your daily work time goal.
• disconnect to end your focus time.\`\`\`
cc: ${MessageFormatting.tagUser(userId)}`:''}`,
            components
        }
    }

    static selectProject(userId,projectMenus,taskId){
        const components = []

        if(projectMenus.length > 0){
            components.push(MessageComponent.createComponent(
                MessageComponent.addMenu( 
                    `selectProject_${userId}_${taskId}`,
                    "-Select project-",
                    projectMenus
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

    static setDailyWorkTime(userId,projectId,taskId){
        
        return {
            content:`**Last setup :sparkles: **

Let's set your default **daily work time goal** to prevent from overworking ${MessageFormatting.tagUser(userId)} 
\`\`💡 Work time = total of Focus time + Break time per day\`\`

(*we only ask this one time, you can change on settings later.*)`,
            components: [
                MessageComponent.createComponent(
                    MessageComponent.addMenu( 
                        `selectDailyWorkTime_${userId}_${projectId}-${taskId}`,
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
                            
                        ]
                    ),
                )
            ]
        }
    }

    static successSetDailyWorkTime(labelMenu){
        const time = labelMenu ? labelMenu.split('(')[0] : ''
        return`**✅ Your daily work time goal has been set to ${time}**`
    }

    static messageBreakTime(time,userId){
        return {
            content:`Your break has started ${MessageFormatting.tagUser(userId)}: **${Time.convertTime(time,'short')}** — **LIVE :red_circle:**
            
please keep your \`\`video\`\` or \`\`sharescreen\`\` **ON** to stay accountable.`,
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton(`continueFocus_${userId}`,'Continue Focus','⏱'),
                MessageComponent.addEmojiButton(`breakFiveMinute_${userId}_addBreak`,'5 min more','☕'),
                MessageComponent.addEmojiButton(`breakFifteenMinute_${userId}_addBreak`,'15 min more','🍱')
            )]
        }
    }

    static reminderEndedBreak(userId){
        return {
            content:`**1 min left for break** before the focus time auto started ${MessageFormatting.tagUser(userId)}`,
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton(`continueFocus_${userId}`,'Continue Focus','⏱'),
                MessageComponent.addEmojiButton(`breakFiveMinute_${userId}_addBreak`,'5 min more','☕'),
                MessageComponent.addEmojiButton(`breakFifteenMinute_${userId}_addBreak`,'15 min more','🍱')
            )]
        }
    }

    static reachedDailyWorkTime(dailyWorkTime,userId){
        return `You reached ${Time.convertTime(dailyWorkTime)} of work today ${MessageFormatting.tagUser(userId)}
Wrap up your day and let's share your ${MessageFormatting.tagChannel(CHANNEL_TODO)}.`
    }

    static embedPointReward(increment,totalPoint,user){
        return new EmbedBuilder()
                .setColor("#FEFEFE")
                .setDescription(`Total points: ${totalPoint} (+${increment}) :coin:`)
                .setAuthor({name:`+${increment} points`.toUpperCase(),iconURL:"https://media.giphy.com/media/QZJ8UcjU5VfFwCIkUN/giphy.gif "})
                .setFooter({text:UserController.getNameFromUserDiscord(user), iconURL:InfoUser.getAvatar(user)})
    }

    static recapDailySummary(user,files,incrementVibePoint,totalPoint,totalTime,totalFocusTime,dailyWorkTime){
        const totalBreakTime = totalTime - totalFocusTime
        const percentageWorkHours = Math.round(totalTime/dailyWorkTime*100)
        let content = `Here's your recap ${user}\n`
        if(dailyWorkTime > totalTime){
            content += `You are \`\`${percentageWorkHours}%\`\` on your daily work hours goal with \`\`${Time.convertTime(totalFocusTime,'short',true)}\`\` focused work & \`\`${Time.convertTime(totalBreakTime,'short',true)}\`\` breaks.
\`\`${Time.convertTime(dailyWorkTime - totalTime,'short',true)} (${100 - percentageWorkHours}%)\`\` away to reached your daily work goal.`
        }else{
            content += `You've reached \`\`${percentageWorkHours}% (${Time.convertTime(totalTime,'short',true)})\`\` of your \`\`${Time.convertTime(dailyWorkTime,'short',true)}\`\` daily work hours goal today :tada:`
        }
        return {
            content, 
            files,
            embeds:[
                FocusSessionMessage.embedPointReward(incrementVibePoint,totalPoint,user)
            ]
        }
    }

    static askToWriteSessionGoal(userId){
        return `hi ${MessageFormatting.tagUser(userId)}, please write your ${MessageFormatting.tagChannel(CHANNEL_SESSION_GOAL)} to start your session.`
    }

    static askToAccountability(userId,alreadySetSessionGoal,statusSetSessionGoal){
        let firstStep = `set ${MessageFormatting.tagChannel(CHANNEL_SESSION_GOAL)} by writing 1 specific task `
        if(statusSetSessionGoal === 'setDailyWorkTime') firstStep = '**please select daily work time above**'
        else if(statusSetSessionGoal === 'selectProject') firstStep = '**please select the project above**'

        if(alreadySetSessionGoal){
        return `Hi ${MessageFormatting.tagUser(userId)}, please do one of these following:
**turn on your video** :camera_with_flash: or **sharescreen** :computer: to stay accountable

please do it within **2 min** before you get auto-kick from the room.`
        }else{
            return `Hi ${MessageFormatting.tagUser(userId)}, please do the following steps:
1. ${firstStep}
2. **turn on your video** :camera_with_flash: or **sharescreen** :computer: to stay accountable

please do it within **2 min** before you get auto-kick from the room.`
        }
    }
}

module.exports=FocusSessionMessage