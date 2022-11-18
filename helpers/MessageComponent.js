const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js");
const InfoUser = require("./InfoUser");
class MessageComponent {
    static createComponent(...buttons){
        return new MessageActionRow()
            .addComponents(
                ...buttons
            )
    }

    static addButton(id,text,style="SUCCESS"){
        return new MessageButton()
            .setCustomId(id)
            .setLabel(text)
            .setStyle(style)
    }
    static addDisabledButton(id,text,style="SUCCESS"){
        return new MessageButton()
            .setCustomId(id)
            .setLabel(text)
            .setStyle(style)
            .setDisabled(true);
    }
    static addLinkButton(text,link){
        return new MessageButton()
            .setLabel(text)
            .setURL(link)
            .setStyle("LINK")
    }

    static addMenu(id,placeholder,options){
        return new MessageSelectMenu()
            .setCustomId(id)
            .setPlaceholder(placeholder)
            .addOptions(options)
    }

    static addEmojiButton(id,text,emoji,style="SUCCESS"){
        return new MessageButton()
            .setCustomId(id)
            .setLabel(text)
            .setStyle(style)
            .setEmoji(emoji)
    }

    static embedMessage({title,description,user},color="#00B264"){
        const embed = new MessageEmbed()
        .setColor(color)
        .setTitle(title||"")
        .setDescription(description||"")

        if(user){
            embed.setFooter({iconURL:InfoUser.getAvatar(user),text:user.username})
        }

        return embed
    }
}

module.exports = MessageComponent