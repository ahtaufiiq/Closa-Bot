const DailyStreakMessage = require('../views/DailyStreakMessage');
const MemberController = require('./MemberController');
const {ROLE_7STREAK,ROLE_30STREAK,ROLE_100STREAK,ROLE_365STREAK} = require('../helpers/config')
class DailyStreakController {
    
    static achieveDailyStreak(bot,ChannelReminder,dailyStreak,author){
        switch (dailyStreak) {
            case 7:
               ChannelReminder.send({embeds:[DailyStreakMessage.notify7DaysStreak(author)]})
               MemberController.addRole(bot, author.id, ROLE_7STREAK)
                break;
            case 30:
                ChannelReminder.send({embeds:[DailyStreakMessage.notifyDailyStreak(author, 30)]})
                MemberController.addRole(bot, author.id, ROLE_30STREAK)
                break;
            case 100:
                ChannelReminder.send({embeds:[DailyStreakMessage.notifyDailyStreak(author, 100)]})
                MemberController.addRole(bot, author.id, ROLE_100STREAK)
                break;
            case 365:
                ChannelReminder.send({embeds:[DailyStreakMessage.notifyDailyStreak(author, 365)]})
                MemberController.addRole(bot, author.id, ROLE_365STREAK)
                break;
        }
    }
}

module.exports = DailyStreakController
