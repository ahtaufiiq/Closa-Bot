const BoostController = require("../controllers/BoostController");
const ChannelController = require("../controllers/ChannelController");
const MemberController = require("../controllers/MemberController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const BoostMessage = require("../views/BoostMessage");
const PaymentMessage = require("../views/PaymentMessage");
const PaymentController = require("../controllers/PaymentController");
const PartyMessage = require("../views/PartyMessage");
const PartyController = require("../controllers/PartyController");
const supabase = require("../helpers/supabaseClient");
const LocalData = require("../helpers/LocalData");
const { CHANNEL_PARTY_MODE, ROLE_TRIAL_MEMBER, CHANNEL_PARTY_ROOM, CHANNEL_GOALS } = require("../helpers/config");
const RecurringMeetupController = require("../controllers/RecurringMeetupController");
const Time = require("../helpers/time");
const RecurringMeetupMessage = require("../views/RecurringMeetupMessage");
const schedule = require('node-schedule');
const GoalController = require("../controllers/GoalController");
const GoalMessage = require("../views/GoalMessage");
module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		if (!interaction.isCommand() && !interaction.isButton() && !interaction.isSelectMenu()) return;

		if (interaction.isButton()) {
			if(ReferralCodeController.showModalRedeem(interaction)) return
			if(GoalController.showModalWriteGoal(interaction)) return
			if(GoalController.showModalEditGoal(interaction)) return 
			const [commandButton,targetUserId=interaction.user.id,value] = interaction.customId.split("_")
			if (commandButton=== "postGoal" || commandButton.includes('Reminder') ||commandButton.includes('Time') || commandButton.includes('role') || commandButton === 'goalCategory'  || commandButton.includes('ttendMeetup')) {
				await interaction.deferReply();
			}else{
				await interaction.deferReply({ephemeral:true});
			}

			if (commandButton.includes('boost') && interaction.user.id === targetUserId) {
				await interaction.editReply(BoostMessage.warningBoostYourself())
				return	
			}
			
			const notificationThreadTargetUser = await ChannelController.getNotificationThread(interaction.client,targetUserId)
			const targetUser = await MemberController.getMember(interaction.client,targetUserId)
			switch (commandButton) {
				case "boostInactiveMember":
					BoostController.interactionBoostInactiveMember(interaction,targetUser,notificationThreadTargetUser)
					break;
				case "boostBack":
					BoostController.interactionBoostBack(interaction,targetUser,notificationThreadTargetUser)
					break;
				case "joinPartyRoom":
					const {cohort} = LocalData.getData()
					const dataJoinedParty = await supabase.from("MemberPartyRooms")
						.select('PartyRooms(msgId),Users(notificationId)')
						.eq("UserId",interaction.user.id)
						.gte("endPartyDate",Time.getTodayDateOnly())
						.single()
					if (dataJoinedParty.body) {
						const notificationThread = await ChannelController.getNotificationThread(interaction.client,interaction.user.id,dataJoinedParty.body.Users.notificationId)
						notificationThread.send(PartyMessage.alreadyJoinPartyRoom(interaction.user.id,dataJoinedParty.body.PartyRooms.msgId))
						await interaction.editReply(PartyMessage.alreadyJoinPartyRoom(interaction.user.id,dataJoinedParty.body.PartyRooms.msgId))
						return
					}
					const dataParty = await supabase.from("PartyRooms")
					.select("*,MemberPartyRooms(UserId,goal,isLeader,isTrialMember)")
					.eq('id',value)
					.single()
					const members = dataParty.body.MemberPartyRooms
					const {
						totalExistingMembers,
						totalTrialMember
					} = PartyController.countTotalMemberParty(members)
					const isTrialMember = await MemberController.hasRole(interaction.client,interaction.user.id,ROLE_TRIAL_MEMBER)

					if ((isTrialMember && totalTrialMember === 1)) {
						await interaction.editReply(PartyMessage.replyPartyIsFull('existing'))
						return
					}else if(!isTrialMember && totalExistingMembers === 3){
						await interaction.editReply(PartyMessage.replyPartyIsFull('free trial'))
						return
					}

					const dataUser = await supabase.from("Users")
					.select('goalId,notificationId')
					.eq('id',interaction.user.id)
					.single()
					if (!dataUser.body?.goalId) {
						const notificationThread = await ChannelController.getNotificationThread(interaction.client,interaction.user.id,dataUser.body.notificationId)
						notificationThread.send(GoalMessage.pickYourRole(interaction.user.id,`joinParty${value}`))
						await interaction.editReply(PartyMessage.replyCannotJoinPartyBeforeSetGoal(interaction.user.id,dataUser.body.notificationId))
						return
					}
					await interaction.editReply(PartyMessage.confirmationJoinParty(interaction.user.id,value))
					break
				case "leavePartyRoom":
					const dataMemberParty = await supabase.from("MemberPartyRooms")
						.select("partyId,PartyRooms(msgId)")
						.eq("UserId",interaction.user.id)
						.gte("endPartyDate",Time.getTodayDateOnly())
						.single()
					if (dataMemberParty.body) {
						if(dataMemberParty.body.partyId === Number(value)){
							await interaction.editReply(PartyMessage.confirmationLeaveParty(interaction.user.id,`${value}-${dataMemberParty.body.PartyRooms.msgId}`))
						}else{
							await interaction.editReply(PartyMessage.leaveOtherPartyRoom(dataMemberParty.body.PartyRooms.msgId))
						}
					}else{
						await interaction.editReply(PartyMessage.leaveBeforeJoinedParty())
					}
					break;
				case "acceptLeaveParty":
					const [partyNumber,msgId] = value.split('-')
					await supabase.from("MemberPartyRooms")
						.delete()		
						.eq("UserId",interaction.user.id)
						.gte("endPartyDate",Time.getTodayDateOnly())
						.single()

					supabase.from("PartyRooms")
					.select("*,MemberPartyRooms(UserId,goal,isLeader,isTrialMember)")
					.eq('id',partyNumber)
					.single()
					.then(async data=>{
						const members = data?.body?.MemberPartyRooms
						
						if(members.length === 3){
							const remind5Minute = Time.getDate()
							remind5Minute.setMinutes(remind5Minute.getMinutes()+5)
	
							const threadParty = await ChannelController.getThread(interaction.channel,msgId)
							schedule.scheduleJob(remind5Minute,async function() {
								const queryOr = members.map(member=>`UserId.eq.${member.UserId}`)
								const dataRecentUser = await supabase.from('Points')
									.select()
									.or(queryOr.join(','))
									.limit(1)
									.order('createdAt',{ascending:false})
									.single()
								if(dataRecentUser.body) threadParty.send(PartyMessage.remindSharePartyWhenSomeoneLeaveParty(dataRecentUser.body.UserId,msgId))
							})
						}
					})
					
					threadParty.send(PartyMessage.userLeaveParty(interaction.user.id))
					PartyController.updateMessagePartyRoom(interaction.client,msgId,partyNumber)
					
					await interaction.editReply(PartyMessage.succesLeaveParty(partyNumber))
					break;
				case "declineLeaveParty":
					await interaction.editReply(PartyMessage.declineLeaveParty())
					break;
				case "declineJoinParty":
					await interaction.editReply(PartyMessage.replyCancelJoinParty())
					break;
				case "acceptJoinParty":
					let notificationId
					supabase.from("Users")
					.select('goalId,notificationId')
					.eq('id',interaction.user.id)
					.single()
					.then(async data=>{
						notificationId = data.body.notificationId
						const channelGoals = ChannelController.getChannel(interaction.client,CHANNEL_GOALS)
						const thread = await ChannelController.getThread(channelGoals,data.body.goalId)
						let goal = thread.name.split('by')[0]
						const {celebrationDate} = LocalData.getData()
						const isTrialMember = await MemberController.hasRole(interaction.client,interaction.user.id,ROLE_TRIAL_MEMBER)
						supabase.from("MemberPartyRooms")
							.insert({
								goal,
								isTrialMember,
								partyId:value,
								endPartyDate:celebrationDate,
								UserId:interaction.user.id
							})
							.then(data=>{
								supabase.from("PartyRooms")
								.select("*,MemberPartyRooms(UserId,goal,isLeader,isTrialMember)")
								.eq('id',value)
								.single()
								.then(async data=>{
									const members = data.body.MemberPartyRooms
									members.sort(member=> {
										return member.isLeader ? -1 : 1 
									})
									const channelParty = ChannelController.getChannel(interaction.client,CHANNEL_PARTY_ROOM)
									const threadPartyRoom = await ChannelController.getThread(channelParty,data.body.msgId)
									threadPartyRoom.send(PartyMessage.userJoinedParty(interaction.user.id))
									const totalMemberParty = PartyController.countTotalMemberParty(members)
									const isFullParty = totalMemberParty.totalExistingMembers === 3 && totalMemberParty.totalTrialMember === 1
									const msgParty = await ChannelController.getMessage(channelParty,data.body.msgId)
									msgParty.edit(PartyMessage.partyRoom(
										data.body.id,
										PartyController.formatMembersPartyRoom(members),
										totalMemberParty,
										members[0].UserId,
										isFullParty
									))
									await interaction.editReply(PartyMessage.replySuccessJoinParty(interaction.user.id,data.body.msgId))
									const notificationThread = await ChannelController.getNotificationThread(interaction.client,interaction.user.id,notificationId)
									notificationThread.send(PartyMessage.replySuccessJoinParty(interaction.user.id,data.body.msgId))
									setTimeout(() => {
										notificationThread.send(PartyMessage.reminderSetHighlightAfterJoinParty(interaction.user.id))
									}, 1000 * 60 * 15);
								})
							})
					})

					break;
				case "joinPartyMode":{
					const alreadyHaveGoal = await GoalController.alreadyHaveGoal(interaction.user.id)
					if (alreadyHaveGoal) {
						interaction.editReply(PartyMessage.warningReplaceExistingGoal(interaction.user.id))
					}else{
						const data = await supabase.from('JoinParties')
							.select()
							.eq("UserId",interaction.user.id)
							.eq('cohort',PartyController.getNextCohort())
							.single()
						if (data.body) {
							await interaction.editReply(PartyMessage.alreadyJoinWaitingRoom())
						}else{
							notificationThreadTargetUser.send(GoalMessage.pickYourRole(targetUserId))
							await interaction.editReply(PartyMessage.replySuccessStartPartyMode(notificationThreadTargetUser.id))
							await supabase.from("JoinParties")
								.insert({
									UserId:interaction.user.id,
									cohort:PartyController.getNextCohort(),
								})
							PartyController.updateMessageWaitingRoom(interaction.client)
						}
					}}
					break;
				case "attendMeetup":
					RecurringMeetupController.interactionConfirmationMeetup(interaction,true,value)
					break
				case "cannotAttendMeetup":
					RecurringMeetupController.interactionConfirmationMeetup(interaction,false,value)
					break;
				case "leaveWaitingRoom":
					await supabase.from("JoinParties")
						.delete()
						.eq("UserId",interaction.user.id)
						.eq("cohort",PartyController.getNextCohort())
					PartyController.updateMessageWaitingRoom(interaction.client)
					interaction.editReply("Success leave party")
					break;
				case "continueReplaceGoal":
					notificationThreadTargetUser.send(GoalMessage.pickYourRole(targetUserId,value))
					if (PartyController.isPartyMode(value)) {
						const data = await supabase.from('JoinParties')
						.select()
						.eq("UserId",interaction.user.id)
						.eq('cohort',PartyController.getNextCohort())
						.single()
						if (data.body) {
							await interaction.editReply(PartyMessage.replyAlreadyJoinWaitingRoom())
						}else{
							await interaction.editReply(PartyMessage.replySuccessStartPartyMode(notificationThreadTargetUser.id))
							await supabase.from("JoinParties")
								.insert({
									UserId:interaction.user.id,
									cohort:PartyController.getNextCohort(),
								})
							PartyController.updateMessageWaitingRoom(interaction.client)
						}
					}else{
						await interaction.editReply(PartyMessage.replySuccessStartSoloMode(notificationThreadTargetUser.id))
					}
					break;
				case "cancelReplaceGoal":
					await interaction.editReply(PartyMessage.cancelReplaceGoal(value))
					break;
				case "startSoloMode":
					const alreadyHaveGoal = await GoalController.alreadyHaveGoal(interaction.user.id)
					if (alreadyHaveGoal) {
						interaction.editReply(PartyMessage.warningReplaceExistingGoal(interaction.user.id,"solo"))
					}else{
						notificationThreadTargetUser.send(GoalMessage.pickYourRole(targetUserId,'solo'))
						await interaction.editReply(PartyMessage.replySuccessStartSoloMode(notificationThreadTargetUser.id))
					}
					break;
				case "postGoal":
					GoalController.interactionPostGoal(interaction,value)
					break;
				case "roleDeveloper":
					GoalController.interactionPickRole(interaction,'Developer',value)
					break;
				case "roleDesigner":
					GoalController.interactionPickRole(interaction,'Designer',value)
					break;
				case "roleCreator":
					GoalController.interactionPickRole(interaction,'Creator',value)
					break;
				case "defaultReminder":
					await PartyController.interactionSetDefaultReminder(interaction,value)
					notificationThreadTargetUser.send(PartyMessage.endOfOnboarding())
					break;
				case "customReminder":
					await interaction.editReply(PartyMessage.replyCustomReminder())
					interaction.message.delete()
					notificationThreadTargetUser.send(PartyMessage.endOfOnboarding())
					break;
				case "noReminder":
					await interaction.editReply(PartyMessage.replyNoHighlightReminder())
					interaction.message.delete()
					notificationThreadTargetUser.send(PartyMessage.endOfOnboarding())
					break;
				case "claimReferral":
					ReferralCodeController.interactionClaimReferral(interaction,targetUserId)
					break;
				case "generateReferral":
					ReferralCodeController.interactionGenerateReferral(interaction,targetUserId)
					break;
				case "remindJoinNextCohort":
					PaymentController.setReminderJoinNextCohort(interaction.client,targetUserId)
					await interaction.editReply(PaymentMessage.replySetReminderJoinNextCohort())
					break;
				default:
					await interaction.editReply(BoostMessage.successSendMessage(targetUser.user))
					break;
			}
		}else if(interaction.isSelectMenu()){
			
			const [commandMenu,targetUserId] = interaction.customId.split("_")
			if (commandMenu.includes('boost')) {
				await interaction.deferReply({ephemeral:true});
				if (interaction.user.id === targetUserId ) {
					await interaction.editReply(BoostMessage.warningReplyYourself())
					return	
				}
			}else{
				await interaction.deferReply();
			}
			
			const notificationThreadTargetUser = await ChannelController.getNotificationThread(interaction.client,targetUserId)
			const targetUser = await MemberController.getMember(interaction.client,targetUserId)
			const valueMenu = interaction.values[0]
			switch (commandMenu) {
				case "inactiveReply":
					notificationThreadTargetUser.send(BoostMessage.IamBack(targetUser.user,interaction.user,valueMenu))
					await interaction.editReply(BoostMessage.successSendMessage(targetUser.user))
					break;
				case "goalCategory":
					GoalController.interactionPickGoalCategory(interaction,valueMenu)
					break;
				default:
					await interaction.editReply(BoostMessage.successSendMessage(targetUser.user))
					break;
			}
		}else{
			const client = interaction.client
			const command = client.commands.get(interaction.commandName);
			if (!command) return;
		
			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	},
};

