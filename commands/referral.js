const { SlashCommandBuilder } = require('discord.js');
const ReferralCodeController = require('../controllers/ReferralCodeController');
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
				const totalDays = await ReferralCodeController.getTotalDays(userId)
				await interaction.editReply(ReferralCodeMessage.showReferralCode(userId,dataReferral.referralCode,dataReferral.expired,totalDays))
				ReferralCodeController.updateIsClaimed(userId)
			}
		}else{
			await interaction.editReply(ReferralCodeMessage.dontHaveReferralCode())
		}
	},
};