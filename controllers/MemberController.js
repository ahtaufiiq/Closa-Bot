const {GUILD_ID} = require("../helpers/config")

class MemberController{

    static async addRole(client,userId,roleId) {
        const role = await client.guilds.cache.get(GUILD_ID).roles.fetch(roleId)
        client.guilds.cache.get(GUILD_ID).members.fetch(userId)
            .then(user=>{
                user.roles.add(role)
            })
        
    }

    static async removeRole(client,userId,roleId) {
        let role = await client.guilds.cache.get(GUILD_ID).roles.fetch(roleId)
        client.guilds.cache.get(GUILD_ID).members.fetch(userId)
            .then(user=>{
                user.roles.remove(role)
            })
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
        return await client.guilds.cache.get(GUILD_ID).members.fetch(userId)
    }

    static changeRole(client,userId,fromRole,toRole){
        MemberController.removeRole(client,userId,fromRole)
        MemberController.addRole(client,userId,toRole)
    }
}

module.exports = MemberController