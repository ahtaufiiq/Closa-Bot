const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const supabase = require('../helpers/supabaseClient');
const IntroMessage = require('../views/IntroMessage');

class IntroController{
    static showModalWriteIntro(interaction){
		const [commandButton,userId] = interaction.customId.split('_')
        if(commandButton === 'writeIntro'){
			if(interaction.user.id !== userId) return interaction.reply({ephemeral:true,content:`Hi ${interaction.user}, you can't write someone else intro.`})
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Make an intro 👋")
			.addComponents(
				new TextInputComponent().setCustomId('name').setLabel(IntroMessage.labelModal.name).setPlaceholder('Name, location').setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('about').setLabel(IntroMessage.labelModal.about).setPlaceholder('background, interest, projects or anything else..').setStyle("LONG").setRequired(true),
				new TextInputComponent().setCustomId('expertise').setLabel(IntroMessage.labelModal.expertise).setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('needHelp').setLabel(IntroMessage.labelModal.needHelp).setPlaceholder("Additional story, notes, or learnings").setStyle('SHORT').setRequired(true),
				new TextInputComponent().setCustomId('social').setLabel(IntroMessage.labelModal.social).setDefaultValue(IntroMessage.defaultValue.social).setPlaceholder("Additional story, notes, or learnings").setStyle('LONG').setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }
    static showModalEditIntro(interaction){
		const [commandButton,userId] = interaction.customId.split('_')
        if(commandButton === 'editIntro'){
			if(interaction.user.id !== userId) return interaction.reply({ephemeral:true,content:`Hi ${interaction.user}, you can't write someone else intro.`})

			const {name,about,expertise,needHelp,social} = IntroController.getDataIntroFromMessage(interaction.message)
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Make an intro 👋")
			.addComponents(
				new TextInputComponent().setCustomId('name').setLabel(IntroMessage.labelModal.name).setDefaultValue(name).setPlaceholder('Name, location').setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('about').setLabel(IntroMessage.labelModal.about).setDefaultValue(about).setPlaceholder('background, interest, projects or anything else..').setStyle("LONG").setRequired(true),
				new TextInputComponent().setCustomId('expertise').setLabel(IntroMessage.labelModal.expertise).setDefaultValue(expertise).setStyle("SHORT").setRequired(true),
				new TextInputComponent().setCustomId('needHelp').setLabel(IntroMessage.labelModal.needHelp).setDefaultValue(needHelp).setPlaceholder("Additional story, notes, or learnings").setStyle('SHORT').setRequired(true),
				new TextInputComponent().setCustomId('social').setLabel(IntroMessage.labelModal.social).setDefaultValue(social).setPlaceholder("Additional story, notes, or learnings").setStyle('LONG').setRequired(true),
			)
			showModal(modal, { client: interaction.client, interaction: interaction});
			return true
		}
        return false
    }

	static async addIntro({id,name,about,expertise,needHelp,social,UserId}){
		return await supabase.from("Intros")
			.insert({id,name,about,expertise,needHelp,social,UserId})
	}
	static async editIntro({id,name,about,expertise,needHelp,social,UserId}){
		return await supabase.from("Intros")
			.update({name,about,expertise,needHelp,social,UserId})
			.eq('id',id)
	}

	static getDataIntroFromMessage(message){
		const data = {}
		message.embeds[0].fields.forEach(field => {
			const {name,value} = field
			if(name === IntroMessage.titleField.name) data.name = value
			if(name === IntroMessage.titleField.about) data.about = value
			if(name === IntroMessage.titleField.expertise) data.expertise = value
			if(name === IntroMessage.titleField.needHelp) data.needHelp = value
			if(name === IntroMessage.titleField.social) data.social = value
		});
		return data
	}
}

module.exports = IntroController