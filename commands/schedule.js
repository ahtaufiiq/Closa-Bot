const { SlashCommandBuilder } = require('discord.js');
const RecurringMeetupController = require('../controllers/RecurringMeetupController');
const FormatString = require('../helpers/formatString');
const MessageFormatting = require('../helpers/MessageFormatting');
const Time = require('../helpers/time');
const RecurringMeetupMessage = require('../views/RecurringMeetupMessage');
const PartyController = require('../controllers/PartyController');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('schedule')
		.setDescription('Schedule your party coworking time')
		.addStringOption(option => option.setName('time').setDescription('07.30').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		const time = Time.getTimeFromText(modal.getTextInputValue('time'));
		const patternTime = /\d+[.:]\d+/
		if (!patternTime.test(time)) {
			return await interaction.editReply(`Incorrect format, please make sure there is no typo or invalid date & time.

The correct format:
\`\`/schedule meetup month date at time\`\``)

		}

		const [hours,minutes] = time.split(/[.:]/)
		
		// const meetupDate = Time.getDate()
		// meetupDate.setDate(date)
		// if (monthInNumber < meetupDate.getMonth()) meetupDate.setFullYear(meetupDate.getFullYear()+1)
		// meetupDate.setMonth(monthInNumber)
		// meetupDate.setHours(Time.minus7Hours(hours,false))
		// meetupDate.setMinutes(minutes)
		
		const partyId = modal.channel.name.split(' ')[1]
		PartyController.updateCoworkingTime(partyId,time)
		// RecurringMeetupController.scheduleMeetup(modal.client,meetupDate,modal.channelId,partyId)
		await modal.editReply(`${MessageFormatting.tagUser(modal.user.id)} just set the new default coworking time at **${time} every day** ✅`)
	},
};