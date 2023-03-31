const { SlashCommandBuilder } = require('discord.js');
const VacationController = require('../controllers/VacationController');
const Time = require('../helpers/time');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vacation')
		.setDescription('buy vacation ticket to have a rest day without posting progress')
		.addSubcommand(subcommand =>
			subcommand
				.setName('today')
				.setDescription('buy vacation ticket for today'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('tomorrow')
				.setDescription('buy vacation ticket for tomorrow')),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true});

		const command = interaction.options.getSubcommand()

		switch (command) {
			case "today":
				await VacationController.interactionBuyTicketViaShop(interaction,1,Time.getTodayDateOnly())
				break;
			case "tomorrow":
				await VacationController.interactionBuyTicketViaShop(interaction,1,Time.getTomorrowDateOnly())
				break;
		}
	},
};