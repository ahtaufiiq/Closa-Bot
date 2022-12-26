const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")

class TestimonialMessage{
    static howToShareTestimonial(userId){
        return {
            content:`Congrats on your milestones ${MessageFormatting.tagUser(userId)}! :tada:
Help us spread the word about closa :pleading_face:

> *One of the reason we’re able to sustainably provide better experience for our community,
> because of the referral & support from the people like you :sparkles:*

**__How to participate?__**
1. Write us your testimonial (on twitter, instagram, or linkedin)
2. Don't forget to tag us @beclosa
3. Submit your testimonial's link here

__**The reward for helping us spreading the word :gift:**__
• Get 1-month free membership (text format) 
• Get 2-month free membership (video format)`,
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

    static newTestimonialUser(userId,testimonialLink){
        return `New testimonial from ${MessageFormatting.tagUser(userId)}
${testimonialLink}`
    }
}

module.exports = TestimonialMessage