const DiscordWebhook = require("../helpers/DiscordWebhook")
const {GUILD_ID} = require("../helpers/config")
const supabase = require("../helpers/supabaseClient")
const OnboardingMessage = require("../views/OnboardingMessage")
const ChannelController = require("./ChannelController")
const UserController = require("./UserController")

class MemberController{

    static async addRole(client,userId,roleId) {
        try {
            const role = await MemberController.getRole(client,roleId)
            const user = await client.guilds.cache.get(GUILD_ID).members.fetch(userId)
            return await user.roles.add(role)
        } catch (error) {
            DiscordWebhook.sendError(error,`${userId} addRole ${roleId}`)            
        }
    }

    static async getTotalMember(){
        const {count} = await supabase
        .from('Users')
        .select('id', { count: 'exact' })
        .not('type','is',null)

        return count
    }

    static async sendToDM(client,messageContent,UserId,remindToOpenDM=false){
        const data = await UserController.getDetail(UserId,'DMChannelId,attemptSendDM,notificationId')
        const {DMChannelId,attemptSendDM,notificationId} = data.body
        try {
            const {user} = await MemberController.getMember(client,UserId)
            const msg = await user.send(messageContent)
            if(!DMChannelId) UserController.updateData({DMChannelId:msg.channelId},UserId)
        } catch (error) {
            if(remindToOpenDM && attemptSendDM <= 3){
                ChannelController.sendToNotification(
                    client,
                    OnboardingMessage.howToActivateDM(UserId),
                    UserId,
                    notificationId
                )
                UserController.updateData({attemptSendDM:attemptSendDM+1},UserId)
            }
            if(DMChannelId) UserController.updateData({DMChannelId:null},UserId)
        }
    }

    static async removeRole(client,userId,roleId) {
        try {
            let role = await MemberController.getRole(client,roleId)
            const user = await client.guilds.cache.get(GUILD_ID).members.fetch(userId)
            user.roles.remove(role)
        } catch (error) {
            DiscordWebhook.sendError(error,`${userId} removeRole ${roleId}`)                   
        }
    }

    static async getRole(client,roleId){
        let role = await client.guilds.cache.get(GUILD_ID).roles.fetch(roleId)
        return role
    }

    static async hasRole(client,userId,roleId){
        const user = await this.getMember(client,userId)
        let hasRole = false
        user.roles.cache.every(data=>{
            if(data.id === roleId) {
                hasRole = true
                return false
            }
            return true
        })
        return hasRole
    }

    static async getMember(client,userId){
        try {
            return await client.guilds.cache.get(GUILD_ID).members.fetch(userId)
        } catch (error) {
            return null            
        }
    }

    static changeRole(client,userId,fromRole,toRole){
        MemberController.removeRole(client,userId,fromRole)
        MemberController.addRole(client,userId,toRole)
    }
}

module.exports = MemberController