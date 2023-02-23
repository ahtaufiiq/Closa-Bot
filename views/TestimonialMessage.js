const getRandomValue = require("../helpers/getRandomValue")
const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")

class TestimonialMessage{
    static howToShareTestimonial(userId){
        return {
            content:`Congrats on your milestones ${MessageFormatting.tagUser(userId)}! :tada:
Help us spread the word about closa :pleading_face:`,
            embeds:[MessageComponent.embedMessage({
                    description:`> *One of the reason we’re able to sustainably provide better experience for our community,
                    > because of the referral & support from the people like you :sparkles:*
                    
**__How to participate?__**
1. Write us your testimonial (on twitter, instagram, or linkedin)
2. Don't forget to tag us @joinclosa (make sure your profile is public)
3. Submit your testimonial's link here

__**The reward for helping us spreading the word :gift:**__
• Get 1-month free membership (text format) 
• Get 2-month free membership (video format)`}).setImage("https://media.giphy.com/media/TdfyKrN7HGTIY/giphy.gif")],
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`submitTestimonial_${userId}`,"Submit link"),
                MessageComponent.addLinkButton('Write on Twitter',"https://twitter.com/intent/tweet")
            )]
        }
    }

    static successSubmitTestimonial(){
        return `Your testimonial has been submitted ✅

Your submission is under our review, we'll get back to you soon.
Thank you for participating!`
    }

    static reviewTestimonial(userId,testimonialLink,reply){
        return `New testimonial from ${MessageFormatting.tagUser(userId)}
${reply}

→ ${testimonialLink}`
    }

    static postTestimonialUser(userId,testimonialLink,isShowButton=false){
        const copywritingReply = [
            "Thank you for your support ❤️",
            "Your support means so much to us ❤️",
            "Really appreciate your token of kindness 💙",
            "Thanks for your thoughtful review 🌟",
            "Thank you for supporting our mission ❤️",
            "Your supportive words means so much. Thank you ✨",
        ]
        
        const components = []
        if(isShowButton) {
            components.push(MessageComponent.createComponent(
                MessageComponent.addButton('postTestimonial','Post'),
                MessageComponent.addButton('customReplyTestimonial','Custom Reply',"SECONDARY")
            ))
        }
        return {
            content:`New testimonial from ${MessageFormatting.tagUser(userId)}
${getRandomValue(copywritingReply)}

→ ${testimonialLink}`,
            components
        }
    }


}

module.exports = TestimonialMessage