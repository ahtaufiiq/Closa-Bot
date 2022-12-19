const { PermissionFlagsBits } = require("discord-api-types/v9");
const { GUILD_ID, CHANNEL_NOTIFICATION } = require("../helpers/config");
const FormatString = require("../helpers/formatString");
const supabase = require("../helpers/supabaseClient");

class ChannelController{
    static getChannel(client,channelId){
        return client.guilds.cache.get(GUILD_ID).channels.cache.get(channelId)
    }
    static changeName(client,channelId,name){
        return client.guilds.cache.get(GUILD_ID).channels.cache.get(channelId).setName(name)
    }

    static setVisibilityChannel(client,channelId,setVisible){
        const guild = client.guilds.cache.get(GUILD_ID)
		const channel = ChannelController.getChannel(client,channelId)
		const permissionOverwrites = [
			{
				id:guild.roles.everyone.id,
				[setVisible ? "allow":"deny"]:[PermissionFlagsBits.ViewChannel]
			}
		]
		channel.edit({
			permissionOverwrites 
		})
    }

    static async removeUserFromThread(client,channelId,threadId,userId){
        try {
            const channel = this.getChannel(client,channelId)
            const thread = await this.getThread(channel,threadId)
            const removedUser = await thread.members.remove(userId)
            return removedUser
        } catch (error) {
            return error
        }
    }

    static async addUserToThread(client,channelId,threadId,userId){
        try {
            const channel = this.getChannel(client,channelId)
            const thread = await this.getThread(channel,threadId)
            const addedUser = await thread.members.add(userId)
            return addedUser
        } catch (error) {
            return error
        }
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

    static async scheduleEvent(client,{
        name,
        description,
        scheduledStartTime,
        scheduledEndTime,
        entityType,
        location,
        channel
    }){ 
        return client.guilds.cache.get(GUILD_ID).scheduledEvents.create({
            name,
            description,
            scheduledStartTime,
            scheduledEndTime,
            entityType,
            entityMetadata:{location},
            channel,
            privacyLevel:"GUILD_ONLY",
        })
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