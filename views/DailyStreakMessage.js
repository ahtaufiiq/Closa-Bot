const { MessageEmbed } = require("discord.js")
const { CHANNEL_TODO } = require("../helpers/config")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")

class DailyStreakMessage{

    //-----------------------    Daily Streak    -----------------------// 

    static dailyStreak(streak,user,longestStreak){
        let url 
        let color = '#fefefe'
        if (longestStreak>=365) {
            color = '#ffcc00'
            url = 'https://cdn.discordapp.com/attachments/746601801150758962/746682286530887780/708780647157858324.gif'
        }else if (longestStreak>=100) {
            color = '#5856ff'
            url = 'https://media3.giphy.com/media/AEHWYyOBSmYRDl7kDc/giphy.gif'
        }else if (longestStreak>=30) {
            color = '#FF3B30'
            url = 'https://emojis.slackmojis.com/emojis/images/1564765165/6075/hot_fire.gif?1564765165'
        }else if (longestStreak>=7) {
            color = '#FF3B30'
            url = 'https://media1.giphy.com/media/lp8JndnFvTMndTWYWs/giphy.gif'
        }
        const avatarUrl = InfoUser.getAvatar(user)
        const textStreak = 'streak'
        
        if (longestStreak>=7) {
            
            return new MessageEmbed()
            .setColor(color)
            .setAuthor({name:`${streak}x day streak!`.toUpperCase(),iconURL:url})
            .setFooter({text:`${user.username}`, iconURL:avatarUrl})
        }else{
            return new MessageEmbed()
            .setColor(color)
            .setAuthor({name:`🔥 ${streak}x day ${textStreak}!`.toUpperCase()})
            .setFooter({text:`${user.username}`, iconURL:avatarUrl})
        }
    }

    static notify7DaysStreak(user){
        return MessageComponent.embedMessage({
            description:`Congratulations ${user} in honor of your consistency to do what matters every day.  you just got 🔥7x day streak badge! 

Now your fire have animation 👀every time you keep the streak.
You can check the badge on your profile.`
        },"#fefefe")
    }

    static notifyDailyStreak(total){
        return MessageComponent.embedMessage({
            description:`In honor of your consistency to do what matters every day. 
You just got ${total}x day streak badge! 🔥
Now you have fire animation every time you keep the streak. 👀
You can check the badge on your profile.`
        },"#fefefe")
    }

    static missYesterdayProgress(userId){
        return 	{
            content:`Hi ${MessageFormatting.tagUser(userId)} **yesterday you forgot to update your ${MessageFormatting.tagChannel(CHANNEL_TODO)}.**
But don't worry—you are not losing your #🔥streak :v:

\`\`To keep your streak you can:\`\`
• Continue post your progress today.
• Or buy a vacation ticket if you want to take a break today.`,
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton('buyOneVacationTicket','Buy 1 vacation ticket',`🏖`),
                MessageComponent.addButton('shopSickTicket',"🤢 Set as a sick day","SECONDARY"),
                MessageComponent.addLinkButton("Learn more ↗","https://closa.notion.site/Vacation-Ticket-1cb1ff1110ef40a39cc26841061aa6fe"),
            )]
        }
    }

    static remindUserAboutToLoseStreak(userId,currentStreak){
        return {
            content:`**Your ${currentStreak}-day streak is in danger! ${MessageFormatting.tagUser(userId)}**
Share your daily ${MessageFormatting.tagChannel(CHANNEL_TODO)} today to keep it alive.`,
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton('buyOneVacationTicket','Buy 1 vacation ticket',`🏖`),
                MessageComponent.addButton('shopSickTicket',"🤢 Set as a sick day","SECONDARY"),
                MessageComponent.addLinkButton("Learn more ↗","https://closa.notion.site/Vacation-Ticket-1cb1ff1110ef40a39cc26841061aa6fe"),
            )]
        }
    }

    static activateSafetyDot(user,currentStreak,longestStreak,attachment){
        const avatarUrl = InfoUser.getAvatar(user)
        let color = '#fefefe'

        return {
            content:`${user} safety dot automatically activated to safe you from losing ${currentStreak}x streak.
\`\`Please don't skip more than once to keep your streak & come back tomorrow.\`\``,
            embeds:[
                 new MessageEmbed()
                    .setColor(color)
                    .setAuthor({name:`Safety dot activated 🟩`})
                    .setFooter({text:`${user.username}`, iconURL:avatarUrl})
            ],
            components:[MessageComponent.createComponent(
                MessageComponent.addLinkButton("Learn more about safety dot 🟩","https://www.notion.so/closa/Habit-Tracker-dafeb8ce620c4210b3a3be4033933eb6#c48809b429e041be86884562f1b3d77b")
            )],
            files:[
                attachment
            ]
        }
    }

    static repairStreak(streak,userId,time){
        return {
            content:`**${streak}-day streak lost! ${MessageFormatting.tagUser(userId)}** 😭

Do you want to repair your record?
this fund helps us keep the community running.
*To keep it fair, repair only valid 1x per cohort & 24-hour time to repair*

Time left: \`\`${time}\`\` ⏳`,
            components:[MessageComponent.createComponent(
                MessageComponent.addLinkButton('Repair for IDR 49.900','https://tally.so/r/n9BWrX').setEmoji('🛠️'),
                MessageComponent.addButton(`repairStreak_${userId}`,'Repair for 7500 pts',"SUCCESS").setEmoji('🪙'),
            )]
        }
    }

    static confirmationBuyRepairStreak(totalPoint,msgId){
        return {
            content:`**Are you sure to repair using 7500 points?**

\`\`Your points:\`\` ${totalPoint} :coin:`,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`confirmBuyRepairStreak_null_${msgId}`,'Yes'),
                    MessageComponent.addButton(`cancelBuyRepairStreak`,'Cancel',"SECONDARY"),
                )
            ]
        }
    }

    static notHaveEnoughPoint(){
        return {
            content:`You don't have enough points to repair your streak?`,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addLinkButton('Repair for IDR 49.900','https://tally.so/r/n9BWrX').setEmoji('🛠️'),
                    MessageComponent.addLinkButton(`Learn more about points`,'https://closa.notion.site/Vibe-Points-d969f1a3735447b5b9e5b3c67bbb02d2').setEmoji('💡'),
                )
            ]
        }
    }

    static successRepairStreak(user,files){
        return {
            content: `**Your Streak has been recovered! ✨**
please continue making progress today, or you will lose your streak again & can't recover ${user}`,
            files
        }
    }
}

module.exports=DailyStreakMessage