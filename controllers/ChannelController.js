const { GUILD_ID } = require("../helpers/config");
const FormatString = require("../helpers/formatString");

class ChannelController{
    static getChannel(client,ChannelId){
        return client.guilds.cache.get(GUILD_ID).channels.cache.get(ChannelId)
    }

    static async getThread(channel,threadId){
        return await channel.threads.fetch(threadId);
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

    static getStringChannel(channelId){
        return `<#${channelId}>`
    }
}


module.exports = ChannelController