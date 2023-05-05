const {GUILD_ID, MY_ID, CHANNEL_GOALS, CHANNEL_STATUS, ROLE_INACTIVE_MEMBER, CHANNEL_TODO, CLIENT_ID} = require('../helpers/config')
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
const RecurringMeetupController = require('../controllers/RecurringMeetupController');
const VacationController = require('../controllers/VacationController');
const WeeklyReflectionController = require('../controllers/WeeklyReflectionController');
const SickDayController = require('../controllers/SickDayController');
const GuidelineInfoController = require('../controllers/GuidelineInfoController');
const CelebrationController = require('../controllers/CelebrationController');
const FocusSessionController = require('../controllers/FocusSessionController');


module.exports = {
	name: 'ready',
	once: true,
	async execute(client,focusRoomUser) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(MY_ID)
		user.send("Restart Bot")
		
		FocusSessionController.continueFocusTimer(client,focusRoomUser)

		GuidelineInfoController.updateAllGuideline(client)

		// PaymentController.remindMember(client)
		PaymentController.remindBeforeKickoffCohort(client)
		// if(CLIENT_ID === "948546574550695936") return
		VacationController.activateVacationTicket(client)
		VacationController.notifyVacationEnded(client)

		SickDayController.activateSickTicket(client)
		SickDayController.notifySickEnded(client)

		TimelineController.updateTimeline(client)
		TimelineController.sendNotifBeforeCelebration(client)
		TimelineController.sendNotif5DaysBeforeCelebration(client)
		TimelineController.sendNotifShareStoryCelebrationDay(client)
		TimelineController.sendNotif2DaysBeforeKickoffDay(client)

		PartyController.remind30MinutesBeforeKickoff(client)
		PartyController.createKickoffEvent(client)
		PartyController.removeWaitingRoom(client)
		PartyController.generateWaitingRoomPartyMode(client)
		PartyController.announcePartyModeAvailable(client)
		PartyController.partyReminder(client)
		PartyController.updateMessageWaitingRoom(client)
		PartyController.disbandParty(client)

		PartyController.setReminderScheduleMeetup(client)
		PartyController.setReminderAutoRescheduleMeetup(client)
		PartyController.generateTemplateProgressRecap()
		PartyController.sendProgressRecap(client)

		RecurringMeetupController.setReminderTwoDayBeforeMeetup(client)
		RecurringMeetupController.setReminderOneDayBeforeMeetup(client)
		RecurringMeetupController.setReminderOneHourBeforeMeetup(client)
		RecurringMeetupController.setReminderTenMinuteBeforeMeetup(client)
		RecurringMeetupController.setScheduleCreateTemporaryVoiceChannel(client)
		RecurringMeetupController.setReminderWeeklyMeetup(client)

		GoalController.remindToWriteGoal(client)
		GoalController.updateAllActiveGoal(client)

		ReferralCodeController.resetTotalDaysThisCohort()

		// ReminderController.remindSetHighlight(client)
		ReminderController.remindHighlightUser(client)
		ReminderController.remindPostProgress(client)
		
		DailyStreakController.remindMissOneDay(client)
		DailyStreakController.remindAboutToLoseStreak(client)
		DailyStreakController.sendRepairStreak(client)

		CoworkingController.setReminderFiveMinutesBeforeCoworking(client)

		BoostController.remindBoostInactiveMember(client)
		BoostController.remindEveryMonday(client)
		BoostController.remindUserAboutToLoseStreak(client)
		BoostController.resetChannelBoost(client)

		WeeklyReflectionController.sendReminderReflection(client)
		WeeklyReflectionController.sendReflectionEveryWeek(client)
		WeeklyReflectionController.updateAnnouncementReflection(client)
		WeeklyReflectionController.hideChannelReflection(client)

		CelebrationController.sendAnnouncementCelebration(client)
		CelebrationController.updateAnnouncementCelebration(client)
		CelebrationController.hideCelebrationChannel(client)

		DailyReport.inactiveMember(client)

		WeeklyReport.sendWeeklyStatus(client)
		
	},
};
