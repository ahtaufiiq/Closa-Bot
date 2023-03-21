const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v9');
const BoostController = require('../controllers/BoostController');
const ChannelController = require('../controllers/ChannelController');
const DailyReport = require('../controllers/DailyReport');
const DailyStreakController = require('../controllers/DailyStreakController');
const GuidelineInfoController = require('../controllers/GuidelineInfoController');
const MemberController = require('../controllers/MemberController');
const PartyController = require('../controllers/PartyController');
const PointController = require('../controllers/PointController');
const RecurringMeetupController = require('../controllers/RecurringMeetupController');
const UserController = require('../controllers/UserController');
const { CHANNEL_PAYMENT, ROLE_MEMBER, ROLE_NEW_MEMBER } = require('../helpers/config');
const Email = require('../helpers/Email');
const FormatString = require('../helpers/formatString');
const MessageFormatting = require('../helpers/MessageFormatting');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const BoostMessage = require('../views/BoostMessage');
const DailyStreakMessage = require('../views/DailyStreakMessage');
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
		.addSubcommand(subcommand =>
			subcommand
				.setName('repair')
				.setDescription('send repair streak')
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true)))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const command = interaction.options.getSubcommand()
		await interaction.deferReply({ephemeral:true});

		if(command === 'guideline'){
			const user = interaction.options.getUser('user')
			await GuidelineInfoController.generateGuideline(interaction.client,user.id)
	
			interaction.editReply('success send guideline to user')
		}else if(command === 'all_party'){
			const cohort = interaction.options.getString('cohort')
			await PartyController.generatePartyRoom(interaction.client,cohort)
			interaction.editReply('success generate all party')
		}else if(command === 'repair'){
			const user = interaction.options.getUser('user')
			const data = await UserController.getDetail(user.id,'notificationId,currentStreak')
			const {notificationId,currentStreak} = data.body
			const isValidGetRepairStreak = await DailyStreakController.isValidGetRepairStreak(user.id)
			if(isValidGetRepairStreak){
				const msg = await ChannelController.sendToNotification(
					interaction.client,
					DailyStreakMessage.repairStreak(currentStreak,user.id,DailyStreakController.getTimeLeftRepairStreak(Time.getTodayDateOnly())),
					user.id,
					notificationId
				)
				DailyStreakController.countdownRepairStreak(msg)
				DailyStreakController.insertRepairStreak(user.id,msg.id)
			}
		}
		
	},
};