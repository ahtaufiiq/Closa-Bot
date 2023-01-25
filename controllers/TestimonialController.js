const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const supabase = require('../helpers/supabaseClient');
const TestimonialMessage = require('../views/TestimonialMessage');
const ChannelController = require('./ChannelController');
class TestimonialController{
    static showModalSubmitTestimonial(interaction){
        if(interaction.customId.includes("submitTestimonial")){
            const modal = new Modal()
            .setCustomId(interaction.customId)
            .setTitle("🔗 Submit Testimonial Link")
            .addComponents(
                new TextInputComponent().setCustomId('link').setLabel("Testimonial Link").setPlaceholder("Link to your testimonial..").setStyle("SHORT").setRequired(true),
            )
            showModal(modal, { client: interaction.client, interaction: interaction});
            return true
        }else{
            return false
        }
    }

    static showModalCustomReply(interaction){
        if(interaction.customId === "customReplyTestimonial"){
            const modal = new Modal()
            .setCustomId(interaction.customId)
            .setTitle("Testimonial Reply")
            .addComponents(
                new TextInputComponent().setCustomId('reply').setLabel("Reply").setStyle("LONG").setRequired(true),
            )
            showModal(modal, { client: interaction.client, interaction: interaction});
            return true
        }else{
            return false
        }
    }

    static addTestimonialUser(UserId,testimonialLink){
        supabase.from("Testimonials")
            .insert({UserId,testimonialLink})
            .then()
    }

    static async askToWriteTestimonial(msg,notificationId){
        const isAlreadySubmitTestimonial = await TestimonialController.alreadySubmitTestimonial(msg.author.id)
        if(!isAlreadySubmitTestimonial){
            const notificationThread = await ChannelController.getNotificationThread(msg.client,msg.author.id,notificationId)
            notificationThread.send(TestimonialMessage.howToShareTestimonial(msg.author.id))
        }
    }

    static async alreadySubmitTestimonial(userId){
        const dataTestimonial = await supabase.from("Testimonials")
            .select()
            .eq("UserId",userId)


        return dataTestimonial.body.length > 0
    }
}

module.exports = TestimonialController