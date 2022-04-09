const DailyStreakController = require("../controllers/DailyStreakController");
const RequestAxios = require("../helpers/axios");
const { CHANNEL_REMINDER , CHANNEL_HIGHLIGHT, CHANNEL_TODO,CHANNEL_STREAK,GUILD_ID,CHANNEL_GOALS} = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const DailyStreakMessage = require("../views/DailyStreakMessage");
const schedule = require('node-schedule');

module.exports = {
	name: 'messageCreate',
	async execute(msg) {
		const ChannelReminder = msg.guild.channels.cache.get(CHANNEL_REMINDER)
		const ChannelStreak = msg.guild.channels.cache.get(CHANNEL_STREAK)
		switch (msg.channelId) {
			case CHANNEL_GOALS:
				if (msg.content.includes("Success Criteria")) {
					const msgGoal = `${msg.content.split('\n')[0]} by ${msg.author.username}`
					
					const thread = await msg.startThread({
						name: msgGoal,
					});
					supabase.from('Users')
						.update({
							goal_id:thread.id
						})
						.eq('id',msg.author.id)
						.then()
				}
				break;
			case CHANNEL_HIGHLIGHT:
				const patternTime = /\d+[.:]\d+/
				const patternEmoji = /^🔆/
				if (patternEmoji.test(msg.content.trimStart())) {
                    
					if (patternTime.test(msg.content)) {
						const time = msg.content.match(patternTime)[0]
                        const [hours,minutes] = time.split(/[.:]/)
						const date = new Date()
						date.setHours(Time.minus7Hours(hours))
						date.setMinutes(minutes-10)
						supabase.from('Reminders')
							.insert({
								message:msg.content,
								time:date,
								UserId:msg.author.id,
							})
							.then()
						RequestAxios.post('highlights', {
							description: msg.content,
							UserId: msg.author.id
						})
						.then(()=>{
							
							supabase.from('Users')
								.update({last_highlight:Time.getDate().toISOString().substring(0,10)})
								.eq('id',msg.author.id)
								.then()
							const reminderHighlight = schedule.scheduleJob(date,function () {
								ChannelReminder.send(`Hi ${msg.author} reminder: ${msg.content} `)
							})
						})
					}else{
						msg.delete()
						ChannelReminder.send(`Hi ${msg.author} please __add a specific time__ to your highlight to stay accountable!
For example: 🔆 read 25 page of book **at 19.00**`)
					}
				}
				
					
				break;
			case CHANNEL_TODO:
				const patternEmojiDone = /^[✅]/
				if (patternEmojiDone.test(msg.content.trimStart()) || msg.content.includes('<:Neutral:821044410375471135>')) {
					if (msg.attachments.size > 0 || msg.content.includes('http')) {
						msg.startThread({
							name:`💬  ${msg.content.split('\n')[0].substring(1)}`,
							autoArchiveDuration:60
						})	
					}
					const { data, error } = await supabase
											.from('Users')
											.select()
											.eq('id',msg.author.id)
											.single()

					const attachments = []
					let files = []

					msg.attachments.each(data=>{
						files.push({
							attachment:data.attachment
						})
						attachments.push(data.attachment)
					})

					RequestAxios.get(`todos/${msg.author.id}`)
					.then((data) => {
						if (data.length > 0) {
							RequestAxios.post('todos', {
								attachments,
								description:msg.content,
								UserId:msg.author.id
							})
							throw new Error("Tidak perlu kirim daily streak ke channel")
						} else {
							supabase.from("Users")
								.select()
								.eq('id',MY_ID)
								.single()
								.then(data => {
									if (isValidStreak(data.body.last_done)) {
										let current_streak = data.body.current_streak + 1
										supabase.from("Users")
											.update({current_streak})
											.eq('id',MY_ID)
											.then()
										if (current_streak > data.body.longest_streak) {
											return supabase.from("Users")
											.update({
												'longest_streak':current_streak,
												'end_longest_streak':Time.getDate().toISOString().substring(0,10)
											})
											.eq('id',MY_ID)
											.single()
										}
									}else{
										return supabase.from("Users")
											.update({'current_streak':1})
											.eq('id',MY_ID)
											.single()
									}
								})
							
						}
					})
					.then(data => {
						supabase.from('Users')
							.update({last_done:Time.getDate().toISOString().substring(0,10)})
							.eq('id',msg.author.id)
							.then()
						let dailyStreak = data.body.current_streak
						let longestStreak = data.body.longestStreak
						
						DailyStreakController.achieveDailyStreak(msg.client,ChannelStreak,dailyStreak,longestStreak,msg.author)
						ChannelStreak.send({embeds:[DailyStreakMessage.dailyStreak(dailyStreak,msg.author,longestStreak)],content:`${msg.author}`})
					})
					.catch(err => {
						console.log(err)
					})

					if (data.goal_id) {
						const channel = msg.client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_GOALS)
						const thread = channel.threads.cache.find(x => x.id === data.goal_id);
	
						thread.send({
							content:msg.content,
							files
						})
						
						
					}
				}
				break;
			default:
				break;
				
		}
	},
};