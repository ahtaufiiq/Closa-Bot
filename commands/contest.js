const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const ChannelController = require('../controllers/ChannelController');
const { CHANNEL_MEMES } = require('../helpers/config');
const getRandomValue = require('../helpers/getRandomValue');
const LocalData = require('../helpers/LocalData');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('contest')
		.setDescription('command meme contest')
		.addSubcommand(subcommand =>
			subcommand
				.setName('start')
				.setDescription('set start meme contest')
				.addStringOption(option => option.setName('message').setDescription("message")))
		.addSubcommand(subcommand =>
			subcommand
				.setName('end')
				.setDescription('set end meme contest')
				.addStringOption(option => option.setName('message').setDescription("message"))),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true});
		const message = interaction.options.getString('message') || ""
		const command = interaction.options.getSubcommand()
		const channel = ChannelController.getChannel(interaction.client,CHANNEL_MEMES)
		const data = LocalData.getData()
		console.log('masuk');
		switch (command) {
			case "start":
				data.isMemeContest = true
				LocalData.writeData(data)

				const startContestGIF = [
					"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDdkZTdhY2I0NGMwMGIzNzI4MDVjNDczODZjZTUyOTUwZGQ2YWNlYSZjdD1n/GWNBoSxSpt7Ik/giphy.gif",
					"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjgzMTgwZjhhZmM0ZTgyY2VlYjI2YWQ0MzdkMzFlNjQ5ZGEyY2E3NCZjdD1n/11sBLVxNs7v6WA/giphy.gif",
					"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExODg1OGZlNjZjN2E5OWNjMzliZWRjNzIwZjU2NzNhYWE3OTVlOTU2NSZjdD1n/K3RobtjwbSjPq/giphy.gif",
					"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExODQzMjJkY2VkZGEzYTk3MmY3NDZiYmQ1MTRiNzVjYWY4MTFhYzdiNSZjdD1n/HRyoCdU2PuAF2/giphy.gif",
				]
				const gifStart = getRandomValue(startContestGIF)
				channel.send({
					content:message,
					embeds:[
						new MessageEmbed()
						.setTitle('MEME CONTEST NOW OPEN 🟢')
						.setColor('#299912')
						.setImage(gifStart)
					]
				})
				interaction.editReply('start meme contest')
				break;
			case "end":
				data.isMemeContest = false
				LocalData.writeData(data)

				const startEndedGIF = [
					"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWQxOTVhMmU4NmY1YTExYzljMDI4ZmQyM2RiYjE4MWZhYTFmMDJiMyZjdD1n/Y0btn5YtZRGNkTnvNx/giphy.gif",
					"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGU1MzkwNmRiODk4NTU5Mzc4YzZiMjU4MzY5OTJkOGE4OTEyMjNjYSZjdD1n/bfWGSGO0XKbxBR3XzH/giphy.gif",
					"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzIwMWJkMzg1NmU0OWNhZDcwYTYwZTk3NmRhNjg1ODRjYjE1ZDJmNCZjdD1n/V2ZrZfHghzSNi/giphy.gif",
					"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjljZjc5ZDU1OGMzY2M5ZGUzNjc4YmQ5MzJhMWRhOGY2Y2Q4MTM0OSZjdD1n/JLtQeoVXD5yKI/giphy.gif",
					"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjk3ZjI0MzJkYjY1NjMzNTAzZmQzMmJhYzVhOTVhMDEzYWM1MWFhMyZjdD1n/2aI0NbmSnKo9R4NgFE/giphy.gif",
				]
				const gifEnded = getRandomValue(startEndedGIF)
				channel.send({
					content:message,
					embeds:[
						new MessageEmbed()
						.setTitle('MEME CONTEST HAS ENDED 🔴')
						.setColor('#cd0a0a')
						.setImage(gifEnded)
					]
				})
				interaction.editReply('end meme contest')
				break;
		}


		
	},
};