const { EmbedBuilder } = require("discord.js")
const InfoUser = require("../helpers/InfoUser")
const MessageComponent = require("../helpers/MessageComponent")
const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")
const MemeContestMessage = require("../views/MemeContestMessage")
const ChannelController = require("./ChannelController")
const UserController = require("./UserController")

class MemeController {
    static async submitMeme(msg){
        let memeUrl = ''
        for (const [_,value] of msg.attachments) {
            memeUrl = value.proxyURL
            break
        }

        const msgMeme = await msg.channel.send({
            content:`submission by ${msg.author}`,
            embeds:[
                new EmbedBuilder()
                    .setColor('#ffffff')
                    .setTitle(msg.content || null)
                    .setImage(memeUrl)
                    .setFooter({iconURL:InfoUser.getAvatar(msg.author),text:`by ${msg.author.username}`})
            ]
        })
        
        const dataSubmitMeme = await supabase.from('MemeContests')
            .insert({
                msgMemeId:msgMeme.id,
                submitDate:Time.getTodayDateOnly(),
                imgUrl:memeUrl,
                content:msg.content,
                UserId:msg.author.id
            }).single()

        msgMeme.edit({
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton(`upvoteMeme_${msg.author.id}_${dataSubmitMeme.body.id}`,'Upvote','⬆️',"SECONDARY")
            )]
        })
        ChannelController.createThread(msgMeme,`by ${msg.author.username} – meme #${dataSubmitMeme.body.id}`,true)
    }

    static async upvoteMeme(){

    }

    static async totalSubmitToday(userId){
        const {count} = await supabase
        .from('MemeContests')
        .select('id', { count: 'exact' })
        .eq('UserId',userId)
        .eq('submitDate',Time.getTodayDateOnly())
        return count
    }
    static async totalUpvoteToday(userId){
        const {count} = await supabase
        .from('UpvoteMemes')
        .select('id', { count: 'exact' })
        .eq('UserId',userId)
        .eq('upvoteDate',Time.getTodayDateOnly())
        return count
    }

    static async addVibePoints(client,author){
        const point = 25
        UserController.incrementTotalPoints(point,author.id)
        ChannelController.sendToNotification(client,MemeContestMessage.addVibePoints(author,point),author.id)
    }
}

module.exports = MemeController