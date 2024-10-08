const { AttachmentBuilder,SlashCommandBuilder } = require('discord.js');
const { GUILD_ID, CHANNEL_GOALS, CHANNEL_STREAK, CHANNEL_GENERAL, CHANNEL_COMMAND } = require('../helpers/config');
const GenerateImage = require('../helpers/GenerateImage');
const InfoUser = require('../helpers/InfoUser');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const DailyStreakController = require('../controllers/DailyStreakController');
const DailyStreakMessage = require('../views/DailyStreakMessage');
const ChannelController = require('../controllers/ChannelController');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tracker')
		.setDescription('check your habit of current goal')
		.addUserOption(option => option.setName('user').setDescription('The user')),
	async execute(interaction) {
		const channelId = interaction.channel.id
		if(channelId === CHANNEL_STREAK || channelId === CHANNEL_GENERAL || channelId === CHANNEL_COMMAND) await interaction.deferReply();
		else await interaction.deferReply({ephemeral:true})
		
		const taggedUser = interaction.options.getUser('user')
		
		
		const user = taggedUser? taggedUser : interaction.user

		if (user.bot) return await interaction.editReply("you can't tag bot 🙂")
		const {data} = await supabase.from("Users")
			.select('goalId,lastDone,lastSafety,currentStreak,longestStreak,totalDay,totalPoint')
			.eq('id',user.id)
			.single()

		let goalName = ''
	
		if (data?.goalId) {
			const thread = await ChannelController.getGoalThread(interaction.client,data.goalId)
			goalName = thread.name.split(' by')[0]
		}
		if(data){
			const embeds = [DailyStreakMessage.dailyStreak(data.currentStreak,user,data.longestStreak)]
			const files = await DailyStreakController.generateHabitBuilder(interaction.client,user)
			await interaction.editReply({
				files,
				embeds
			})
		}
	},
};