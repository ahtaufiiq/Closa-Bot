const {GUILD_ID} = require("../helpers/config")

class MemberController{

    static async addRole(bot,userId,roleId) {
        const role = await bot.guilds.cache.get(GUILD_ID).roles.fetch(roleId)
        bot.guilds.cache.get(GUILD_ID).members.fetch(userId)
            .then(user=>{
                user.roles.add(role)
            })
        
    }

    static async removeRole(bot,userId,roleId) {
        let role = await bot.guilds.cache.get(GUILD_ID).roles.fetch(roleId)
        bot.guilds.cache.get(GUILD_ID).members.fetch(userId)
            .then(user=>{
                user.roles.remove(role)
            })
    }
}

module.exports = MemberController