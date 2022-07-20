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
}

module.exports = MemberController