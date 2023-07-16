const { WebhookClient, GuildScheduledEventPrivacyLevel, PermissionFlagsBits, ChannelType, ThreadAutoArchiveDuration } = require("discord.js");
const { GUILD_ID, CHANNEL_NOTIFICATION, ROLE_MEMBER, ROLE_NEW_MEMBER, CHANNEL_GOALS, CHANNEL_6WIC } = require("../helpers/config");
const FormatString = require("../helpers/formatString");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const MessageFormatting = require("../helpers/MessageFormatting");

class ChannelController{
    
    static getChannel(client,channelId){
        return client.guilds.cache.get(GUILD_ID).channels.cache.get(channelId)
    }
    static changeName(client,channelId,name){
        return client.guilds.cache.get(GUILD_ID).channels.cache.get(channelId).setName(name)
    }

    static async updateChannelVisibilityForMember(client,channelId,setVisible){
		const channel = ChannelController.getChannel(client,channelId)
        const guild = client.guilds.cache.get(GUILD_ID)
		const permissionOverwrites = [
			{
				id:ROLE_MEMBER,
				[setVisible ? "allow":"deny"]:[PermissionFlagsBits.ViewChannel]
			},
			{
				id:ROLE_NEW_MEMBER,
				[setVisible ? "allow":"deny"]:[PermissionFlagsBits.ViewChannel]
			},
			{
				id:guild.roles.everyone.id,
				["deny"]:[PermissionFlagsBits.ViewChannel]
			},
		]
		return await channel.edit({
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
            if(!data.body || !data.body.notificationId) return null
            const thread = await ChannelController.getThread(channelNotifications,data.body.notificationId)
            return thread
        }
    }

    static async getGoalThread(client,goalId){
        const data = await supabase.from('Goals')
            .select('id,project,goalType')
            .eq('id',goalId)
            .single()
        if(!data.body) return null
        const {goalType,project,id} = data.body
        const channelGoals = ChannelController.getChannel(client,goalType === 'default' ? CHANNEL_GOALS : CHANNEL_6WIC)
        let thread = await ChannelController.getThread(channelGoals,id)
        if(!thread){
            const msg = await ChannelController.getMessage(channelGoals,goalId)
            await ChannelController.createThread(msg,project)
            thread = await ChannelController.getThread(channelGoals,id)
            ChannelController.sendError('goal thread is null',MessageFormatting.linkToMessage(channelGoals.id,id))
        }
        return thread
    }

    static async getThread(channel,threadId){
        try {
            return await channel.threads.fetch(threadId);
        } catch (error) {
            ChannelController.sendError(error,MessageFormatting.linkToInsideThread(threadId))
            return null
        }
    }
    static async getMessage(channel,messageId){
        try {
            const msg = await channel?.messages?.fetch(messageId)
            return msg
        } catch (error) {
            ChannelController.sendError(error,MessageFormatting.linkToMessage(channel.id,messageId))
            return null
        }
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
            privacyLevel:GuildScheduledEventPrivacyLevel.GuildOnly,
        })
    }

    static async createThread(msg,threadName,immediatelyCloseThread = false,byAuthor){
        try {
            if (byAuthor) {
                const maxLength = 90 - `by ${byAuthor}`.length
                threadName = FormatString.truncateString(threadName,maxLength)+ ` by ${byAuthor}`
            }else{
                threadName = FormatString.truncateString(threadName,90)
            }
            
            const thread = await msg.startThread({
                name: threadName,
                autoArchiveDuration:ThreadAutoArchiveDuration.OneHour
            });
            if(immediatelyCloseThread) thread.setArchived(true)
            return thread
        } catch (error) {
            ChannelController.sendError(error,'create thread')
        }
    }

    static async createPrivateThread(channel,threadName){
        try {
            return await channel.threads.create({
                name: threadName,
                type: ChannelType.PrivateThread
            });
        } catch (error) {
            ChannelController.sendError(error,'create thread')
        }
    }

    static getEmojiByName(client,emojiName){
        return client.guilds.cache.get(GUILD_ID).emojis.cache.find(emoji => emoji.name === emojiName)
    }

    static async addMemberPartyToThread(client,channelId,threadId,userId){
        const dataUser = await supabase.from("MemberPartyRooms")
			.select('partyId')
            .eq('UserId',userId)
            .gte("endPartyDate",Time.getTodayDateOnly())
            .single()
        if(!dataUser.body) return 
        
        const partyId = dataUser.body.partyId
        
        const {body:members} = await supabase.from("MemberPartyRooms")
        .select("UserId")
        .eq('partyId',partyId)
        .neq('UserId',userId)

        for (let i = 0; i < members.length; i++) {
			const memberId = members[i].UserId;
			await ChannelController.addUserToThread(client,channelId,threadId,memberId)
		}
    }

    static async deleteMessage(msg){
        try {
            return await msg.delete()
        } catch (error) {
            ChannelController.sendError(error)
            return null
        }
    }

    static async sendToNotification(client,messageContent,userId,notificationId){
        try {
            const notificationThread = await ChannelController.getNotificationThread(client,userId,notificationId)
            if(!notificationThread) return null
            if(Array.isArray(messageContent)){
                messageContent.forEach(msg=>{
                    notificationThread.send(msg)
                })
                supabase
                    .rpc('incrementTotalNotification', { x: messageContent.length, row_id: userId })
                    .then()
            }else{
                supabase
                    .rpc('incrementTotalNotification', { x: 1, row_id: userId })
                    .then()
                return await notificationThread.send(messageContent)
            }
        } catch (error) {
            ChannelController.sendError(error,`sendToNotification ${userId}`)
        }
    }

    static sendError(error,data='error'){
        const webhookClient = new WebhookClient({ url:"https://discord.com/api/webhooks/953519981629419540/5PQwLXEB-Xxh5nuwOANNRUdddt1UTqsCay-TRRVocN-_lV6mXSoSI7KkZX7xiC8PDh1E" });
        webhookClient.send(`${data}: ${error}`)
    }

    static async createTemporaryVoiceChannel(client,name,channelParentID){
        const guild = client.guilds.cache.get(GUILD_ID)

        const voiceChannel = await guild.channels.create({
            name,
            parent:ChannelController.getChannel(client,channelParentID),
            type:ChannelType.GuildVoice,
            
        })
        
        return voiceChannel
    }
}


module.exports = ChannelController