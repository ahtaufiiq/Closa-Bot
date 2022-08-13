const { SlashCommandBuilder } = require('@discordjs/builders');
const RequestAxios = require('../helpers/axios');
const { GUILD_ID, CHANNEL_TODO, CHANNEL_HIGHLIGHT } = require('../helpers/config');
const supabase = require('../helpers/supabaseClient');
const FocusSessionMessage = require('../views/FocusSessionMessage');
const schedule = require('node-schedule');
const Time = require('../helpers/time');
const HighlightReminderMessage = require('../views/HighlightReminderMessage');
const TodoReminderMessage = require('../views/TodoReminderMessage');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('remind')
		.setDescription('set custom reminder')
		
		.addSubcommand(subcommand =>
			subcommand
				.setName('highlight')
				.setDescription('set custom reminder for highlight')
				.addStringOption(option => option.setName('at').setDescription('07.30').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('progress')
				.setDescription('set custom reminder for progress')
				.addStringOption(option => option.setName('at').setDescription('21.00').setRequired(true))),
	async execute(interaction) {
        
		const userId = interaction.user.id
		const patternTime = /\d+[.:]\d+/
		const command = interaction.options.getSubcommand()

		const time = interaction.options.getString('at')
		if (!patternTime.test(time)) {
			if (command === 'highlight') {
				await interaction.reply(`Incorrect format, try:
/remind highlight 06.30
(for example) - use 24h format`)	
}else if(command === 'progress'){
				await interaction.reply(`Incorrect format, try:
/remind progress 21.00
(for example) - use 24h format`)	
			}
			return 		
		}
		const {data} = await supabase.from("Users")
			.select()
			.eq('id',userId)
			.single()
		switch (command) {
			case 'highlight':

				if (data.reminder_highlight !== time) {
					supabase.from("Users")
						.update({reminder_highlight:time})
						.eq('id',userId)
						.single()
						.then(async ({data:user})=>{
							const [hours,minutes] = user.reminder_highlight.split(/[.:]/)
							let ruleReminderHighlight = new schedule.RecurrenceRule();
							ruleReminderHighlight.hour = Time.minus7Hours(hours)
							ruleReminderHighlight.minute = minutes
							const scheduleReminderHighlight = schedule.scheduleJob(ruleReminderHighlight,function(){
								supabase.from('Users')
								.select()
								.eq('id',user.id)
								.single()
								.then(async ({data})=>{
									if (data) {
										if (user.reminder_highlight !== data.reminder_highlight) {
											scheduleReminderHighlight.cancel()
										}else if(data.last_highlight !== Time.getDate().toISOString().substring(0,10)){
											const userId = data.id;
											const notificationThread = await ChannelController.getNotificationThread(client,data.id,data.notification_id)
											notificationThread.send(HighlightReminderMessage.highlightReminder(userId))
										}
									}
								})
							
							})
						})
				}
				
				await interaction.reply(`You are set ${interaction.user}! I will remind you to write <#${CHANNEL_HIGHLIGHT}> at ${time} every day.`)			

				break;
			case 'progress':
				if (data.reminder_highlight !== time) {
					supabase.from("Users")
						.update({reminder_progress:time})
						.eq('id',userId)
						.single()
						.then(async ({data:user})=>{
							const [hours,minutes] = user.reminder_progress.split(/[.:]/)
							let ruleReminderProgress = new schedule.RecurrenceRule();
							ruleReminderProgress.hour = Time.minus7Hours(hours)
							ruleReminderProgress.minute = minutes
							const scheduleReminderProgress = schedule.scheduleJob(ruleReminderProgress,function(){
								supabase.from('Users')
								.select()
								.eq('id',user.id)
								.single()
								.then(async ({data})=>{
									if (data) {
										if (user.reminder_progress !== data.reminder_progress) {
											scheduleReminderProgress.cancel()
										}else if (data.last_done !== Time.getDate().toISOString().substring(0,10)) {
											const userId = data.id;
											const notificationThread = await ChannelController.getNotificationThread(client,data.id,data.notification_id)
											notificationThread.send(TodoReminderMessage.progressReminder(userId))
										}
									}
								})
							
							})
						})

				}
					await interaction.reply(`You are set ${interaction.user}! I will remind you to write <#${CHANNEL_TODO}> at ${time} every day.`)			
				break;
			default:
				break;
		}
	},
};