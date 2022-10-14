const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const PartyMessage = require('../views/PartyMessage');
class PartyController{
    static showModalWriteGoal(interaction){
        if(interaction.customId.includes('writeGoal')){
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent()
					.setCustomId('project')
					.setLabel("Project Name")
					.setPlaceholder("Short project's name e.g: Design Exploration")
					.setStyle("SHORT")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('goal')
					.setLabel("My goal is")
					.setPlaceholder("Write specific & measurable goal e.g: read 2 books")
					.setStyle("SHORT")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('about')
					.setLabel("About Project")
					.setPlaceholder("Tell a bit about this project")
					.setStyle("LONG")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('shareProgressAt')
					.setLabel("I'll share my progress at")
					.setPlaceholder("e.g 21.00")
					.setStyle("SHORT")
					.setRequired(true),
			)
			showModal(modal, {
				client: interaction.client, // Client to show the Modal through the Discord API.
				interaction: interaction, // Show the modal with interaction data.
			});
			return true
		}
        return false
    }

    static showModalEditGoal(interaction){
        if(interaction.customId.includes('editGoal')){
			const project = interaction.message.embeds[0].title
			const [
				{value:goal},
				{value:about},
				{value:descriptionShareProgress},
			] = interaction.message.embeds[0].fields
			const shareProgressAt = PartyController.getTimeShareProgress(descriptionShareProgress)
			const modal = new Modal()
			.setCustomId(interaction.customId)
			.setTitle("Set your goal 🎯")
			.addComponents(
				new TextInputComponent()
					.setCustomId('project')
					.setLabel("Project Name")
					.setDefaultValue(project)
					.setPlaceholder("Short project's name e.g: Design Exploration")
					.setStyle("SHORT")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('goal')
					.setLabel("My goal is")
					.setDefaultValue(goal)
					.setPlaceholder("Write specific & measurable goal e.g: read 2 books")
					.setStyle("SHORT")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('about')
					.setLabel("About Project")
					.setDefaultValue(about)
					.setPlaceholder("Tell a bit about this project")
					.setStyle("LONG")
					.setRequired(true),
				new TextInputComponent()
					.setCustomId('shareProgressAt')
					.setLabel("I'll share my progress at")
					.setDefaultValue(shareProgressAt)
					.setPlaceholder("e.g 21.00")
					.setStyle("SHORT")
					.setRequired(true),
			)
			showModal(modal, {
				client: interaction.client, // Client to show the Modal through the Discord API.
				interaction: interaction, // Show the modal with interaction data.
			});
			return true
		}
        return false
    }

    static async interactionPickRole(interaction,role,userId,type='party'){
        await interaction.editReply(PartyMessage.pickYourGoalCategory(role,userId,type))
        interaction.message.delete()
    }

	static getTimeShareProgress(shareProgressAt){
		return shareProgressAt.split(" ")[0]
	}
}

module.exports = PartyController