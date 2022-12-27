const { SlashCommandBuilder } = require('@discordjs/builders');
const BoostController = require('../controllers/BoostController');
const ChannelController = require('../controllers/ChannelController');
const DailyReport = require('../controllers/DailyReport');
const PointController = require('../controllers/PointController');
const RecurringMeetupController = require('../controllers/RecurringMeetupController');
const VacationController = require('../controllers/VacationController');
const FormatString = require('../helpers/formatString');
const MessageFormatting = require('../helpers/MessageFormatting');
const Time = require('../helpers/time');
const BoostMessage = require('../views/BoostMessage');
const RecurringMeetupMessage = require('../views/RecurringMeetupMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription('buy vacation ticket to have a rest day without posting progress'),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true});
		await VacationController.interactionShopVacationTicket(interaction)
	},
};