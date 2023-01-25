const { MessageEmbed } = require("discord.js")
const { CHANNEL_HIGHLIGHT } = require("../helpers/config")
const getRandomValue = require("../helpers/getRandomValue")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const Time = require("../helpers/time")

class SickDayMessage {
    static optionHowManySickDay(userId,userPoint){
        return {
            content:`**Select how many sick days you would like to take ${MessageFormatting.tagUser(userId)}?** :pill:
\`\`Your points:\`\` **${userPoint} :coin:**

\`\`\`sick day cost you 150 points/day\`\`\``,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton('totalSickDay_null_1','Today'),
                MessageComponent.addButton('totalSickDay_null_2','2 Days',"SECONDARY"),
                MessageComponent.addButton('totalSickDay_null_3','3 Days',"SECONDARY"),
                MessageComponent.addButton('totalSickDay_null_5','5 Days',"SECONDARY"),
                MessageComponent.addButton('totalSickDay_null_7','7 Days',"SECONDARY"),
            )]
        }
    }
    
    static confirmationBuySickDay(userId,totalDay,totalPoint){
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)}, are you sure to take ${totalDay} sick day for ${totalPoint} points?`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`buySickTicket_${userId}_${totalDay}`,'Yes'),
                MessageComponent.addButton(`cancelBuyTicket`,'Nevermind',"SECONDARY"),
            )]
        }
    }

    static successBuySickDayTicket(userId,pointLeft,startDate,endDate){
        const todayDate = Time.getFormattedDate(Time.getDate())
        const tomorrowDate = Time.getFormattedDate(Time.getNextDate(1))
        const startSickTicket = startDate === todayDate ? "Today" : startDate === tomorrowDate ? "Tomorrow" : startDate

        return {
            content:`Hi ${MessageFormatting.tagUser(userId)}, i hope you have a decent rest ✨`,
            embeds:[new MessageEmbed()
                .setColor("#00B264")
                .addField("Receipt Details",`Start: ${startSickTicket}
Until: ${endDate}
Please back making progress at ${endDate}

Points left: **${pointLeft} :coin:**`)
                .setImage('https://media.giphy.com/media/S6IYqxt0ZosZXl82O8/giphy.gif')
            ]
        }
    }

    static cancelTransaction(){
        return "Transaction has been canceled."
    }

    static sickDayEnded(userId){
        const endedSickDayGif = [
            "https://media.giphy.com/media/EbRPam1A4jEWkUokL8/giphy.gif",
            "https://media.giphy.com/media/H4kIxdgCcPtF7EbnnR/giphy.gif",
            "https://media.giphy.com/media/rbSNfQdstlYd6DdgcH/giphy.gif",
            "https://media.giphy.com/media/l1J9urAfGd3grKV6E/giphy.gif",
            "https://media.giphy.com/media/3o7aDgf134NzaaHI8o/giphy-downsized-large.gif",
        ]
        const randomGif = getRandomValue(endedSickDayGif)
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)}, I hope you are having enough rest day!
It’s time to set your ${MessageFormatting.tagChannel(CHANNEL_HIGHLIGHT)} and make your progress today.`,
            embeds: [
                new MessageEmbed()
                .setColor("#00B264")
                .setImage(randomGif)
            ]
        }
    }

    static shareProgress(tagUsers,urlSickGif){
        return {
            content:`${tagUsers} on sick leave 🤢`,
            embeds:[
                new MessageEmbed()
                .setColor("#00B264")
                .setImage(urlSickGif)
            ]
        }
    }

    static shareStreak(userId,attachment,sickLeft=0,isBuyOneSickTicket=false){
        let textDayLeft = 'last day'
        if(isBuyOneSickTicket) textDayLeft = 'rest day'
        else if(sickLeft > 0) {
            textDayLeft = `${sickLeft} ${sickLeft>1 ? "days":"day"} left`
        }
        
        return {
            content:`${MessageFormatting.tagUser(userId)} on sick leave 🤢
\`\`${textDayLeft}\`\``,
            files:[
                attachment
            ]
        }
    }

    static notHaveEnoughPoint(userId){
        return {
            content:`**Hi ${MessageFormatting.tagUser(userId)}, you don't have enough vibe points.**
To get vibe points you can contribute to community by doing certain activities.`,
            components:[MessageComponent.createComponent(
                MessageComponent.addLinkButton("Learn more ↗️","https://closa.notion.site/Vibe-Points-d969f1a3735447b5b9e5b3c67bbb02d2")
            )]
        }
    }

    static alreadyHaveSickTicket(date){
        return {
            content:`**You've already have sick ticket for ${date}**`
        }
    }
}

module.exports = SickDayMessage