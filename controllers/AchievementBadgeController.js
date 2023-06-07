const { AttachmentBuilder } = require("discord.js")
const GenerateImage = require("../helpers/GenerateImage")
const { ROLE_7STREAK, ROLE_30STREAK, ROLE_100STREAK, ROLE_200STREAK, ROLE_365STREAK, CHANNEL_ACHIEVEMENTS } = require("../helpers/config")
const DailyStreakMessage = require("../views/DailyStreakMessage")
const MemberController = require("./MemberController")
const ChannelController = require("./ChannelController")
const PartyController = require("./PartyController")
const AchievementBadgeMessage = require("../views/AchievementBadgeMessage")
const PartyMessage = require("../views/PartyMessage")

class AchievementBadgeController{
    static async achieveProgressStreak(client,dailyStreak,author){

		const buffer = await GenerateImage.streakBadge(dailyStreak,author)
		const files = [new AttachmentBuilder(buffer,{name:`streak_badge_${author.username}.png`})]
		
        setTimeout(async () => {
            PartyController.shareToPartyRoom(client,author.id,PartyMessage.shareAchievementBadge(author,dailyStreak,files))
    
            ChannelController.sendToNotification(
                client,
                AchievementBadgeMessage.claimVibePoint(author,dailyStreak,files,'streak'),
                author.id
            )
        }, 1000 * 15);
    }

    static async achieveCoworkingStreak(client,streak,totalSession,totalTime,user,partner){
        const buffer = await GenerateImage.coworkingStreakBadge(streak,totalSession,totalTime,user,partner)
		const files = [new AttachmentBuilder(buffer,{name:`coworking_streak_${user.username}&${partner.username}.png`})]
		
        setTimeout(async () => {
            ChannelController.sendToNotification(
                client,
                AchievementBadgeMessage.claimVibePoint(user,streak,files,'streak'),
                user.id
            )
            ChannelController.sendToNotification(
                client,
                AchievementBadgeMessage.claimVibePoint(partner,streak,files,'streak'),
                partner.id
            )
        }, 1000 * 15);
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
    }

}

module.exports = AchievementBadgeController