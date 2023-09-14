const { SlashCommandBuilder } = require('discord.js');
const { CHANNEL_TODO, CHANNEL_HIGHLIGHT, TIMEZONE } = require('../helpers/config');
const supabase = require('../helpers/supabaseClient');
const schedule = require('node-schedule');
const Time = require('../helpers/time');
const HighlightReminderMessage = require('../views/HighlightReminderMessage');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const ChannelController = require('../controllers/ChannelController');
const MessageComponent = require('../helpers/MessageComponent');
const ReminderController = require('../controllers/ReminderController');
const UsageController = require('../controllers/UsageController');
const UsageMessage = require('../views/UsageMessage');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('remind')
		.setDescription('reminder about your task of the day')
		.addSubcommand(subcommand =>
			subcommand
				.setName('me')
				.setDescription('reminder about your task of the day')
				.addStringOption(option => option.setName('message').setDescription('Design Exploration').setRequired(true))
				.addStringOption(option => option.setName('at').setDescription('07.30').setRequired(true))),
	async execute(interaction) {
        
		const userId = interaction.user.id
		const patternTime = /\d+[.:]\d+/
		const command = interaction.options.getSubcommand()

		const message = interaction.options.getString('message')
		const time = interaction.options.getString('at')
		if (!patternTime.test(time)) {
			if (command === 'me') {
				await interaction.reply(`Incorrect format, try:
/remind me 06.30
(for example) - use 24h format`)	
}
			return 		
		}
		const {data} = await supabase.from("Users")
			.select()
			.eq('id',userId)
			.single()

		const [hours,minutes] = time.split(/[.: ]/)
		switch (command) {
			case 'me':
				await interaction.deferReply({ephemeral:true})
				const isProUser = await UsageController.isProUser(interaction.user.id)
				if(isProUser){
					const differentTime = time.toLowerCase().includes(' wita') ? 1 : time.toLowerCase().includes(' wit') ? 2 : 0
					const date = Time.getDate()
					date.setHours(Number(hours) - differentTime,minutes)
					const isMoreThanTenMinutes = Time.getDiffTime(Time.getDate(),date) > 10
					if(isMoreThanTenMinutes) date.setMinutes(date.getMinutes()-10)
					
					date.setHours(date.getHours() - TIMEZONE)
					supabase.from('Reminders')
						.insert({
							message:`${message} at ${time}`,
							time:date,
							UserId:interaction.user.id,
						})
						.then()
	
					schedule.scheduleJob(date,async function () {
						ChannelController.sendToNotification(
							interaction.client,
							HighlightReminderMessage.remindHighlightUser(interaction.user.id,`${message} at ${time}`),
							interaction.user.id,
							data.notificationId
						)
					})
					
					await interaction.editReply({
						content:`Reminder set: \`\`${message} at ${time}\`\` ${interaction.user}
	
${isMoreThanTenMinutes ? "**i'll remind you 10 minutes before the schedule**" : ''}`
					})			

				}else{
					await interaction.editReply(UsageMessage.notEligibleUseCustomReminder())
				}
				break;
			default:
				break;
		}
	},
};