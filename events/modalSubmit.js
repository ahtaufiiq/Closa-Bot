const ChannelController = require("../controllers/ChannelController");
const MemberController = require("../controllers/MemberController");
const MembershipController = require("../controllers/MembershipController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const { ROLE_NEW_MEMBER } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const ReferralCodeMessage = require("../views/ReferralCodeMessage");

module.exports = {
	name: 'modalSubmit',
	async execute(modal) {
		await modal.deferReply({ephemeral:true});

		if (modal.customId === 'modalReferral') {
			const referralCode = modal.getTextInputValue('referral');
			const response = await ReferralCodeController.validateReferral(referralCode)
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
						const {user} = await MemberController.getMember(modal.client,response.ownedBy)
						notificationThread.send(ReferralCodeMessage.successRedeemYourReferral(referralCode,date,user))
					})
				
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

