const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v9');
const BoostController = require('../controllers/BoostController');
const ChannelController = require('../controllers/ChannelController');
const DailyReport = require('../controllers/DailyReport');
const MemberController = require('../controllers/MemberController');
const PointController = require('../controllers/PointController');
const RecurringMeetupController = require('../controllers/RecurringMeetupController');
const { CHANNEL_PAYMENT, ROLE_MEMBER, ROLE_NEW_MEMBER } = require('../helpers/config');
const Email = require('../helpers/Email');
const FormatString = require('../helpers/formatString');
const MessageFormatting = require('../helpers/MessageFormatting');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const BoostMessage = require('../views/BoostMessage');
const RecurringMeetupMessage = require('../views/RecurringMeetupMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('extend')
		.setDescription('Extend Membership')
		.addUserOption(option => option.setName('user').setDescription('user').setRequired(true))
		.addStringOption(option => option.setName('date').setDescription('1 Jan 2023').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const user = interaction.options.getUser('user')
		const dateString = interaction.options.getString('date')
		const date = Time.getDate(dateString)
		const endMembership =Time.getDateOnly(date)
		const formattedDate = Time.getFormattedDate(date,false,'long')

		await interaction.deferReply();

		try {
			await interaction.editReply(`✅ Successfully extend membership until ${formattedDate} for ${user}`)
			const threadNotification = await ChannelController.getNotificationThread(interaction.client,user.id)
			await supabase.from("Users")
			.update({endMembership})
			.eq('id',user.id)
			await threadNotification.send(`Your closa membership status active until ${formattedDate}`)
			
			const channelPayment = ChannelController.getChannel(interaction.client,CHANNEL_PAYMENT)
			const msg = await ChannelController.getMessage(channelPayment,interaction.channelId)
			const embed = msg.embeds[0]
			const paymentType = embed.title
			const idPayment = embed.footer.text
			let email = ''
			for (let i = 0; i < embed.fields.length; i++) {
				const {name,value} = embed.fields[i];
				if(name.toLowerCase().includes('email')){
					email = value
					break;
				}
			}	
			supabase.from("Payments")
				.update({UserId:user.id})
				.eq('id',idPayment)
				.then()

			if(paymentType === "Renewal"){
				Email.sendSuccessMembershipRenewal(user.username,email,formattedDate)
				MemberController.addRole(interaction.client,user.id,ROLE_MEMBER)
			}else{
				MemberController.addRole(interaction.client,user.id,ROLE_NEW_MEMBER)
			}
	
		} catch (error) {
			console.log(error);
			MemberController.addRole(interaction.client,user.id,ROLE_NEW_MEMBER)
		}


	},
};