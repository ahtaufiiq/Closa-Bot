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
            description:`In honor of your consistency to do what matters every day. You just got 🔥 ${total}x day streak badge!
Now you have fire animation every time you keep the streak. 👀
You can check the badge on your profile.`
        },"#fefefe")
    }

    static missYesterdayProgress(userId){
        return 	{
            content:`Hi ${MessageFormatting.tagUser(userId)} **yesterday you forgot to update your ${MessageFormatting.tagChannel(CHANNEL_TODO)}.**
But don't worry—you are not losing your #🔥streak :v:

\`\`To keep you streak you can:\`\`
• Continue post your progress today.
• Or buy a vacation ticket if you want to take a break today.`,
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton('buyOneVacationTicket','Buy 1 vacation ticket',`🏖`),
                MessageComponent.addButton('declineBuyVacationTicket',"I'll make progress today","SECONDARY"),
                MessageComponent.addLinkButton("Learn more ↗","https://closa.notion.site/Vacation-Ticket-1cb1ff1110ef40a39cc26841061aa6fe"),
            )]
        }
    }

    static remindUserAboutToLoseStreak(userId){
        return {
            content:`**Hi ${MessageFormatting.tagUser(userId)} this is a final call. You are about to lose your #🔥streak 🙏**

\`\`To keep your streak you can:\`\`
• Start tiny and post your progress today.
• or you can buy a vacation ticket for today.`,
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton('buyOneVacationTicket','Buy 1 vacation ticket',`🏖`),
                MessageComponent.addButton('declineBuyVacationTicket',"I'll make progress today","SECONDARY"),
                MessageComponent.addLinkButton("Learn more ↗","https://closa.notion.site/Vacation-Ticket-1cb1ff1110ef40a39cc26841061aa6fe"),
            )]
        }
    }

    static activateSafetyDot(userId,currentStreak,attachment){
        return {
            content:`${MessageFormatting.tagUser(userId)} safety dot automatically activated to safe you from losing ${currentStreak}x streak.
\`\`Please don't skip more than once to keep your streak & come back tomorrow.\`\``,
            files:[
                attachment
            ]
        }
    }
}

module.exports=DailyStreakMessage