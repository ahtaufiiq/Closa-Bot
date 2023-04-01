const { SlashCommandBuilder } = require('discord.js');
const ChannelController = require('../controllers/ChannelController');
const DailyStreakController = require('../controllers/DailyStreakController');
const { PermissionFlagsBits } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('repair')
		.setDescription('repair streak')
		.addSubcommand(subcommand =>
			subcommand
				.setName('streak')
				.setDescription('repair streak')
				.addUserOption(option => option.setName('user').setDescription('user')))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		interaction.deferReply()
		const user = interaction.options.getUser('user')
		const msgSuccessRepairStreak = await DailyStreakController.applyRepairStreak(interaction.client,user)
		ChannelController.sendToNotification(
			interaction.client,
			msgSuccessRepairStreak,
			user.id
		)

		interaction.editReply(`Repaired streak for ${user}`)
	},
};