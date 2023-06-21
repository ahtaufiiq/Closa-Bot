const { SlashCommandBuilder } = require('discord.js');
const ReferralCodeController = require('../controllers/ReferralCodeController');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('invite')
		.setDescription('generate invite links to invite your friends.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('friends')
				.setDescription('generate invite links to invite your friends.')),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true});
		await ReferralCodeController.interactionClaimReferral(interaction,interaction.user.id)
	},
};