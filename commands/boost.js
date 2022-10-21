const { SlashCommandBuilder } = require('@discordjs/builders');
const BoostController = require('../controllers/BoostController');
const ChannelController = require('../controllers/ChannelController');
const DailyReport = require('../controllers/DailyReport');
const PointController = require('../controllers/PointController');
const BoostMessage = require('../views/BoostMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('boost')
		.setDescription('send good vibes & show support 🚀')
		.addUserOption(option => option.setName('user').setDescription('The user').setRequired(true))
		.addStringOption(option => option.setName('message').setDescription("Your message to user")),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true});
		const taggedUser = interaction.options.getUser('user')
		const message = interaction.options.getString('message') || ""
		
		
		const user = taggedUser? taggedUser : interaction.user

		if (user.bot) return await interaction.editReply("you can't tag bot 🙂")
		if (user.id === interaction.user.id) {
			await interaction.editReply(BoostMessage.warningBoostYourself())
			return	
		}
		PointController.addPoint(interaction.user.id,'boost')
		DailyReport.activeMember(interaction.client,interaction.user.id)
		PointController.incrementTotalPoints(5,interaction.user.id)
		const notificationThread = await ChannelController.getNotificationThread(interaction.client,user.id)
		const totalBoost = await BoostController.incrementTotalBoost(interaction.user.id,user.id)
		notificationThread.send(BoostMessage.sendBoost(user,interaction.user,totalBoost,message))

		await interaction.editReply(BoostMessage.successSendMessage(user))
	},
};