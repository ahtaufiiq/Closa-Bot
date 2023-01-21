const ChannelController = require("../controllers/ChannelController");
const GoalController = require("../controllers/GoalController");
const MemberController = require("../controllers/MemberController");
const MembershipController = require("../controllers/MembershipController");
const PartyController = require("../controllers/PartyController");
const RecurringMeetupController = require("../controllers/RecurringMeetupController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const TestimonialController = require("../controllers/TestimonialController");
const VacationController = require("../controllers/VacationController");
const { ROLE_NEW_MEMBER, CHANNEL_WELCOME, CHANNEL_TESTIMONIAL, CHANNEL_REFLECTION } = require("../helpers/config");
const FormatString = require("../helpers/formatString");
const MessageFormatting = require("../helpers/MessageFormatting");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const GoalMessage = require("../views/GoalMessage");
const PartyMessage = require("../views/PartyMessage");
const RecurringMeetupMessage = require("../views/RecurringMeetupMessage");
const ReferralCodeMessage = require("../views/ReferralCodeMessage");
const TestimonialMessage = require("../views/TestimonialMessage");
const WeeklyReflectionMessage = require("../views/WeeklyReflectionMessage");

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
			const [accountabilityMode,role,goalCategory] = value.split('-')
			const project = modal.getTextInputValue('project');
			const goal = modal.getTextInputValue('goal');
			const about = modal.getTextInputValue('about');
			const shareProgressAt = modal.getTextInputValue('shareProgressAt');

			await modal.deferReply()

			await GoalController.interactionPostGoal(modal,{
				goal,about,project,shareProgressAt,accountabilityMode,role,goalCategory
			})
			ChannelController.deleteMessage(modal.message)
		}else if(commandButton === "editGoal"){
			const deadlineGoal = GoalController.getDeadlineGoal()
			const role = value.split('-')[1]
			const project = modal.getTextInputValue('project');
			const goal = modal.getTextInputValue('goal');
			const about = modal.getTextInputValue('about');
			const shareProgressAt = Time.getTimeFromText(modal.getTextInputValue('shareProgressAt'))
			await modal.deferReply({ephemeral:true})
			await modal.message.edit(GoalMessage.postGoal({
				project,goal,about,shareProgressAt,role,user:modal.user,deadlineGoal,value
			}))
			GoalController.updateDataGoal({
				id:modal.message.id,
				project,goal,about,shareProgressAt
			})
			await modal.editReply(`${modal.user} edited the goal`)
		}else if(commandButton === "useTicketCustomDate"){
			await modal.deferReply({ephemeral:true})
			
			const totalTicket = modal.customId.split("_")[2]
			const customDate = modal.getTextInputValue('customDate');
			
			// handle format: 18 Decemember and December 18
			const date = customDate.match(/(\d+)/)[0]
			const month = customDate.split(date).filter(Boolean)[0]

			const monthInNumber = Time.convertMonthInNumber(month)
			if (monthInNumber === -1 || !FormatString.isNumber(date)) {
				return await modal.editReply(`Incorrect format, please make sure there is no typo or invalid date.
	
The correct format:
\`\`December 29\`\``)
			}else{
				const vacationDate = Time.getDate()
				vacationDate.setDate(date)
				if (monthInNumber < vacationDate.getMonth()) vacationDate.setFullYear(vacationDate.getFullYear()+1)
				vacationDate.setMonth(monthInNumber)
				vacationDate.setHours(8)
				vacationDate.setMinutes(0)
				const dateOnly = Time.getDateOnly(vacationDate)
				await VacationController.interactionBuyTicketViaShop(modal,Number(totalTicket),dateOnly)
			}

		}else if(commandButton === "rescheduleMeetup"){
			await modal.deferReply()
			
			const customDate = modal.getTextInputValue('date');
			const time = modal.getTextInputValue('time');
			
			// handle format: 18 Decemember and December 18
			const date = customDate.match(/(\d+)/)[0]
			const month = customDate.split(date).filter(Boolean)[0]
			const monthInNumber = Time.convertMonthInNumber(month)
			
			const patternTime = /\d+[.:]\d+/
			if (!patternTime.test(time) || monthInNumber === -1 || !FormatString.isNumber(date)) {
				return await modal.editReply(`Incorrect format, please make sure there is no typo or invalid date & time.
	
The correct format:
\`\`/schedule meetup month date at time\`\``)
	
			}
	
			const [hours,minutes] = time.split(/[.:]/)
	
			const meetupDate = Time.getDate()
			meetupDate.setDate(date)
			if (monthInNumber < meetupDate.getMonth()) meetupDate.setFullYear(meetupDate.getFullYear()+1)
			meetupDate.setMonth(monthInNumber)
			meetupDate.setHours(Time.minus7Hours(hours))
			meetupDate.setMinutes(minutes)
	
			const partyId = modal.channel.name.split(' ')[1]
			RecurringMeetupController.scheduleMeetup(modal.client,meetupDate,modal.channelId,partyId)
			await modal.editReply(`${MessageFormatting.tagUser(modal.user.id)} just set the meetup schedule on \`\`${Time.getFormattedDate(meetupDate)} at ${time}\`\`✅`)

		}else if(commandButton === "submitTestimonial"){
			await modal.deferReply()
			const testimonialLink = modal.getTextInputValue('link');
			const channelTestimonial = ChannelController.getChannel(modal.client,CHANNEL_TESTIMONIAL)
			const msg = await channelTestimonial.send(TestimonialMessage.newTestimonialUser(modal.user.id,testimonialLink))
			await modal.editReply(TestimonialMessage.successSubmitTestimonial())
			ChannelController.createThread(msg,`from ${modal.user.username}`)
			ChannelController.deleteMessage(modal.message)

			TestimonialController.addTestimonialUser(modal.user.id,testimonialLink)
		}else if(commandButton === "writeReflection" || commandButton === 'editReflection'){
			await modal.deferReply()
			const highlight = modal.getTextInputValue('highlight');
			const lowlight = modal.getTextInputValue('lowlight');
			const actionPlan = modal.getTextInputValue('actionPlan');
			const note = modal.getTextInputValue('note');

			await modal.editReply(WeeklyReflectionMessage.reviewReflection({
				highlight,lowlight,actionPlan,note,
				user:modal.user
			}))
			ChannelController.deleteMessage(modal.message)
		}else if(commandButton === "customExtend"){
			await modal.deferReply({ephemeral:true})
			const extendTime = Number(modal.getTextInputValue('time').trim().split(' ')[0]);
			RecurringMeetupController.updateExtendTime(extendTime,value)
			await modal.editReply(RecurringMeetupMessage.replyExtendTime())
			ChannelController.deleteMessage(modal.message)
		}
	},
};

