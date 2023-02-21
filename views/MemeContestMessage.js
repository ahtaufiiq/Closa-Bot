const { CHANNEL_MEMES } = require("../helpers/config")
const MessageFormatting = require("../helpers/MessageFormatting")

class MemeContestMessage{
    static invalidSubmissionFormat(){
        return `**⚠️ Invalid submission format.**
You should submit only using image or image with text caption`
    }

    static submissionLimit(user){
        return `**You've reached your submission limit on ${MessageFormatting.tagChannel(CHANNEL_MEMES)} ${user}
Back again tomorrow with your fresh memes 🤌**`
    }

    static alreadyUpvoteMeme(){
        return `**⚠️ You've upvoted this meme previously**
Can't upvote the same meme twice`
    }

    static upvoteSuccess(upvoteLeft){
        return `**Upvoted ⬆️**

${upvoteLeft} daily upvote left
${upvoteLeft === 0 ? "come back again tomorrow 🤌" : ""}`
    }
    static upvoteLimit(){
        return `**⚠️You've reached the daily upvote limit (5/5).**`
    }

    static cannotVoteOwnMeme(user){
        return `**⚠️ you can't upvote your own meme ${user}**`
    }

    static addVibePoints(user,totalPoint){
        return `**You got +${totalPoint} vibe points from ${MessageFormatting.tagChannel(CHANNEL_MEMES)} submission ${user} :coin:**`
    }
}

module.exports = MemeContestMessage