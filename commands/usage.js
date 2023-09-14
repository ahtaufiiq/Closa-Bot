const { SlashCommandBuilder } = require('discord.js');
const VacationController = require('../controllers/VacationController');
const UsageController = require('../controllers/UsageController');
const UsageMessage = require('../views/UsageMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('usage')
		.setDescription('Check your monthly usage'),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true});
		const dataUsage = await UsageController.getUsage(interaction.user.id)
		interaction.editReply(UsageMessage.checkMonthlyUsage(
			interaction.user.id,
			dataUsage.data?.totalCoworking,
			dataUsage.data?.Users?.membershipType,
		))
	},
};