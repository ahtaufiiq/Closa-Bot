const { SlashCommandBuilder } = require('discord.js');
const { CHANNEL_TODO, CHANNEL_HIGHLIGHT } = require('../helpers/config');
const supabase = require('../helpers/supabaseClient');
const schedule = require('node-schedule');
const Time = require('../helpers/time');
const HighlightReminderMessage = require('../views/HighlightReminderMessage');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const ChannelController = require('../controllers/ChannelController');
const MessageComponent = require('../helpers/MessageComponent');
const ReminderController = require('../controllers/ReminderController');
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

		const [hours,minutes] = time.split(/[.:]/)
		
		switch (command) {
			case 'highlight':
				if (data.reminderHighlight !== time) {
					ReminderController.setHighlightReminder(interaction.client,time,interaction.user.id)
				}
				
				await interaction.reply({
					content:`You are set ${interaction.user}! I will remind you to write <#${CHANNEL_HIGHLIGHT}> at ${time} every day.`,
					components:[MessageComponent.createComponent(
						HighlightReminderMessage.buttonAddToCalendarSetHighlight(hours,minutes)
					)]
				})			

				break;
			case 'progress':
				if (data.reminderHighlight !== time) {
					supabase.from("Users")
						.update({reminderProgress:time})
						.eq('id',userId)
						.single()
						.then(async ({data:user})=>{
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
										if (user.reminderProgress !== data.reminderProgress) {
											scheduleReminderProgress.cancel()
										}else if (data.lastDone !== Time.getDate().toISOString().substring(0,10)) {
											const {id:userId,notificationId} = data;
											ChannelController.sendToNotification(
												interaction.client,
												TodoReminderMessage.progressReminder(userId),
												userId,
												notificationId
											)
										}
									}
								})
							
							})
						})
				}
					await interaction.reply({
						content:`You are set ${interaction.user}! I will remind you to write <#${CHANNEL_TODO}> at ${time} every day.`,
						components:[MessageComponent.createComponent(
							TodoReminderMessage.buttonAddToCalendarShareProgress(hours,minutes)
						)]
					})			
				break;
			default:
				break;
		}
	},
};