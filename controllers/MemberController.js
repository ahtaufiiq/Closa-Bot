const {GUILD_ID} = require("../helpers/config")
const supabase = require("../helpers/supabaseClient")
const ChannelController = require("./ChannelController")

class MemberController{

    static async addRole(client,userId,roleId) {
        try {
            const role = await MemberController.getRole(client,roleId)
            const user = await client.guilds.cache.get(GUILD_ID).members.fetch(userId)
            return await user.roles.add(role)
        } catch (error) {
            ChannelController.sendError(error,`${userId} addRole ${roleId}`)            
        }
    }

    static async getTotalMember(){
        const {count} = await supabase
        .from('Users')
        .select('id', { count: 'exact' })
        .not('type','is',null)

        return count
    }


    static async removeRole(client,userId,roleId) {
        try {
            let role = await MemberController.getRole(client,roleId)
            const user = await client.guilds.cache.get(GUILD_ID).members.fetch(userId)
            user.roles.remove(role)
        } catch (error) {
            ChannelController.sendError(error,`${userId} removeRole ${roleId}`)                   
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