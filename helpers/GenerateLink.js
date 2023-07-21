const DiscordWebhook = require("./DiscordWebhook")

class GenerateLink {
    static addToCalendar(title,description,location,startDate,endDate) {
        try {
            const startTime = startDate.toISOString().replace(/-|:|\.\d\d\d/g,"")
            const endTime = endDate ? endDate.toISOString().replace(/-|:|\.\d\d\d/g,"") : startTime
            return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}&dates=${startTime}%2F${endTime}`
            //https://www.labnol.org/calendar/
        } catch (error) {
            DiscordWebhook.sendError(error,`${startDate} ${endDate}`)
            return null            
        }
    }
}

module.exports = GenerateLink