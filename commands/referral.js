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
			await interaction.editReply(ReferralCodeMessage.showReferralCode(userId,dataReferral.referralCode,dataReferral.expired))
			ReferralCodeController.updateIsClaimed(userId)
		}else{
			await interaction.editReply(ReferralCodeMessage.dontHaveReferralCode())
		}
	},
};