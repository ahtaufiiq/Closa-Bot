const { GUILD_ID, CHANNEL_NOTIFICATION } = require("../helpers/config");
const FormatString = require("../helpers/formatString");
const supabase = require("../helpers/supabaseClient");

class ChannelController{
    static getChannel(client,ChannelId){
        return client.guilds.cache.get(GUILD_ID).channels.cache.get(ChannelId)
    }
    static changeName(client,ChannelId,name){
        return client.guilds.cache.get(GUILD_ID).channels.cache.get(ChannelId).setName(name)
    }

    static async getNotificationThread(client,userId,notificationId){
        const channelNotifications = ChannelController.getChannel(client,CHANNEL_NOTIFICATION)
        if (notificationId) {
            const thread = await ChannelController.getThread(channelNotifications,notificationId)
			return thread
        }else{
            const data = await supabase.from("Users")
            .select("notificationId")
            .eq('id',userId)
            .single()
            if(!data.body) return null
            const thread = await ChannelController.getThread(channelNotifications,data.body.notificationId)
            return thread
        }
        
    }

    static async getThread(channel,threadId){
        return await channel.threads.fetch(threadId);
    }
    static async getMessage(channel,messageId){
        return await channel.messages.fetch(messageId)
    }

    static async createThread(msg,threadName,byAuthor){
        if (byAuthor) {
            const maxLength = 90 - `by ${byAuthor}`.length
            threadName = FormatString.truncateString(threadName,maxLength)+ ` by ${byAuthor}`
        }else{
            threadName = FormatString.truncateString(threadName,90)
        }
        
        return await msg.startThread({
            name: threadName,
        });
    }

    static getEmojiByName(client,emojiName){
        return client.guilds.cache.get(GUILD_ID).emojis.cache.find(emoji => emoji.name === emojiName)
    }
}


module.exports = ChannelController