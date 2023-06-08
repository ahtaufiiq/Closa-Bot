const { AttachmentBuilder } = require("discord.js")
const GenerateImage = require("../helpers/GenerateImage")
const { ROLE_7STREAK, ROLE_30STREAK, ROLE_100STREAK, ROLE_200STREAK, ROLE_365STREAK, CHANNEL_ACHIEVEMENTS, ROLE_7COWORK, ROLE_30COWORK, ROLE_100COWORK, ROLE_200COWORK, ROLE_365COWORK, ROLE_1000MIN, ROLE_50HOURS, ROLE_100HOURS, ROLE_300HOURS, ROLE_500HOURS } = require("../helpers/config")
const DailyStreakMessage = require("../views/DailyStreakMessage")
const MemberController = require("./MemberController")
const ChannelController = require("./ChannelController")
const PartyController = require("./PartyController")
const AchievementBadgeMessage = require("../views/AchievementBadgeMessage")
const PartyMessage = require("../views/PartyMessage")

class AchievementBadgeController{
    static async achieveProgressStreak(client,dailyStreak,author,isFirstTime=false){
		const buffer = await GenerateImage.streakBadge(dailyStreak,author)
		const files = [new AttachmentBuilder(buffer,{name:`streak_badge_${author.username}.png`})]
		
        setTimeout(async () => {
            PartyController.shareToPartyRoom(client,author.id,PartyMessage.shareAchievementBadge(author,dailyStreak,files))
    
            ChannelController.sendToNotification(
                client,
                AchievementBadgeMessage.claimVibePoint(author,dailyStreak,files,'progressStreak'),
                author.id
            )
        }, 1000 * 15);

        if(isFirstTime) {
            const roles = {
                7:ROLE_7STREAK,
                30:ROLE_30STREAK,
                100:ROLE_100STREAK,
                200:ROLE_200STREAK,
                365:ROLE_365STREAK
            }
            const roleId = roles[dailyStreak]
            if(roleId){
                MemberController.addRole(client,author.id,roleId)
            }
        }
    }

    static async achieveCoworkingStreak(client,streak,totalSession,totalTime,user,partner,isFirstTime=false){
        const buffer = await GenerateImage.coworkingStreakBadge(streak,totalSession,totalTime,user,partner)
		const files = [new AttachmentBuilder(buffer,{name:`coworking_streak_${user.username}&${partner.username}.png`})]
		
        setTimeout(async () => {
            ChannelController.sendToNotification(
                client,
                AchievementBadgeMessage.claimVibePoint(user,streak,files,'coworkingStreak',partner.username),
                user.id
            )
            ChannelController.sendToNotification(
                client,
                AchievementBadgeMessage.claimVibePoint(partner,streak,files,'coworkingStreak',user.username),
                partner.id
            )
        }, 1000 * 15);
        if(isFirstTime) {
            const roles = {
                7:ROLE_7COWORK,
                30:ROLE_30COWORK,
                100:ROLE_100COWORK,
                200:ROLE_200COWORK,
                365:ROLE_365COWORK
            }
            const newRole = roles[streak]
            if(newRole){
                MemberController.addRole(client,user.id,newRole)
            }
        }
    }

    static async achieveCoworkingTimeBadge(client,totalSession,badgeType,user){
        const buffer = await GenerateImage.coworkingTimeBadge(user,totalSession,badgeType)
		const files = [new AttachmentBuilder(buffer,{name:`coworking_time_${user.username}.png`})]
		
        setTimeout(async () => {
            ChannelController.sendToNotification(
                client,
                AchievementBadgeMessage.claimVibePoint(user,badgeType,files,'coworkingTime'),
                user.id
            )
        }, 1000 * 15);

        const roles = {
            "1000min":{new:ROLE_1000MIN},
            "50hr":{new:ROLE_50HOURS,old:ROLE_1000MIN},
            "100hr":{new:ROLE_100HOURS,old:ROLE_50HOURS},
            "300hr":{new:ROLE_300HOURS,old:ROLE_100HOURS},
            "500hr":{new:ROLE_500HOURS,old:ROLE_300HOURS},
            "1000hr":{new:ROLE_365COWORK,old:ROLE_500HOURS}
        }
        const newRole = roles[badgeType].new
        const oldRole = roles[badgeType].old
        if(newRole){
            MemberController.addRole(client,user.id,newRole)
        }
        if(oldRole){
            MemberController.removeRole(client,user.id,oldRole)
        }
    }

}

module.exports = AchievementBadgeController