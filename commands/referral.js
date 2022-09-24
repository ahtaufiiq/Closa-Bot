const { SlashCommandBuilder } = require('@discordjs/builders');
const ReferralCodeController = require('../controllers/ReferralCodeController');
const RequestAxios = require('../helpers/axios');
const { GUILD_ID } = require('../helpers/config');
const FocusSessionMessage = require('../views/FocusSessionMessage');
const ReferralCodeMessage = require('../views/ReferralCodeMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('referral')
		.setDescription('Check your referral code status'),
	async execute(interaction) {
		const userId = interaction.user.id
		await interaction.deferReply({ephemeral:true});
		const dataReferral = await ReferralCodeController.getReferrals(userId)
		if (dataReferral) {
			if (dataReferral.allReferralAlreadyBeenRedeemed) {
				await interaction.editReply(ReferralCodeMessage.allReferralAlreadyBeenRedeemed())
			}else{
				const totalDaysThisCohort = await ReferralCodeController.getTotalDaysThisCohort(userId)
				await interaction.editReply(ReferralCodeMessage.showReferralCode(userId,dataReferral.referralCode,dataReferral.expired,totalDaysThisCohort))
				ReferralCodeController.updateIsClaimed(userId)
			}
		}else{
			await interaction.editReply(ReferralCodeMessage.dontHaveReferralCode())
		}
	},
};