const {GUILD_ID, MY_ID, CHANNEL_GOALS, CHANNEL_STATUS, ROLE_INACTIVE_MEMBER, CHANNEL_TODO, CLIENT_ID} = require('../helpers/config')
const supabase  = require('../helpers/supabaseClient');
const schedule = require('node-schedule');
const Time = require('../helpers/time');
const HighlightReminderMessage = require('../views/HighlightReminderMessage');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const Email = require('../helpers/Email');
const WeeklyReport = require('../controllers/WeeklyReport');
const StatusReportMessage = require('../views/StatusReportMessage');
const MemberController = require('../controllers/MemberController');
const ChannelController = require('../controllers/ChannelController');
const AccountabilityPartnerMessage = require('../views/AccountabilityPartnerMessage');
const PaymentController = require('../controllers/PaymentController');
const DailyStreakController = require('../controllers/DailyStreakController');
const DailyReport = require('../controllers/DailyReport');
const ReminderController = require('../controllers/ReminderController');


module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		// PaymentController.remindMember(client)
		const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(MY_ID)
		user.send("Restart Bot")

		
		ReminderController.remindSetHighlight(client)
		ReminderController.remindHighlightUser(client)
		ReminderController.remindPostProgress(client)
		
		DailyStreakController.remindMissOneDay(client)
		DailyStreakController.remindMissTwoDays(client)

		if(CLIENT_ID === "949993300113371196") return

		DailyReport.inactiveMember(client)

		WeeklyReport.sendWeeklyStatus(client)
		
	},
};
