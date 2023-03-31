const { SlashCommandBuilder } = require('discord.js');
const RecurringMeetupController = require('../controllers/RecurringMeetupController');
const FormatString = require('../helpers/formatString');
const MessageFormatting = require('../helpers/MessageFormatting');
const Time = require('../helpers/time');
const RecurringMeetupMessage = require('../views/RecurringMeetupMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('schedule')
		.setDescription('Schedule your party meetup')
		.addStringOption(option => option.setName('meetup').setDescription('October 29').setRequired(true))
		.addStringOption(option => option.setName('at').setDescription('07.30').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		const meetup = interaction.options.getString('meetup')
		const time = interaction.options.getString('at')
		const [month,date] = meetup.split(' ')
		const monthInNumber = Time.convertMonthInNumber(month)
		const patternTime = /\d+[.:]\d+/
		if (!patternTime.test(time) || monthInNumber === -1 || !FormatString.isNumber(date)) {
			return await interaction.editReply(`Incorrect format, please make sure there is no typo or invalid date & time.

The correct format:
\`\`/schedule meetup month date at time\`\``)

		}

		const [hours,minutes] = time.split(/[.:]/)

		const meetupDate = Time.getDate()
		meetupDate.setDate(date)
		if (monthInNumber < meetupDate.getMonth()) meetupDate.setFullYear(meetupDate.getFullYear()+1)
		meetupDate.setMonth(monthInNumber)
		meetupDate.setHours(Time.minus7Hours(hours))
		meetupDate.setMinutes(minutes)

		if(!RecurringMeetupController.isDateBeforeCelebrationDay(meetupDate)){
			interaction.editReply(RecurringMeetupMessage.cannotSetMeetupAfterCelebrationDay())
			return
		}

		const partyId = interaction.channel.name.split(' ')[1]
		RecurringMeetupController.scheduleMeetup(interaction.client,meetupDate,interaction.channelId,partyId)

		await interaction.editReply(`${MessageFormatting.tagUser(interaction.user.id)} just set the meetup schedule on \`\`${Time.getFormattedDate(meetupDate)} at ${time}\`\`✅`)
	},
};