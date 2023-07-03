const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const supabase = require('../helpers/supabaseClient');
const TestimonialMessage = require('../views/TestimonialMessage');
const ChannelController = require('./ChannelController');
const GuidelineInfoController = require('./GuidelineInfoController');
const MessageFormatting = require('../helpers/MessageFormatting');
class TestimonialController{
    static showModalSubmitTestimonial(interaction){
        const [commandButton,userId] = interaction.customId.split('_')
        if(commandButton === 'submitTestimonialAchievement'){
            if(interaction.user.id !== userId) return interaction.reply({ephemeral:true,content:`Hi ${interaction.user}, you can't submit someone else testimonial.`})
            const modal = new Modal()
            .setCustomId(interaction.customId)
            .setTitle("🔗 Submit Celebration Link")
            .addComponents(
                new TextInputComponent().setCustomId('link').setLabel("Celebration Link").setPlaceholder("Link to your celebration..").setStyle("SHORT").setRequired(true),
            )
            showModal(modal, { client: interaction.client, interaction: interaction});
            return true
        }else if(commandButton === "submitTestimonial" || commandButton === 'submitTestimonialGuideline'){
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
        const [commandButton,userId,value] = interaction.customId.split('_')
        if(commandButton === "customReplyTestimonial"){
            const modal = new Modal()
            .setCustomId(interaction.customId)
            .setTitle(`${value ? "Celebration" : "Testimonial"} reply`)
            .addComponents(
                new TextInputComponent().setCustomId('reply').setLabel("Reply").setDefaultValue(value ? interaction.message.content : '').setStyle("LONG").setRequired(true),
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

    static async askToWriteTestimonial(client,userId,notificationId){
        const isAlreadySubmitTestimonial = await TestimonialController.alreadySubmitTestimonial(userId)
        if(!isAlreadySubmitTestimonial){
            await GuidelineInfoController.updateDataShowTestimonial(userId,true)
            GuidelineInfoController.updateMessageGuideline(client,userId)
            ChannelController.sendToNotification(
                client,
                TestimonialMessage.howToShareTestimonial(userId),
                userId,
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