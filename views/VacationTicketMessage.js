const MessageComponent = require("../helpers/MessageComponent")
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
        return MessageComponent.createComponent(
            MessageComponent.addButton(
                `buyVacationTicket_${userId}`,
                "🏖 Buy vacation ticket",
                "SUCCESS"
            ),
            MessageComponent.addLinkButton(
                "Learn more ↗",
                "https://closa.notion.site/Vacation-Ticket-1cb1ff1110ef40a39cc26841061aa6fe"
            )
        )
    }
}

module.exports = VacationTicketMessage