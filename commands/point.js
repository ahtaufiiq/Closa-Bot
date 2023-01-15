const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v9');
const { MessageEmbed } = require('discord.js');
const ChannelController = require('../controllers/ChannelController');
const UserController = require('../controllers/UserController');
const InfoUser = require('../helpers/InfoUser');

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
		
		const avatarUrl = InfoUser.getAvatar(user)
		const notificationThread = await ChannelController.getNotificationThread(interaction.client,user.id)
		notificationThread.send({
			content:`Bonus vibe points for you ${user}!`,
			embeds:[
				new MessageEmbed()
				.setColor("#FEFEFE")
				.setImage("https://media.giphy.com/media/obaVSnvRbtos0l7MBg/giphy.gif")
				.setDescription(message)
				.setAuthor({name:`+${amount} POINTS`.toUpperCase(),iconURL:"https://media.giphy.com/media/QZJ8UcjU5VfFwCIkUN/giphy.gif "})
				.setFooter({text:`${user.username}`, iconURL:avatarUrl})
				
			]
		})

		await interaction.editReply(`add ${amount} point to ${user}`)
	},
};