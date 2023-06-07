const { EmbedBuilder } = require("discord.js")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const { CHANNEL_TESTIMONIAL, ROLE_7STREAK, ROLE_30STREAK, ROLE_100STREAK, ROLE_200STREAK } = require("../helpers/config")
const InfoUser = require("../helpers/InfoUser")

class AchievementBadgeMessage{

    static embedAchievementProgressStreak(streak){
        let color = '#fefefe'
        let titleEmbed = "Thank you for staying consistent on your project!"
        let descriptionEmbed = `Now you have better fire animation on your streak 🔥`
        if(streak === 30){
            color = '#FF3B30'
            descriptionEmbed = `Now you have better fire animation on your streak 🔥`
        }else if(streak === 100) {
            color = '#99F2D2'
            descriptionEmbed = `Now you have skull fire animation on your streak 🔥`
        }else if(streak === 200) {
            color = '#5856ff'
            descriptionEmbed = `Now you have skull fire animation on your streak 🔥`
        }else if(streak === 365) {
            color = '#ffcc00'
            titleEmbed = `Thank you for being an example & a legend to all of us! `
            descriptionEmbed = `Now you have god tier fire animation on your streak 🔥`
        }
        return [
            new EmbedBuilder()
            .setColor(color)
            .setThumbnail(AchievementBadgeMessage.achievementBadgePoint().progressStreak[streak].url)
            .setTitle(titleEmbed)
            .setDescription(descriptionEmbed)
        ]
    }

    static embedAchievementCoworkingStreak(streak){
        let color = '#fefefe'
        let titleEmbed = "Let's stay consistent together!"
        if(streak === 30){
            color = '#FF3B30'
        }else if(streak === 100) {
            color = '#99F2D2'
        }else if(streak === 200) {
            color = '#5856ff'
            titleEmbed = "One more tier to become a true legend, let's go!"
        }else if(streak === 365) {
            color = '#ffcc00'
            titleEmbed = `Thank you for being an example & the legend to all of us! 🫡 👑`
        }
        return [
            new EmbedBuilder()
            .setColor(color)
            .setTitle(titleEmbed)
        ]
    }

    static embedAchievementCoworkingTime(type){
        const data = {
            '1000min':{titleEmbed:`Let's stay consistent & productive!`,color:'#fefefe'},
            '50hr':{titleEmbed:`Let's stay consistent & productive!`,color:`#FF3B30`},
            '100hr':{titleEmbed:`What a milestones! let's stay productive & take more challenge!`,color:`#FF3B30`},
            '300hr':{titleEmbed:`300 hours is a true dedication working on your project! keep it up.`,color:`#99F2D2`},
            '500hr':{titleEmbed:`YOO ARE YOUR SERIOUS??? 500 HOURS IS TRULY OUT OF LEAGUE.`,color:`#5856ff`},
            '1000hr':{titleEmbed:`1000 HOURS OF COWORKING SESSIONS ?! YOU'RE A LEGEND!`,color:`#ffcc00`},
        }
        const {color,titleEmbed} = data[type]
        return [
            new EmbedBuilder()
            .setColor(color)
            .setTitle(titleEmbed)
        ]
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
            progressStreak:{
                7:{point:250,description:"it's equal to 4+ hr of cowork",color: '#FF3B30',url: 'https://media1.giphy.com/media/lp8JndnFvTMndTWYWs/giphy.gif'},
                30:{point:1000,description:"it's equal to 16+ hr of cowork",color: '#FF3B30',url: 'https://emojis.slackmojis.com/emojis/images/1564765165/6075/hot_fire.gif?1564765165'},
                100:{point:3500,description:"it's equal to 58+ hr of cowork",color: '#99F2D2',url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjRhOTg5OTUyMzY5NjU0MTBmMGJhMDZjODg5MjJhMGJiOGE5ZTU4MyZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PXM/xlA7W6oUIyYT5pnj9o/giphy.gif'},
                200:{point:7000,description:"it's equal to 116+ hr of cowork",color: '#5856ff',url: 'https://media3.giphy.com/media/AEHWYyOBSmYRDl7kDc/giphy.gif'},
                365:{point:12000,description:"it's equal to 200+ hr of cowork",color: '#ffcc00',url: 'https://cdn.discordapp.com/attachments/746601801150758962/746682286530887780/708780647157858324.gif'},
            },
            coworkingStreak:{
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

    static claimVibePoint(user,achievement,files,type='progressStreak'){
        const {point,description} = AchievementBadgeMessage.achievementBadgePoint()[type][achievement]
        return {
            content:`Congrats on your milestone! 🔥 ${user}
here's a special reward for you! :coin:

note: **this reward only valid until 23.59 today**`,
            embeds:[
                new EmbedBuilder()
                .setColor("#FEFEFE")
                .setImage("https://media.giphy.com/media/obaVSnvRbtos0l7MBg/giphy.gif")
                .setDescription(description + "\nyou can claim this reward before 23.59 today.")
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

    static howToClaimReward(userId,value){
        return {
            content:`Here's how to claim your reward:
1. Copy the image above & celebrate it on social (e.g. twitter)
2. Don't forget to tag \`\`@joinclosa\`\`
3. Make sure your profile is not private (so we can confirm it)
4. Copy the link of your post & submit the link below

We'll reply to your post & celebrate together! 🥳`,
            components:[MessageComponent.createComponent(
                MessageComponent.addLinkButton('Share on Twitter',"https://twitter.com/intent/tweet"),
                MessageComponent.addButton(`submitTestimonialAchievement_${userId}_${value}`,"Submit link"),
            )]
        }
    }

    static replySubmitLink(){
        return `**nice work!** 🔥
if your submission is valid you'll receive the reward soon.`
    }

    static reviewTestimonial(celebrationLink,reply){
        return `${reply}
↓ 
${celebrationLink}`
    }

    static postCelebrationUser(userId,celebrationLink,isShowButton=false,value){
        const components = []
        if(isShowButton) {
            components.push(MessageComponent.createComponent(
                MessageComponent.addButton(`postTestimonial_${userId}_${value}`,'Post'),
                MessageComponent.addButton(`customReplyTestimonial_${userId}_${value}`,'Custom Reply',"SECONDARY")
            ))
        }
        return {
            content:`${MessageFormatting.tagUser(userId)} just joined the hype 🔥
Let's celebrate together!
↓ 
${celebrationLink}`,
            components
        }
    }

    static approvedCelebration(userId,type,achievement,totalPoint){
        const {point} = AchievementBadgeMessage.achievementBadgePoint()[type][achievement]
        return {
            content:`Here's your achievement reward ${MessageFormatting.tagUser(userId)}, once again congrats! 🔥

Thank you for spreading the words about closa as well :love_letter::sparkles:
It helps us grow the community & supported the team.`,
            embeds:[
                new EmbedBuilder()
                .setColor("#FEFEFE")
                .setImage("https://media.giphy.com/media/obaVSnvRbtos0l7MBg/giphy.gif")
                .setDescription(`Total **${totalPoint}** (+${point}) :coin:`)
                .setAuthor({name:`You just earned +${point} points`.toUpperCase(),iconURL:"https://media.giphy.com/media/QZJ8UcjU5VfFwCIkUN/giphy.gif"})
            ],
            components:[MessageComponent.createComponent(
                MessageComponent.addLinkButton('Learn more','https://closa.notion.site/Vibe-Points-d969f1a3735447b5b9e5b3c67bbb02d2')
            )]
        }
    }
}

module.exports = AchievementBadgeMessage