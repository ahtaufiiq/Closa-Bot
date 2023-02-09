const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v9');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const ChannelController = require('../controllers/ChannelController');
const UserController = require('../controllers/UserController');
const GenerateImage = require('../helpers/GenerateImage');
const InfoUser = require('../helpers/InfoUser');
const supabase = require('../helpers/supabaseClient');
const PointMessage = require('../views/PointMessage');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('achievement')
		.setDescription('Your achievements on passion projects'),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true});
		const files = []

		const dataUser = await supabase.from("Users")
			.select('longestStreak')
			.eq('id',interaction.user.id)
			.single()
		const {longestStreak} = dataUser.body

		if(longestStreak < 7){
			await interaction.editReply(`You don't have any achievements yet.
Keep your streak earn the badge.`)
		}else {
			if(longestStreak >= 7){
				const buffer = await GenerateImage.streakBadge(7,interaction.user)
				const attachment = new MessageAttachment(buffer,`streak_badge_${interaction.user.username}.png`)
				files.push(attachment)
			}
			if(longestStreak >= 30){
				const buffer = await GenerateImage.streakBadge(30,interaction.user)
				const attachment = new MessageAttachment(buffer,`streak_badge_${interaction.user.username}.png`)
				files.push(attachment)
			}
			if(longestStreak >= 100){
				const buffer = await GenerateImage.streakBadge(100,interaction.user)
				const attachment = new MessageAttachment(buffer,`streak_badge_${interaction.user.username}.png`)
				files.push(attachment)
			}
			
			await interaction.editReply({
				content:`**🏅 Here's your achievements badge:**
Feel free to share & tag us at \`\`@beclosa\`\`to get featured & celebrate together 🎉`,
				files
			})
		}
		
	},
};