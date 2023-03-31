const { EmbedBuilder } = require("discord.js")
const InfoUser = require("../helpers/InfoUser")

class PointMessage {
    static successAddPoint(user,message,amount){
        const avatarUrl = InfoUser.getAvatar(user)
        return {
				content:`Bonus vibe points for you ${user}!`,
				embeds:[
					new EmbedBuilder()
					.setColor("#FEFEFE")
					.setImage("https://media.giphy.com/media/obaVSnvRbtos0l7MBg/giphy.gif")
					.setDescription(message || null)
					.setAuthor({name:`+${amount} POINTS`.toUpperCase(),iconURL:"https://media.giphy.com/media/QZJ8UcjU5VfFwCIkUN/giphy.gif "})
					.setFooter({text:`${user.username}`, iconURL:avatarUrl})
				]
			}
    }
}

module.exports = PointMessage