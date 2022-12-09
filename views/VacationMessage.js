const { MessageEmbed } = require("discord.js")
const { CHANNEL_TODO, CHANNEL_HIGHLIGHT, ROLE_365STREAK, ROLE_100STREAK, ROLE_30STREAK, ROLE_7STREAK } = require("../helpers/config")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")
const Time = require("../helpers/time")

class VacationMessage {

    static initShopVacation(totalTicket=0){
        return {
            content: `**Buy vacation ticket 🏖️**
Ticket sold: ${totalTicket} 🎫

\`\`500 points per ticket\`\``,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton('shopVacation','Buy')
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
            embeds:[new MessageEmbed()
                .setColor("#00B264")
                .addField("Ticket Details",`Applied for: Today (${todayDate}).
Please come back tomorrow sharing your progress. (${tomorrowDate})

Your points: **${pointLeft} :coin:**`)
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

\`\`Perks:\`\`
• ${MessageFormatting.tagRole(ROLE_365STREAK)} — elgible for 7 days.
• ${MessageFormatting.tagRole(ROLE_100STREAK)} – eligble for 5 days.
• ${MessageFormatting.tagRole(ROLE_30STREAK)} – elgible for 3 days
• ${MessageFormatting.tagRole(ROLE_7STREAK)} – eligble for 2 days
• No badge – eligible for 1 day

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

    static successBuyVacationTicket(userId,totalTicket,pointLeft,startDate,endDate){
        const todayDate = Time.getFormattedDate(Time.getDate())
        const tomorrowDate = Time.getFormattedDate(Time.getNextDate(1))

        const startVacation = startDate === todayDate ? "Today" : startDate === tomorrowDate ? "Tomorrow" : startDate

        return {
            content:`Hi ${MessageFormatting.tagUser(userId)}, you’ve successfully purchased ${totalTicket}-day vacation ticket 🎫`,
            embeds:[new MessageEmbed()
                .setColor("#00B264")
                .addField("Ticket Details",`Start: ${startVacation}
Until: ${endDate}
Please back making progress at (${endDate})

Your points: **${pointLeft} :coin:**`)
            ]
        }
    }

    static vacationDayEnded(userId){
        return `Hi ${MessageFormatting.tagUser(userId)}, I hope you are having enough vacation day!
It’s time to set your ${MessageFormatting.tagChannel(CHANNEL_HIGHLIGHT)} and make your progress today.`
    }
}

module.exports = VacationMessage