const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v9');
const { MessageEmbed } = require('discord.js');
const ChannelController = require('../controllers/ChannelController');
const UserController = require('../controllers/UserController');
const InfoUser = require('../helpers/InfoUser');
const MessageFormatting = require('../helpers/MessageFormatting');
const supabase = require('../helpers/supabaseClient');
const PointMessage = require('../views/PointMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('link')
		.setDescription('link to goal or notification user')
		.addSubcommand(subcommand =>
			subcommand
				.setName('notification')
				.setDescription('link to notification user')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('goal')
				.setDescription('link to goal user')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true)))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const command = interaction.options.getSubcommand()
		const taggedUser = interaction.options.getUser('user')

		const dataUser = await supabase.from('Users')
			.select()
			.eq('id',taggedUser.id)
			.single()
		if(command === 'notification'){
			await interaction.reply({ephemeral:true,content:`Link to Notification: ${MessageFormatting.linkToInsideThread(dataUser.body?.notificationId)}`})			
		}else if(command === 'goal'){
			await interaction.reply({ephemeral:true,content:`Link to Notification: ${MessageFormatting.linkToInsideThread(dataUser.body?.goalId)}`})			
		}
	},
};