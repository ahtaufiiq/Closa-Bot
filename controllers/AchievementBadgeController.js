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
		
		const channelAchievement = ChannelController.getChannel(client,CHANNEL_ACHIEVEMENTS)
		const msg = await channelAchievement.send(AchievementBadgeMessage.progressStreak(author.id,dailyStreak,files))
		ChannelController.createThread(msg,`Congrats ${author.username}!`)

		PartyController.shareToPartyRoom(client,author.id,PartyMessage.shareAchievementBadge(author,dailyStreak,files))

        // send to notification to claim reward
        ChannelController.sendToNotification(
            client,
            AchievementBadgeMessage.claimVibePoint(author,dailyStreak,files,'streak'),
            author.id
        )
    }

    static async achieveCoworkingStreak(client,streak,totalSession,totalHour,user,partner){
        const buffer = await GenerateImage.coworkingStreakBadge(streak,totalSession,totalHour,user,partner)
		const files = [new AttachmentBuilder(buffer,{name:`coworking_streak_${user.username}&${partner.username}.png`})]
		
		const channelAchievement = ChannelController.getChannel(client,CHANNEL_ACHIEVEMENTS)
		const msg = await channelAchievement.send(AchievementBadgeMessage.coworkingStreak(user.id,partner.id,streak,files))
		ChannelController.createThread(msg,`Congrats ${user.username} & ${partner.username}!`)

        // send to notification to claim reward
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
    }

    static async achieveCoworkingTimeBadge(client,totalSession,badgeType,user){
        const buffer = await GenerateImage.coworkingTimeBadge(user,totalSession,badgeType)
		const files = [new AttachmentBuilder(buffer,{name:`coworking_time_${user.username}.png`})]
		
		const channelAchievement = ChannelController.getChannel(client,CHANNEL_ACHIEVEMENTS)
		const msg = await channelAchievement.send(AchievementBadgeMessage.coworkingTime(user.id,badgeType,files))
		ChannelController.createThread(msg,`Congrats ${user.username}!`)

        // send to notification to claim reward
        ChannelController.sendToNotification(
            client,
            AchievementBadgeMessage.claimVibePoint(user,badgeType,files,'coworkingTime'),
            user.id
        )
    }

}

module.exports = AchievementBadgeController