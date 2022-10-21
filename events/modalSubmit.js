const ChannelController = require("../controllers/ChannelController");
const MemberController = require("../controllers/MemberController");
const MembershipController = require("../controllers/MembershipController");
const PartyController = require("../controllers/PartyController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const { ROLE_NEW_MEMBER, CHANNEL_WELCOME } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const PartyMessage = require("../views/PartyMessage");
const ReferralCodeMessage = require("../views/ReferralCodeMessage");

module.exports = {
	name: 'modalSubmit',
	async execute(modal) {
		const [commandButton,targetUserId=modal.user.id,value] = modal.customId.split("_")
		if (commandButton === 'modalReferral') {
			await modal.deferReply({ephemeral:true});
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
				Promise.all([
					MembershipController.updateMembership(1,modal.user.id),
					MembershipController.updateMembership(1,response.ownedBy)
				])
				.then(async ([endMembershipNewUser,endMembershipReferrer])=>{
					const notificationThreadNewUser = await ChannelController.getNotificationThread(modal.client,modal.user.id)
					notificationThreadNewUser.send(ReferralCodeMessage.successRedeemReferral(endMembershipNewUser))

					const notificationThreadReferrer = await ChannelController.getNotificationThread(modal.client,response.ownedBy)
					notificationThreadReferrer.send(ReferralCodeMessage.successRedeemYourReferral(referralCode,endMembershipReferrer,modal.user))

					const channelConfirmation = ChannelController.getChannel(modal.client,CHANNEL_WELCOME)
					const referrer = await MemberController.getMember(modal.client,response.ownedBy)

					const [totalMember,totalInvited] = await Promise.all([
						MemberController.getTotalMember(),
						ReferralCodeController.getTotalInvited(response.ownedBy)
					])
					channelConfirmation.send(ReferralCodeMessage.notifSuccessRedeem(modal.user,referrer.user,totalMember,totalInvited))
					MemberController.addRole(modal.client,modal.user.id,ROLE_NEW_MEMBER)
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
			
		}else if(commandButton === "writeGoal"){
			const deadlineGoal = PartyController.getDeadlineGoal()
			const [type,role,goalCategory] = value.split('-')
			const project = modal.getTextInputValue('project');
			const goal = modal.getTextInputValue('goal');
			const about = modal.getTextInputValue('about');
			const shareProgressAt = modal.getTextInputValue('shareProgressAt');

			await modal.deferReply()
			await modal.editReply(PartyMessage.reviewYourGoal({
				project,
				goal,
				about,
				shareProgressAt,
				role,
				value,
				user:modal.user,
				deadlineGoal:deadlineGoal
			}))
			modal.message.delete()
		}else if(commandButton === "editGoal"){
			const deadlineGoal = PartyController.getDeadlineGoal()
			const role = value.split('-')[1]
			const project = modal.getTextInputValue('project');
			const goal = modal.getTextInputValue('goal');
			const about = modal.getTextInputValue('about');
			const shareProgressAt = modal.getTextInputValue('shareProgressAt');
			await modal.deferReply()
			await modal.editReply(PartyMessage.reviewYourGoal({
				project,
				goal,
				about,
				shareProgressAt,
				role,
				value,
				user:modal.user,
				deadlineGoal:deadlineGoal,
			}))
			modal.message.delete()
		}
	},
};

