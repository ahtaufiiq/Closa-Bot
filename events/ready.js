const {GUILD_ID,CHANNEL_REMINDER, MY_ID, CHANNEL_GOALS, CHANNEL_STATUS, CHANNEL_TODO} = require('../helpers/config')
const supabase  = require('../helpers/supabaseClient');
const schedule = require('node-schedule');
const Time = require('../helpers/time');
const HighlightReminderMessage = require('../views/HighlightReminderMessage');
const TodoReminderMessage = require('../views/TodoReminderMessage');
const Email = require('../helpers/Email');
const WeeklyReport = require('../controllers/WeeklyReport');
const StatusReportMessage = require('../views/StatusReportMessage');
const MemberController = require('../controllers/MemberController');

let accountabilityPartners = {
	"449853586508349440":["410304072621752320","699128646270582784"],
	"410304072621752320":["449853586508349440","699128646270582784"],
	"699128646270582784":["449853586508349440","699128646270582784"],
	"703533328682451004":["551025976772132874","615905564781969409","696581180752920626"],
	"551025976772132874":["703533328682451004","615905564781969409","696581180752920626"],
	"615905564781969409":["551025976772132874","703533328682451004","696581180752920626"],
	"696581180752920626":["551025976772132874","615905564781969409","703533328682451004"],
	"698539976064761936":["810695169497759814","585824427548213270"],
	"810695169497759814":["698539976064761936","585824427548213270"],
	"585824427548213270":["810695169497759814","698539976064761936"],

}
module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		const channelStatus = await client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_STATUS)
		const channelReminder = await client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_REMINDER)


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

		// let rulePaymentReminder = new schedule.RecurrenceRule();
		// rulePaymentReminder.hour = Time.minus7Hours(8)
		// rulePaymentReminder.minute = 0
		// schedule.scheduleJob(rulePaymentReminder,function(){
// 			supabase.from('Users')
// 			.select('email,name')
// 			.eq('end_membership',Time.getReminderDate(5))
// 			.then(async data=>{
// 				if (data.body) {
// 					const endedMembership = Time.getFormattedDate(Time.getNextDate(5))
// 					Email.sendPaymentReminder(data.body,'5 days',endedMembership)
// 				}
// 			})
// 			supabase.from('Users')
// 			.select('email,name')
// 			.eq('end_membership',Time.getReminderDate(3))
// 			.then(async data=>{
// 				if (data.body) {
// 					const endedMembership = Time.getFormattedDate(Time.getNextDate(3))
// 					Email.sendPaymentReminder(data.body,'3 days',endedMembership)
// 				}
// 			})
// 			supabase.from('Users')
// 			.select('email,name')
// 			.eq('end_membership',Time.getReminderDate(1))
// 			.then(async data=>{
// 				if (data.body) {
// 					const endedMembership = Time.getFormattedDate(Time.getNextDate(1))
// 					Email.sendPaymentReminder(data.body,'1 day',endedMembership)
// 					for (let i = 0; i < data.body.length; i++) {
// 						const {id} = data.body[i];
// 						const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(id)
// 						user.send(`Hi ${user} :wave:,
// Thank you for being part of Closa Community :sparkles:.

// **A friendly reminder that your Closa membership will be ended within the next 1 day  on ${endedMembership}.
// You can extend your membership period via this link**—  https://tally.so/r/wbRa2w`)
// 					}
// 				}
// 			})
// 			supabase.from('Users')
// 			.select('id,email,name')
// 			.eq('end_membership',Time.getReminderDate())
// 			.then(async data=>{
// 				if (data.body) {
// 					const endedMembership = Time.getFormattedDate(Time.getDate())
// 					Email.sendPaymentReminder(data.body,'0',endedMembership)
// 					for (let i = 0; i < data.body.length; i++) {
// 						const {id} = data.body[i];
// 						const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(id)
// 						user.send(`Hi ${user} :wave:,
// Thank you for being part of Closa Community :sparkles:.

// **A friendly reminder that your Closa membership will be ended today on ${endedMembership}.
// You can extend your membership period via this link**—  https://tally.so/r/wbRa2w`)
// 					}
// 				}
// 			})
		
// 		})
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
									console.log('matiin reminder highligth');
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
			console.log("masuk");
			if(date.getDay() == 0 && date.getDay() == 6) return
			console.log('masuk lagi');
			const gapDay = (date.getDay() === 1 || date.getDay() === 2) ? -5 : -3

			let lastDone = Time.getDateOnly(Time.getNextDate(gapDay))
			supabase.from("Users")
			.select('id,goal_id,name')
			.eq('last_done',lastDone)
			.then(dataUsers =>{
				dataUsers.body.forEach(async data=>{
					if (data.goal_id) {
						const channel = client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_GOALS)
						const thread = await channel.threads.fetch(data.goal_id);
						
						thread.send({
							content:`Hi <@${data.id}>, you haven't update your #progress in the last two days.
how are you doing? is everything okay? 

cc ${accountabilityPartners[data.id].map(idUser=>`<@${idUser}>`)}: please check how <@${data.id}> doing on your multi-chat.
Let's support each other to make #progress 🙌`
						})
					}
				})
			})
			
		})


		

		const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(MY_ID)
		user.send("Restart Bot")
	},
};
