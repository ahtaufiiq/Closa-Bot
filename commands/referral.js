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
				await interaction.editReply(ReferralCodeMessage.showReferralCode(userId,dataReferral.referralCode))
				ReferralCodeController.updateIsClaimed(userId)
			}
		}else{
			await interaction.editReply(ReferralCodeMessage.dontHaveReferralCode())
		}
	},
};