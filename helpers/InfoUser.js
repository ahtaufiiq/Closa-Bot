class InfoUser{
    static getAvatar(user){
        const avatarUrl = user.avatar ? "https://cdn.discordapp.com/avatars/"+user.id+"/"+user.avatar+".jpeg" : user.displayAvatarURL()
        return avatarUrl
    }
}

module.exports = InfoUser