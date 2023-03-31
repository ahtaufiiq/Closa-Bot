const { SlashCommandBuilder } = require('discord.js');
const VacationController = require('../controllers/VacationController');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription('buy vacation ticket to have a rest day without posting progress'),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true});
		await VacationController.interactionShopVacationTicket(interaction)
	},
};