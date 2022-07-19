const {GUILD_ID,CHANNEL_REMINDER, MY_ID, CHANNEL_GOALS, CHANNEL_STATUS, ROLE_INACTIVE_MEMBER, CHANNEL_TODO} = require('../helpers/config')
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


module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		const channelStatus = ChannelController.getChannel(client,CHANNEL_STATUS)
		const channelReminder = ChannelController.getChannel(client,CHANNEL_REMINDER)
		const channelGoals = ChannelController.getChannel(client,CHANNEL_GOALS)
		// PaymentController.remindMember(client)

		let ruleStatusReport = new schedule.RecurrenceRule();
		ruleStatusReport.hour = Time.minus7Hours(8)
		ruleStatusReport.minute = 0
		schedule.scheduleJob(ruleStatusReport,function(){
			supabase.from("Users")
				.select()
				.eq('last_active',Time.getDateOnly(Time.getNextDate(-5)))
				.then(data=>{
					if (data.body.length > 0) {
						data.body.forEach(member=>{
							MemberController.addRole(client,member.id,ROLE_INACTIVE_MEMBER)
							channelStatus.send(StatusReportMessage.inactiveMemberReport(member.id,member.email,member.goal_id))
						})
					}
				})

		})
		let ruleReminderMissOneDay = new schedule.RecurrenceRule();
		ruleReminderMissOneDay.hour = Time.minus7Hours(6)
		ruleReminderMissOneDay.minute = 0
		schedule.scheduleJob(ruleReminderMissOneDay,function(){
			supabase.from("Users")
				.select('id,name')
				.gte('current_streak',5)
				.eq('last_done',Time.getDateOnly(Time.getNextDate(-2)))
				.then(data=>{
					data.body.forEach(member=>{
						
						channelReminder.send(TodoReminderMessage.missYesterdayProgress(member.id))
					})
			})
		})


		supabase.from('Reminders')
			.select()
			.gte('time',new Date().toUTCString())
			.then(data=>{
				data.body.forEach(reminder=>{
					schedule.scheduleJob(reminder.time,function() {
						channelReminder.send(`Hi <@${reminder.UserId}> reminder: ${reminder.message} `)
					})
				})
			})
		supabase.from('Users')
			.select()
			.neq('reminder_highlight',null)
			.then(data=>{
				data.body.forEach(user=>{
					const [hours,minutes] = user.reminder_highlight.split(/[.:]/)
					
					let ruleReminderHighlight = new schedule.RecurrenceRule();
					ruleReminderHighlight.hour = Time.minus7Hours(hours)
					ruleReminderHighlight.minute = minutes
					const scheduleReminderHighlight = schedule.scheduleJob(ruleReminderHighlight,function(){
						supabase.from('Users')
						.select()
						.eq('id',user.id)
						.single()
						.then(async ({data})=>{
							if (data) {
								if (user.reminder_highlight !== data.reminder_highlight) {
									scheduleReminderHighlight.cancel()
								}else if(data.last_highlight !== Time.getDate().toISOString().substring(0,10)){
									const userId = data.id;
									channelReminder.send(HighlightReminderMessage.highlightReminder(userId))
								}
							}
						})
					
					})
				})
				
			})
		
		supabase.from('Users')
		.select()
		.neq('reminder_progress',null)
		.then(data=>{
			data.body.forEach(user=>{
				const [hours,minutes] = user.reminder_progress.split(/[.:]/)
			
				let ruleReminderProgress = new schedule.RecurrenceRule();
				ruleReminderProgress.hour = Time.minus7Hours(hours)
				ruleReminderProgress.minute = minutes
				const scheduleReminderProgress = schedule.scheduleJob(ruleReminderProgress,function(){
					supabase.from('Users')
					.select()
					.eq('id',user.id)
					.single()
					.then(async ({data})=>{
						if (data) {
							if (user.reminder_progress !== data.reminder_progress) {
								scheduleReminderProgress.cancel()
							}else if (data.last_done !== Time.getDate().toISOString().substring(0,10)) {
								const userId = data.id;
								channelReminder.send(TodoReminderMessage.progressReminder(userId))
							}
						}
					})
				
				})
			})
			
		})
		
		schedule.scheduleJob(`1 0 ${Time.minus7Hours(8)} * * 1`,async function() {
			
			Promise.all([
				WeeklyReport.getAllMember(),
				WeeklyReport.getInactiveMember()
			]).then(([allMembers,inactiveMembers])=>{
				const todayDate = Time.getDate()
				const date = Time.getDateOnly(todayDate)
				const totalMember = allMembers.length
				const totalActiveMember = totalMember - inactiveMembers.length
				const retention_rate = Number((totalActiveMember/totalMember*100).toFixed(0))
				const inactiveMembersName = inactiveMembers.map(member=>member.name)
				return supabase.from("WeeklyStats")
							.insert({
								retention_rate,
								date,
								total_member:totalMember,
								inactive_members:`${inactiveMembersName}`
							})
			}).then(()=>{
				return Promise.all(
						[		
							WeeklyReport.getAllMemberPreviousMonth(),
							WeeklyReport.getAllMember(),
							WeeklyReport.getNewMember(),
							WeeklyReport.getInactiveMember(),
							WeeklyReport.getPreviousMRR(),
							WeeklyReport.getMRR(),
							WeeklyReport.getTotalRevenue(),
							WeeklyReport.getPreviousWeeklyStat(),
							WeeklyReport.getPreviousMonthlyRetentionRate(),
							WeeklyReport.getMonthlyRetentionRate()
						]
						).then(([previousMembers,allMembers,NewMembers,inactiveMembers,previousMRR,MRR,totalRevenue,previousWeeklyStat,previousMonthlyRetentionRate,monthlyRetentionRate]) =>{
							const [
								totalPreviousMembers,
								totalMember,
								totalNewMember,
								totalInactiveMember]=[previousMembers.length,allMembers.length,NewMembers.length,inactiveMembers.length]
								
							channelStatus.send(
								StatusReportMessage.weeklyReport(
									totalPreviousMembers,
									totalMember,
									totalNewMember,
									totalInactiveMember,
									previousMRR,
									MRR,
									totalRevenue,
									previousWeeklyStat,
									previousMonthlyRetentionRate,
									monthlyRetentionRate
								)
							)
					
								
						})
			})
		})


		let ruleReminderSkipTwoDays = new schedule.RecurrenceRule();
		ruleReminderSkipTwoDays.hour = Time.minus7Hours(21)
		ruleReminderSkipTwoDays.minute = 0

		schedule.scheduleJob(ruleReminderSkipTwoDays,function(){
			const date = Time.getDate()
			if(date.getDay() == 0 && date.getDay() == 6) return
			
			let lastDone = Time.getDateOnly(Time.getNextDate(-3))
			supabase.from("Users")
			.select('id,goal_id,name')
			.eq('last_done',lastDone)
			.then(dataUsers =>{
				dataUsers.body.forEach(async data=>{
					if (data.goal_id) {
						const channel = ChannelController.getChannel(client,CHANNEL_GOALS)
						const thread = await ChannelController.getThread(channel,data.goal_id);
						thread.send(AccountabilityPartnerMessage.remindPartnerAfterMissTwoDays(data.id))
					}
				})
			})
			
		})


		

		const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(MY_ID)
		user.send("Restart Bot")
	},
};
