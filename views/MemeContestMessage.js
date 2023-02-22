const { CHANNEL_MEMES } = require("../helpers/config")
const MessageFormatting = require("../helpers/MessageFormatting")

class MemeContestMessage{
    static invalidSubmissionFormat(user){
        return `**⚠️ Invalid submission format.**
You should submit only using image or image with text caption ${user}`
    }

    static submissionLimit(user){
        return `**You've reached your submission limit on ${MessageFormatting.tagChannel(CHANNEL_MEMES)} ${user}
Back again tomorrow with your fresh memes 🤌**`
    }

    static alreadyUpvoteMeme(user){
        return `**⚠️ You've upvoted this meme previously**
Can't upvote the same meme twice ${user}`
    }

    static upvoteSuccess(upvoteLeft,user){
        return `**Upvoted ⬆️**

${upvoteLeft} daily upvote left ${user}
${upvoteLeft === 0 ? "come back again tomorrow 🤌" : ""}`
    }
    static upvoteLimit(user){
        return `**⚠️You've reached the daily upvote limit (5/5).** ${user}`
    }

    static cannotVoteOwnMeme(user){
        return `**⚠️ you can't upvote your own meme ${user}**`
    }

    static addVibePoints(user,totalPoint){
        return `**You got +${totalPoint} vibe points from ${MessageFormatting.tagChannel(CHANNEL_MEMES)} submission ${user} :coin:**`
    }
}

module.exports = MemeContestMessage