const ChannelController = require("../controllers/ChannelController");
const MemberController = require("../controllers/MemberController");
const MembershipController = require("../controllers/MembershipController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const { ROLE_NEW_MEMBER, CHANNEL_WELCOME } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const ReferralCodeMessage = require("../views/ReferralCodeMessage");

module.exports = {
	name: 'modalSubmit',
	async execute(modal) {
		await modal.deferReply({ephemeral:true});

		if (modal.customId === 'modalReferral') {
			const referralCode = modal.getTextInputValue('referral');
			const [isEligibleToRedeemRederral,isFirstTimeRedeemReferral,response] = await Promise.all([
				ReferralCodeController.isEligibleToRedeemRederral(modal.user.id),
				ReferralCodeController.isFirstTimeRedeemReferral(modal.user.id),
				ReferralCodeController.validateReferral(referralCode)
			])

			if (response.ownedBy === modal.user.id) {
				await modal.editReply(ReferralCodeMessage.cannotRedeemOwnCode());
				return
			}else if(!isEligibleToRedeemRederral){
				await modal.editReply(ReferralCodeMessage.cannotRedeemByExistingMember());
				return
			}else if(!isFirstTimeRedeemReferral){
				await modal.editReply(ReferralCodeMessage.cannotRedeemMoreThanOne());
				return
			}
			if (response.valid) {
				supabase.from("Referrals")
						.update({isRedeemed:true,redeemedBy:modal.user.id})
						.eq('referralCode',referralCode)
						.then()
				MemberController.addRole(modal.client,modal.user.id,ROLE_NEW_MEMBER)
				await modal.editReply(ReferralCodeMessage.replySuccessRedeem());
					
				MembershipController.updateMembership(1,modal.user.id)
					.then(async date=>{
						const notificationThread = await ChannelController.getNotificationThread(modal.client,modal.user.id)
						notificationThread.send(ReferralCodeMessage.successRedeemReferral(date))
					})
				MembershipController.updateMembership(1,response.ownedBy)
					.then(async date=>{
						const notificationThread = await ChannelController.getNotificationThread(modal.client,response.ownedBy)
						notificationThread.send(ReferralCodeMessage.successRedeemYourReferral(referralCode,date,modal.user))
					})
				const channelConfirmation = ChannelController.getChannel(modal.client,CHANNEL_WELCOME)
				channelConfirmation.send(ReferralCodeMessage.notifSuccessRedeem(modal.user.id,response.ownedBy))
				
			}else{
				switch (response.description) {
					case "expired":
						await modal.editReply(ReferralCodeMessage.replyExpiredCode());
						
						break;
					case "redeemed":
						await modal.editReply(ReferralCodeMessage.replyAlreadyRedeemedCode());
						break;
					default:
						await modal.editReply(ReferralCodeMessage.replyInvalidReferralCode());
						break;
				}
				
			}
			
		}
	},
};

