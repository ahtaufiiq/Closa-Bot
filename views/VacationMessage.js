const { EmbedBuilder } = require("discord.js")
const { CHANNEL_TODO, CHANNEL_HIGHLIGHT, ROLE_365STREAK, ROLE_100STREAK, ROLE_30STREAK, ROLE_7STREAK } = require("../helpers/config")
const getRandomValue = require("../helpers/getRandomValue")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const Time = require("../helpers/time")

class VacationMessage {

    static onVacationMode(userId,attachment,vacationLeft=0,isBuyOneVacation=false){
        let textDayLeft = 'last day'
        if(isBuyOneVacation) textDayLeft = 'rest day'
        else if(vacationLeft > 0) {
            textDayLeft = `${vacationLeft} ${vacationLeft>1 ? "days":"day"} left`
        }
        
        return {
            content:`${MessageFormatting.tagUser(userId)} on vacation mode 🏖
\`\`${textDayLeft}\`\``,
            files:[
                attachment
            ]
        }
    }

    static initShopVacation(totalTicket=0){
        return {
            embeds:[
                new EmbedBuilder()
                .setColor("#a9a735")
                .setTitle("🏖 Vacation Ticket ")
                .setDescription(`Buy vacation ticket to keep your streak without posting progress

—————————————

**500 points /each**

**${totalTicket} ticket sold**`)
                .setImage("https://media.giphy.com/media/3ohzAttVwOSM1vCdK8/giphy.gif")
            ],
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton('shopVacation','Buy Ticket','🎫'),
                MessageComponent.addLinkEmojiButton("Learn more","https://closa.notion.site/Vacation-Mode-1cb1ff1110ef40a39cc26841061aa6fe",'💡')
            )]
        }
    }

    static declineBuyVacationTicket(){
        return `Alright! 
have a productive day!

\`\`Let's set your highlight of the day\`\` → ${MessageFormatting.tagChannel(CHANNEL_HIGHLIGHT)}`
    }

    static successBuyOneVacationTicket(userId,pointLeft,todayDate,tomorrowDate){
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)}, you’ve successfully purchased 1-day vacation ticket 🎫
\`\`You don't need to post any progress for today.\`\``,
            embeds:[new EmbedBuilder()
                .setColor("#00B264")
                .addFields({
                    name:"Ticket Details",
                    value:`Applied for: Today (${todayDate}).
Please come back tomorrow sharing your progress. (${tomorrowDate})

Points left: **${pointLeft} :coin:**`
                })
                .setImage('https://media.giphy.com/media/3ohuP6Vh0Ddo31VFks/giphy.gif')
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

    static showListVacationTicket(userId,userPoint,maxVacationTicket=1){
        const optionsTicket = [1,2,3,5,7]
        const optionsMenu = optionsTicket.map(option=>{
            const isEligible = maxVacationTicket >= option
            return {
                label: `${isEligible ? "🎫":"🔒"} ${option} day for ${option * 500} Points ${isEligible ? "":"(locked)"}`,
                value: `${option}${isEligible ? "":"-locked"}`
            }
        })
        return {
            content:`**Select how many vacation days you would like to take ${MessageFormatting.tagUser(userId)}?** 🏖

\`\`Your points:\`\` **${userPoint} :coin:**`,
            components:[MessageComponent.createComponent(
                MessageComponent.addMenu(
                    'buyVacationTicket',
                    "— Select number of vacation day —",
                    optionsMenu
                )
            )]
        }
    }

    static cannotClickLockedButton(idBadgeStreak){
        return {
            content:`**Only member with ${MessageFormatting.tagRole(idBadgeStreak)} badge above eligible to buy this perks.**`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton('continueBuyTicket',"Continue"),
                MessageComponent.addButton('cancelBuyTicket',"Cancel","SECONDARY"),
                MessageComponent.addLinkButton("Learn about Streak badge ↗","https://closa.notion.site/Daily-Streak-bc4f641f0366400f8c2b34af2d494a20")
            )]
        }
    }

    static cancelTransaction(){
        return "Transaction has been canceled."
    }

    static confirmationBuyVacationTicket(userId,totalTicket,totalPoint){
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)}, are you sure to buy ${totalTicket}-day vacation ticket for ${totalPoint} points?`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`confirmBuyTicket_${userId}_${totalTicket}`,"Yes"),
                MessageComponent.addButton('cancelBuyTicket',"Nevermind","SECONDARY")
            )]
        }
    }

    static confirmationBuyOneVacationTicket(userId){
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)}, are you sure to buy 1 vacation ticket for 500 points?`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`confirmBuyOneVacationTicket_${userId}`,"Yes"),
                MessageComponent.addButton('cancelBuyTicket',"Nevermind","SECONDARY")
            )]
        }
    }

    static confirmationWhenToUseTicket(userId,totalTicket){
        return {
            content:"**Please confirm when do you want to use the ticket?**",
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`useTicketToday_${userId}_${totalTicket}`,"Today"),
                MessageComponent.addButton(`useTicketTomorrow_${userId}_${totalTicket}`,"Tomorrow","SECONDARY"),
                MessageComponent.addButton(`useTicketCustomDate_${userId}_${totalTicket}`,"Set custom date","SECONDARY")
            )]
        }
    }

    static pickAnotherDate(userId,totalTicket,date){
        return {
            content:`**🗓 Please pick another date, you've already have vacation ticket for ${date}**`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`useTicketCustomDate_${userId}_${totalTicket}`,"Set Date")
            )]
        }
    }

    static vacationModeOn(tagUsers,urlVacationGif){
        
        return {
            content:`${tagUsers} vacation mode: on`,
            embeds:[
                new EmbedBuilder()
                .setColor("#00B264")
                .setImage(urlVacationGif)
            ]
        }
    }

    static successBuyVacationTicket(userId,totalTicket,pointLeft,startDate,endDate){
        const todayDate = Time.getFormattedDate(Time.getDate())
        const tomorrowDate = Time.getFormattedDate(Time.getNextDate(1))

        const startVacation = startDate === todayDate ? "Today" : startDate === tomorrowDate ? "Tomorrow" : startDate

        return {
            content:`Hi ${MessageFormatting.tagUser(userId)}, you’ve successfully purchased ${totalTicket}-day vacation ticket 🎫`,
            embeds:[new EmbedBuilder()
                .setColor("#00B264")
                .addFields({
                    name:"Ticket Details",
                    value:`Start: ${startVacation}
Until: ${endDate}
Please back making progress at ${endDate}

Points left: **${pointLeft} :coin:**`
                })
                .setImage('https://media.giphy.com/media/3ohuP6Vh0Ddo31VFks/giphy.gif')
            ]
        }
    }

    static vacationDayEnded(userId){
        const endedVacationGif = [
            "https://media.giphy.com/media/EbRPam1A4jEWkUokL8/giphy.gif",
            "https://media.giphy.com/media/H4kIxdgCcPtF7EbnnR/giphy.gif",
            "https://media.giphy.com/media/rbSNfQdstlYd6DdgcH/giphy.gif",
            "https://media.giphy.com/media/l1J9urAfGd3grKV6E/giphy.gif",
            "https://media.giphy.com/media/3o7aDgf134NzaaHI8o/giphy-downsized-large.gif",
        ]
        const randomGif = getRandomValue(endedVacationGif)
        return {
            content:`Hi ${MessageFormatting.tagUser(userId)}, I hope you are having enough vacation day!
It’s time to set your ${MessageFormatting.tagChannel(CHANNEL_HIGHLIGHT)} and make your progress today.`,
            embeds: [
                new EmbedBuilder()
                .setColor("#00B264")
                .setImage(randomGif)
            ]
        }
    }
}

module.exports = VacationMessage