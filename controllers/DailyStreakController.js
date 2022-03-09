const DailyStreakMessage = require('../views/DailyStreakMessage')
class DailyStreakController {
    static achieveDailyStreak(ChannelReminder,dailyStreak,author){
        switch (dailyStreak) {
            case 7:
                ChannelReminder.send(DailyStreakMessage.notify7DaysStreak(author))
              //  MemberController.addRole(bot, author.id, IdRole7Streak)
                break;
            case 30:
                ChannelReminder.send(DailyStreakMessage.notifyDailyStreak(author, 30))
                //MemberController.addRole(bot, author.id, IdRole30Streak)
                break;
            case 100:
                ChannelReminder.send(DailyStreakMessage.notifyDailyStreak(author, 100))
                //MemberController.addRole(bot, author.id, IdRole100Streak)
                break;
            case 365:
                ChannelReminder.send(DailyStreakMessage.notifyDailyStreak(author, 365))
                //MemberController.addRole(bot, author.id, IdRole365Streak)
                break;
        }
    }
}

module.exports = DailyStreakController
