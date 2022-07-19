const { MessageEmbed } = require("discord.js")
const InfoUser = require("../helpers/InfoUser")

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
        const textStreak = streak > 1 ? 'streaks' : 'streak'
        
        if (longestStreak>=7) {
            
            return new MessageEmbed()
            .setColor(color)
            .setAuthor({name:`${streak}x day ${textStreak}!`.toUpperCase(),iconURL:url})
            .setFooter({text:`${user.username}`, iconURL:avatarUrl})
        }else{
            return new MessageEmbed()
            .setColor(color)
            .setAuthor({name:`🔥 ${streak}x day ${textStreak}!`.toUpperCase()})
            .setFooter({text:`${user.username}`, iconURL:avatarUrl})
        }
    }

    static notify7DaysStreak(user){
        return DailyStreakMessage.embedMessage(`Congratulations ${user} in honor of your consistency to do what matters every day.  you just got 🔥7x day streak badge! 

Now your fire have animation 👀every time you keep the streak.
You can check the badge on your profile.`)
    }

    static notifyDailyStreak(total){
        return DailyStreakMessage.embedMessage(`In honor of your consistency to do what matters every day. You just got 🔥 ${total}x day streak badge!
Now you have fire animation every time you keep the streak. 👀
You can check the badge on your profile.`)
    }
    static embedMessage(text){
        return new MessageEmbed()
        .setColor('#fefefe')
        .setDescription(text)
    }
}

module.exports=DailyStreakMessage