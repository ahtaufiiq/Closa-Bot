const { MessageActionRow, MessageButton} = require("discord.js")
class VacationTicketMessage {
    static remindAboutToLoseStreak(userId){
        return { 
            content:`Hi <@${userId}> this is a final call. You are about to lose your #🔥streak 🙏

To keep your streak you can:
• Start tiny and post your progress today.
• or you can buy a vacation ticket.`, 
            components: [VacationTicketMessage.componentVacationTicket(userId)] 
        }
    }

    static componentVacationTicket(userId){
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`buyVacationTicket_${userId}`)
                    .setLabel("🏖 Buy vacation ticket")
                    .setStyle("SUCCESS"),
                    new MessageButton()
                    .setLabel("Learn more ↗")
                    .setURL("https://closa.notion.site/Vacation-Ticket-1cb1ff1110ef40a39cc26841061aa6fe")
                    .setStyle("LINK")
            )
    }
}

module.exports = VacationTicketMessage