const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const AdvanceReportController = require('../controllers/AdvanceReportController');
const AdvanceReportMessage = require('../views/AdvanceReportMessage');
const GenerateImage = require('../helpers/GenerateImage');
const AdvanceReportHelper = require('../helpers/AdvanceReportHelper');
const UsageController = require('../controllers/UsageController');
const UsageMessage = require('../views/UsageMessage');

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
					{ name: AdvanceReportHelper.getWeekDateRange(-2), value: '-2' },
					{ name: AdvanceReportHelper.getWeekDateRange(-3), value: '-3' }
				))),
	async execute(interaction) {
		const week = interaction.options.getString('date') || 0
		const dateRange = AdvanceReportHelper.getWeekDateRange(week)
		const [isProUser,weeklyReport] = await Promise.all([
			UsageController.isProUser(interaction.user.id),
			AdvanceReportController.getDataWeeklyReport(interaction.user.id,dateRange)
		])
		if (isProUser) {
			if(weeklyReport){
				await interaction.deferReply();
				const bufferImage = await GenerateImage.advanceCoworkingReport(interaction.user,weeklyReport,dateRange)
				const weeklyReportFiles = [new AttachmentBuilder(bufferImage,{name:`advance_report_${interaction.user.username}.png`})]
				await interaction.editReply(AdvanceReportMessage.onlyReport(interaction.user.id,weeklyReportFiles,dateRange))
			}else{
				await interaction.deferReply({ephemeral:true});
				interaction.editReply(AdvanceReportMessage.emptyReport(week,interaction.user.id))
			}
		}else{
			interaction.reply(UsageMessage.notEligibleGenerateAdvanceReport())
		}
	},
};