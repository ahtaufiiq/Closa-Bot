const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v9');
const BoostController = require('../controllers/BoostController');
const ChannelController = require('../controllers/ChannelController');
const DailyReport = require('../controllers/DailyReport');
const GuidelineInfoController = require('../controllers/GuidelineInfoController');
const MemberController = require('../controllers/MemberController');
const PartyController = require('../controllers/PartyController');
const PointController = require('../controllers/PointController');
const RecurringMeetupController = require('../controllers/RecurringMeetupController');
const { CHANNEL_PAYMENT, ROLE_MEMBER, ROLE_NEW_MEMBER } = require('../helpers/config');
const Email = require('../helpers/Email');
const FormatString = require('../helpers/formatString');
const MessageFormatting = require('../helpers/MessageFormatting');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const BoostMessage = require('../views/BoostMessage');
const PaymentMessage = require('../views/PaymentMessage');
const RecurringMeetupMessage = require('../views/RecurringMeetupMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('generate')
		.setDescription('Generate')
		.addSubcommand(subcommand =>
			subcommand
				.setName('guideline')
				.setDescription('send guideline to notification')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('all_party')
				.setDescription('generate all party room')
				.addStringOption(option => option.setName('cohort').setDescription('cohort').setRequired(true)))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const command = interaction.options.getSubcommand()
		await interaction.deferReply({ephemeral:true});

		if(command === 'guideline'){
			const user = interaction.options.getUser('user')
			await GuidelineInfoController.generateGuideline(interaction.client,user.id)
	
			interaction.editReply('success send guideline to user')
		}else{
			const cohort = interaction.options.getString('cohort')
			await PartyController.generatePartyRoom(client,cohort)
			interaction.editReply('success generate all party room')
		}
		
	},
};