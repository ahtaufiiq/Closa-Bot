const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js")
class TemplateEmbedMessage{

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

    static embedMessage(title,description,color="#00B264"){
        return new MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
    }
}

module.exports = TemplateEmbedMessage