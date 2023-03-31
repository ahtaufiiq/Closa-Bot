const { PermissionFlagsBits,SlashCommandBuilder } = require('discord.js');
const GuidelineInfoController = require('../controllers/GuidelineInfoController');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('send')
		.setDescription('Send')
		.addSubcommand(subcommand =>
			subcommand
				.setName('guideline')
				.setDescription('send guideline to notification')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true)))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true});
		const user = interaction.options.getUser('user')
		await GuidelineInfoController.generateGuideline(interaction.client,user.id)
		interaction.editReply('success send guideline to user')
	},
};