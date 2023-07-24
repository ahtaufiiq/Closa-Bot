const { WebhookClient } = require("discord.js");

class DiscordWebhook {
    static sendError(error,data='error'){
        const webhookClient = new WebhookClient({ url:"https://discord.com/api/webhooks/953519981629419540/5PQwLXEB-Xxh5nuwOANNRUdddt1UTqsCay-TRRVocN-_lV6mXSoSI7KkZX7xiC8PDh1E" });
        webhookClient.send(`${data}: ${error}`)
    }
}

module.exports = DiscordWebhook