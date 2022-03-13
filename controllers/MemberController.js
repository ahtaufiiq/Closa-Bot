const {GUILD_ID} = require("../helpers/config")

class MemberController{


    static async changeRole(bot,userId,oldRoleId,newRoleId) {
        let oldRole = await bot.guilds.cache.get(ServerId).roles.fetch(oldRoleId)
        bot.users.fetch(userId).removeRole(oldRole)
        let newRole = await bot.guilds.cache.get(ServerId).roles.fetch(newRoleId)
        bot.users.fetch(userId).addRole(newRole)
    }

    static async addRole(bot,userId,roleId) {
        const role = await bot.guilds.cache.get(GUILD_ID).roles.fetch(roleId)
        bot.guilds.cache.get(GUILD_ID).members.fetch(userId)
            .then(user=>{
                user.roles.add(role)
            })
        
    }

    static async removeRole(bot,userId,roleId) {
        let role = await bot.guilds.cache.get(ServerId).roles.fetch(roleId)
        bot.users.fetch(userId).removeRole(role)
    }
}

module.exports = MemberController