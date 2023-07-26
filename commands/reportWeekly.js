const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const SickDayController = require('../controllers/SickDayController');
const AdvanceReportController = require('../controllers/AdvanceReportController');
const AdvanceReportMessage = require('../views/AdvanceReportMessage');
const GenerateImage = require('../helpers/GenerateImage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('report')
		.setDescription(`View this week productivity report`)
		.addSubcommand(subcommand =>
			subcommand
				.setName('weekly')
				.setDescription(`View this week productivity report`)
				.addStringOption(option=> option.setName('date').setDescription('Search your productivity report in the past').addChoices(
					{ name: 'this week', value: '0' },
					{ name: 'last week', value: '-1' },
					{ name: AdvanceReportController.getWeekDateRange(-2), value: '-2' },
					{ name: AdvanceReportController.getWeekDateRange(-3), value: '-3' }
				))),
	async execute(interaction) {
		await interaction.deferReply();
		const week = interaction.options.getString('date') || 0
		const dateRange = AdvanceReportController.getWeekDateRange(week)
		const weeklyReport = await AdvanceReportController.getDataWeeklyReport(interaction.user.id,dateRange)
		if(weeklyReport){
			const bufferImage = await GenerateImage.advanceCoworkingReport(interaction.user,weeklyReport)
			const weeklyReportFiles = [new AttachmentBuilder(bufferImage,{name:`advance_report_${interaction.user.username}.png`})]
			await interaction.editReply(AdvanceReportMessage.onlyReport(interaction.user.id,weeklyReportFiles,dateRange))
		}else{
			interaction.editReply(AdvanceReportMessage.emptyReport(week,interaction.user.id))
		}
	},
};