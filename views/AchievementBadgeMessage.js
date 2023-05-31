const { EmbedBuilder } = require("discord.js")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const { CHANNEL_TESTIMONIAL, ROLE_7STREAK, ROLE_30STREAK, ROLE_100STREAK, ROLE_200STREAK } = require("../helpers/config")
const InfoUser = require("../helpers/InfoUser")

class AchievementBadgeMessage{

    static progressStreak(userId,streak,files){
        let color = '#fefefe'
        let content = `Welcome to **${MessageFormatting.tagRole(ROLE_7STREAK)}** ${MessageFormatting.tagUser(userId)} 🥳`
        let titleEmbed = "Thank you for staying consistent on your project!"
        let descriptionEmbed = `Now you have better fire animation on your streak 🔥
Check your notification & claim your reward for 250 🪙`
        if(streak === 30){
            color = '#FF3B30'
            content = `Welcome to **${MessageFormatting.tagRole(ROLE_30STREAK)}** ${MessageFormatting.tagUser(userId)} 🥳🎉`
            descriptionEmbed = `Now you have better fire animation on your streak 🔥
Check your notification & claim your reward for 1000 🪙`
        }else if(streak === 100) {
            color = '#99F2D2'
            content = `Welcome to **${MessageFormatting.tagRole(ROLE_100STREAK)}** ${MessageFormatting.tagUser(userId)} 🔥🔥🔥`
            descriptionEmbed = `Now you have skull fire animation on your streak 🔥
Check your notification & claim your reward for 3500 🪙`
        }else if(streak === 200) {
            color = '#5856ff'
            content = `Welcome to **${MessageFormatting.tagRole(ROLE_200STREAK)}** ${MessageFormatting.tagUser(userId)} 🔥🔥🔥🔥🔥🔥`
            descriptionEmbed = `Now you have skull fire animation on your streak 🔥
Check your notification & claim your reward for 7000 🪙`
        }else if(streak === 365) {
            color = '#ffcc00'
            content = `@everyone **LET'S GIVE AN HONOR TO ${MessageFormatting.tagUser(userId)} FOR :crown: 365 DAY STREAK MILESTONE**  🔥 🔥 🔥 `
            titleEmbed = `Thank you for being an example & a legend to all of us! `
            descriptionEmbed = `Now you have god tier fire animation on your streak 🔥
check your notification & claim your reward for 12000 🪙`
        }
        return {
			content,
			embeds:[new EmbedBuilder()
				.setColor(color)
                .setThumbnail(AchievementBadgeMessage.achievementBadgePoint().streak[streak].url)
				.setTitle(titleEmbed)
				.setDescription(descriptionEmbed)],
			files
		}
    }

    static coworkingStreak(userId,partnerId,streak,files){
        let color = '#fefefe'
        let content = `Congrats for both of you ${MessageFormatting.tagUser(userId)} & ${MessageFormatting.tagUser(partnerId)} for **${streak} day coworking streak!** 🥳`
        let titleEmbed = "Let's stay consistent together!"
        let descriptionEmbed = `check your notification & claim your reward for ${AchievementBadgeMessage.achievementBadgePoint().streak[streak].point} 🪙`
        if(streak === 30){
            color = '#FF3B30'
        }else if(streak === 100) {
            color = '#99F2D2'
        }else if(streak === 200) {
            color = '#5856ff'
            titleEmbed = "One more tier to become a true legend, let's go!"
        }else if(streak === 365) {
            color = '#ffcc00'
            content = `Yo @everyone let's give an honor to our new duo legend ${MessageFormatting.tagUser(userId)} & ${MessageFormatting.tagUser(partnerId)} for **365 day coworking streak!** 👑👑`
            titleEmbed = `Thank you for being an example & the legend to all of us! 🫡 👑`
        }
        return {
			content,
			embeds:[new EmbedBuilder()
				.setColor(color)
				.setTitle(titleEmbed)
				.setDescription(descriptionEmbed)],
			files
		}
    }

    static coworkingTime(userId,type,files){
        const data = {
            '1000min':{content:`Congrats on your first **1000 minutes** of coworking sessions ${MessageFormatting.tagUser(userId)} 🥳`,titleEmbed:`Let's stay consistent & productive!`,descriptionEmbed:`check your notification & claim your reward for 300 🪙`,color:'#fefefe'},
            '50hr':{content:`Congrats on your **50 hours** of coworking sessions ${MessageFormatting.tagUser(userId)} 🥳🎉`,titleEmbed:`Let's stay consistent & productive!`,descriptionEmbed:`check your notification & claim your reward for 1000 🪙`,color:`#FF3B30`},
            '100hr':{content:`Congrats on your **100 hours** of coworking sessions ${MessageFormatting.tagUser(userId)} 🥳🎉`,titleEmbed:`What a milestones! let's stay productive & take more challenge!`,descriptionEmbed:`check your notification & claim your reward for 2000 🪙`,color:`#FF3B30`},
            '300hr':{content:`Congrats on your **300 hours** of coworking sessions ${MessageFormatting.tagUser(userId)} 🥳🎉`,titleEmbed:`300 hours is a true dedication working on your project! keep it up.`,descriptionEmbed:`check your notification & claim your reward for 7000 🪙`,color:`#99F2D2`},
            '500hr':{content:`Congrats on your **500 hours** of coworking sessions ${MessageFormatting.tagUser(userId)} 🥳🎉`,titleEmbed:`YOO ARE YOUR SERIOUS??? 500 HOURS IS TRULY OUT OF LEAGUE.`,descriptionEmbed:`please check your notification & claim your reward for 10000 🪙\nyour deserve it!`,color:`#5856ff`},
            '1000hr':{content:`@everyone **let's welcome our productivity & the true coworking legend** ${MessageFormatting.tagUser(userId)}`,titleEmbed:`1000 HOURS OF COWORKING SESSIONS ?! YOU'RE A LEGEND!`,descriptionEmbed:`please check your notification & claim your 15000 🪙`,color:`#ffcc00`},
        }
        console.log(type);
        const {content,color,titleEmbed,descriptionEmbed} = data[type]
        return {
			content,
			embeds:[new EmbedBuilder()
				.setColor(color)
				.setTitle(titleEmbed)
				.setDescription(descriptionEmbed)],
			files
		}
    }

    static typeCoworkingTime = {
        '1000min':'1000min',
        '50hr':'50hr',
        '100hr':'100hr',
        '300hr':'300hr',
        '500hr':'500hr',
        '1000hr':'1000hr',
    }

    static achievementBadgePoint(){
        return {
            streak:{
                7:{point:250,description:"it's equal to 4+ hr of cowork",color: '#FF3B30',url: 'https://media1.giphy.com/media/lp8JndnFvTMndTWYWs/giphy.gif'},
                30:{point:1000,description:"it's equal to 16+ hr of cowork",color: '#FF3B30',url: 'https://emojis.slackmojis.com/emojis/images/1564765165/6075/hot_fire.gif?1564765165'},
                100:{point:3500,description:"it's equal to 58+ hr of cowork",color: '#99F2D2',url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjRhOTg5OTUyMzY5NjU0MTBmMGJhMDZjODg5MjJhMGJiOGE5ZTU4MyZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PXM/xlA7W6oUIyYT5pnj9o/giphy.gif'},
                200:{point:7000,description:"it's equal to 116+ hr of cowork",color: '#5856ff',url: 'https://media3.giphy.com/media/AEHWYyOBSmYRDl7kDc/giphy.gif'},
                365:{point:12000,description:"it's equal to 200+ hr of cowork",color: '#ffcc00',url: 'https://cdn.discordapp.com/attachments/746601801150758962/746682286530887780/708780647157858324.gif'},
            },
            coworkingTime:{
                '1000min':{point:300,description:"it's equal to 8+ hr of cowork"},
                '50hr':{point:1000,description:"it's equal to 25+ hr of cowork"},
                '100hr':{point:2000,description:"it's equal to 30+ hr of cowork"},
                '300hr':{point:7000,description:"it's equal to 116+ hr of cowork"},
                '500hr':{point:10000,description:"it's equal to 166+ hr of cowork"},
                '1000hr':{point:15000,description:"it's equal to 250+ hr of cowork"},
            }
        }
    }

    static claimVibePoint(user,achievement,files,type='streak'){
        const {point,description} = AchievementBadgeMessage.achievementBadgePoint()[type][achievement]
        return {
            content:`Congrats on your milestone! 🔥 ${user}

let's celebrate together & join the ${MessageFormatting.tagChannel(CHANNEL_TESTIMONIAL)}
*this reward valid until 23.59 today*`,
            embeds:[
                new EmbedBuilder()
                .setColor("#FEFEFE")
                .setImage("https://media.giphy.com/media/obaVSnvRbtos0l7MBg/giphy.gif")
                .setDescription(description)
                .setAuthor({name:`CLAIM ${point} POINTS`.toUpperCase(),iconURL:"https://media.giphy.com/media/QZJ8UcjU5VfFwCIkUN/giphy.gif"})
                .setFooter({text:`${user.username}`, iconURL:InfoUser.getAvatar(user)})
            ],
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`claimReward_${user.id}_${type}-${achievement}`,"Claim Reward"),
                MessageComponent.addLinkButton('Learn more','https://closa.notion.site/Vibe-Points-d969f1a3735447b5b9e5b3c67bbb02d2')
            )],
            files
        }
    }

    static howToClaimReward(userId){
        return {
            content:`Here's how to claim your reward:
1. Copy the image above & share it on social (e.g. twitter)
2. Don't forget to tag \`\`@joinclosa\`\`
3. Make sure your profile is not private (so we can confirm it)
4. Copy the link of your post & submit the link below

We'll reply to your post & celebrate together! 🥳`,
            components:[MessageComponent.createComponent(
                MessageComponent.addLinkButton('Share on Twitter',"https://twitter.com/intent/tweet"),
                MessageComponent.addButton(`submitTestimonialAchievement_${userId}`,"Submit link"),
            )]
        }
    }

    static replySubmitLink(){
        return `**nice work!** 🔥
if your submission is valid you'll receive the reward soon.`
    }
}

module.exports = AchievementBadgeMessage