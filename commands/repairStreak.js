const { SlashCommandBuilder } = require('@discordjs/builders');
const { CHANNEL_TODO, CHANNEL_HIGHLIGHT, CHANNEL_PARTY_ROOM } = require('../helpers/config');
const { PermissionFlagsBits } = require('discord-api-types/v9');
const supabase = require('../helpers/supabaseClient');
const schedule = require('node-schedule');
const Time = require('../helpers/time');
const HighlightReminderMessage = require('../views/HighlightReminderMessage');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const ChannelController = require('../controllers/ChannelController');
const LocalData = require('../helpers/LocalData');
const RecurringMeetupController = require('../controllers/RecurringMeetupController');
const RecurringMeetupMessage = require('../views/RecurringMeetupMessage');
const PartyController = require('../controllers/PartyController');
const DailyStreakController = require('../controllers/DailyStreakController');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('repair')
		.setDescription('repair streak')
		.addSubcommand(subcommand =>
			subcommand
				.setName('streak')
				.setDescription('create voice channel for all party')
				.addUserOption(option => option.setName('user').setDescription('user')))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const taggedUser = interaction.options.getUser('user')
		
		const msgSuccessRepairStreak = await DailyStreakController.applyRepairStreak(interaction.client,taggedUser)
		ChannelController.sendToNotification(
			interaction.client,
			msgSuccessRepairStreak,
			taggedUser.id
		)
	},
};