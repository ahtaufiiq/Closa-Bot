const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v9');
const { MessageEmbed } = require('discord.js');
const ChannelController = require('../controllers/ChannelController');
const UserController = require('../controllers/UserController');
const { CHANNEL_GENERAL } = require('../helpers/config');
const InfoUser = require('../helpers/InfoUser');
const PointMessage = require('../views/PointMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('point')
		.setDescription('send point to closa contributor')
		.addUserOption(option => option.setName('user').setDescription('The user').setRequired(true))
		.addNumberOption(option => option.setName('amount').setDescription("amount"))
		.addStringOption(option => option.setName('message').setDescription("Your message to user"))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true});
		const taggedUser = interaction.options.getUser('user')
		const message = interaction.options.getString('message') || ""
		const amount = interaction.options.getNumber('amount') || ""
		
		const user = taggedUser? taggedUser : interaction.user

		if (user.bot) return await interaction.editReply("you can't tag bot 🙂")

		UserController.incrementTotalPoints(amount,user.id)
		
		
		ChannelController.getChannel(interaction.client,CHANNEL_GENERAL).send(
			interaction.client,
			PointMessage.successAddPoint(user,message,amount),
			user.id
		)
		await interaction.editReply(`add ${amount} point to ${user}`)
	},
};