const DailyStreakMessage = require('../views/DailyStreakMessage');
const MemberController = require('./MemberController');
const {ROLE_7STREAK,ROLE_30STREAK,ROLE_100STREAK,ROLE_365STREAK} = require('../helpers/config')
class DailyStreakController {
    
    static achieveDailyStreak(bot,ChannelReminder,dailyStreak,author){
        switch (dailyStreak) {
            case 7:
               ChannelReminder.send({content:`Welcome to <@&${ROLE_7STREAK}> ${author}! :partying_face: :tada: `,embeds:[DailyStreakMessage.notifyDailyStreak(7)]})
               MemberController.addRole(bot, author.id, ROLE_7STREAK)
                break;
            case 30:
                ChannelReminder.send({content:`Welcome to <@&${ROLE_30STREAK}> ${author}! :partying_face: :tada: `,embeds:[DailyStreakMessage.notifyDailyStreak(30)]})
                MemberController.addRole(bot, author.id, ROLE_30STREAK)
                break;
            case 100:
                ChannelReminder.send({content:`Welcome to <@&${ROLE_100STREAK}> ${author}! :partying_face: :tada: `,embeds:[DailyStreakMessage.notifyDailyStreak(100)]})
                MemberController.addRole(bot, author.id, ROLE_100STREAK)
                break;
            case 365:
                ChannelReminder.send({content:`Welcome to <@&${ROLE_365STREAK}> ${author}! :partying_face: :tada: `,embeds:[DailyStreakMessage.notifyDailyStreak(365)]})
                MemberController.addRole(bot, author.id, ROLE_365STREAK)
                break;
        }
    }
}

module.exports = DailyStreakController
