const {GUILD_ID, MY_ID, CHANNEL_GOALS, CHANNEL_STATUS, ROLE_INACTIVE_MEMBER, CHANNEL_TODO, CLIENT_ID, CHANNEL_COMMAND} = require('../helpers/config')
const WeeklyReport = require('../controllers/WeeklyReport');
const PaymentController = require('../controllers/PaymentController');
const DailyStreakController = require('../controllers/DailyStreakController');
const DailyReport = require('../controllers/DailyReport');
const ReminderController = require('../controllers/ReminderController');
const CoworkingController = require('../controllers/CoworkingController');
const BoostController = require('../controllers/BoostController');
const TimelineController = require('../controllers/TimelineController');
const ReferralCodeController = require('../controllers/ReferralCodeController');
const PartyController = require('../controllers/PartyController');
const GoalController = require('../controllers/GoalController');
const RecurringMeetupController = require('../controllers/RecurringCoworkingController');
const VacationController = require('../controllers/VacationController');
const WeeklyReflectionController = require('../controllers/WeeklyReflectionController');
const SickDayController = require('../controllers/SickDayController');
const GuidelineInfoController = require('../controllers/GuidelineInfoController');
const CelebrationController = require('../controllers/CelebrationController');
const FocusSessionController = require('../controllers/FocusSessionController');
const OnboardingController = require('../controllers/OnboardingController');
const AdvanceReportController = require('../controllers/AdvanceReportController');
const RecurringCoworkingController = require('../controllers/RecurringCoworkingController');


module.exports = {
	name: 'ready',
	once: true,
	async execute(client,focusRoomUser,listFocusRoom,invites) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(MY_ID)
		user.send("Restart Bot")

		AdvanceReportController.sendAdvanceReportEveryMonday(client)

		ReminderController.remindSetHighlight(client)
		ReminderController.remindPostProgress(client)
		
		FocusSessionController.continueFocusTimer(client,focusRoomUser,listFocusRoom)
		ReferralCodeController.cachingAllInviteLink(client,invites)

		GuidelineInfoController.updateAllGuideline(client)
		GoalController.updateAllActiveGoal(client)

		VacationController.activateVacationTicket(client)
		VacationController.notifyVacationEnded(client)

		SickDayController.activateSickTicket(client)
		SickDayController.notifySickEnded(client)

		TimelineController.updateTimeline(client)

		
		ReminderController.remindHighlightUser(client)
		
		DailyStreakController.remindMissOneDay(client)
		DailyStreakController.remindAboutToLoseStreak(client)
		DailyStreakController.sendRepairStreak(client)
		DailyStreakController.resetDailyStreak()

		CoworkingController.setReminderFiveMinutesBeforeCoworking(client)

		BoostController.remindBoostInactiveMember(client)
		BoostController.remindUserAboutToLoseStreak(client)
		BoostController.resetChannelBoost(client)

		// WeeklyReflectionController.sendReminderReflection(client)
		// WeeklyReflectionController.updateAnnouncementReflection(client)
		// WeeklyReflectionController.hideChannelReflection(client)

		DailyReport.inactiveMember(client)

		WeeklyReport.sendWeeklyStatus(client)
		OnboardingController.reminderContinueQuest(client)
		// WeeklyReflectionController.sendReflectionEveryWeek(client)
		PaymentController.remindMember(client)
		PaymentController.handleSuccessExtendMembership(client)
		PaymentController.resetTotalUsage(client)

		// PaymentController.remindBeforeKickoffCohort(client)
		// TimelineController.sendNotifBeforeCelebration(client)
		// TimelineController.sendNotif5DaysBeforeCelebration(client)
		// TimelineController.sendNotifShareStoryCelebrationDay(client)
		// TimelineController.sendNotif2DaysBeforeKickoffDay(client)

		// PartyController.remind30MinutesBeforeKickoff(client)
		// PartyController.createKickoffEvent(client)
		// PartyController.removeWaitingRoom(client)
		// PartyController.generateWaitingRoomPartyMode(client)
		// PartyController.announcePartyModeAvailable(client)
		// PartyController.partyReminder(client)
		// PartyController.updateMessageWaitingRoom(client)
		// PartyController.disbandParty(client)

		// PartyController.setReminderScheduleMeetup(client)
		// PartyController.setReminderAutoRescheduleMeetup(client)
		// PartyController.generateTemplateProgressRecap()
		// PartyController.sendProgressRecap(client)
		
		// RecurringCoworkingController.scheduleAllRecurringCoworking(client,listFocusRoom)
		// RecurringMeetupController.setReminderTwoDayBeforeMeetup(client)
		// RecurringMeetupController.setReminderOneDayBeforeMeetup(client)
		// RecurringMeetupController.setReminderOneHourBeforeMeetup(client)
		// RecurringMeetupController.setReminderTenMinuteBeforeMeetup(client)
		// RecurringMeetupController.setScheduleCreateTemporaryVoiceChannel(client)
		// RecurringMeetupController.setReminderWeeklyMeetup(client)

		// GoalController.remindToWriteGoal(client)


		// CelebrationController.sendAnnouncementCelebration(client)
		// CelebrationController.updateAnnouncementCelebration(client)
		// CelebrationController.hideCelebrationChannel(client)
	},
};