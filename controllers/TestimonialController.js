const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const supabase = require('../helpers/supabaseClient');
const TestimonialMessage = require('../views/TestimonialMessage');
const ChannelController = require('./ChannelController');
const GuidelineInfoController = require('./GuidelineInfoController');
class TestimonialController{
    static showModalSubmitTestimonial(interaction){
        const [commandButton,userId] = interaction.customId.split('_')
        if(commandButton === "submitTestimonial" || commandButton === 'submitTestimonialGuideline'){
            if(interaction.user.id !== userId) return interaction.reply({ephemeral:true,content:`Hi ${interaction.user}, you can't submit someone else testimonial.`})
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
            await GuidelineInfoController.updateDataShowTestimonial(msg.author.id,true)
            GuidelineInfoController.updateMessagGuideline(msg.client,msg.author.id)
            ChannelController.sendToNotification(
                msg.client,
                TestimonialMessage.howToShareTestimonial(msg.author.id),
                msg.author.id,
                notificationId
            )
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