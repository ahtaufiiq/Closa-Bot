const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment } = require('discord.js');
const RequestAxios = require('../helpers/axios');
const { GUILD_ID, CHANNEL_GOALS } = require('../helpers/config');
const GenerateImage = require('../helpers/GenerateImage');
const InfoUser = require('../helpers/InfoUser');
const supabase = require('../helpers/supabaseClient');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tracker')
		.setDescription('check your habit of current goal')
		.addUserOption(option => option.setName('user').setDescription('The user')),
	async execute(interaction) {
		await interaction.deferReply();
		const taggedUser = interaction.options.getUser('user')
		
		
		const user = taggedUser? taggedUser : interaction.user

		if (user.bot) return await interaction.editReply("you can't tag bot 🙂")
		const {data} = await supabase.from("Users")
			.select('goalId,longestStreak,totalDay,totalPoint')
			.eq('id',user.id)
			.single()
		let goalName = ''
	
		if (data?.goalId) {
			const channel = interaction.client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_GOALS)
			const thread = await channel.threads.fetch(data.goalId);
			goalName = thread.name.split('by')[0]
		}
		if(data){
			RequestAxios.get('todos/tracker/'+user.id)
			.then(async progressRecently=>{
				progressRecently.map(todo=>{
					todo.date = new Date(todo.createdAt).getDate()
				})
				
				const avatarUrl = InfoUser.getAvatar(user)
				const buffer = await GenerateImage.tracker(user.username,goalName||"Consistency",avatarUrl,progressRecently,data.longestStreak,data.totalDay,data.totalPoint)
				const attachment = new MessageAttachment(buffer,`progress_tracker_${user.username}.png`)
				await interaction.editReply({
					files:[
						attachment
					]
				})
			})

		}

				
	},
};