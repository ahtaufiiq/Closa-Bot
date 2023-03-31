const { SlashCommandBuilder } = require('@discordjs/builders');
const SickDayController = require('../controllers/SickDayController');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sick')
		.setDescription('buy sick ticket to have a rest day without posting progress'),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true});
		await SickDayController.interactionShopSickTicket(interaction)
	},
};