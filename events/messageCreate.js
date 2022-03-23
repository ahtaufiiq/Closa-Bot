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
				const patternEmojiDone = /^[✅<:Neutral:821044410375471135>]/
				if (patternEmojiDone.test(msg.content.trimStart())) {
	
					// const channel = msg.client.guilds.cache.get(GUILD_ID).channels.cache.get(CHANNEL_GOALS)
					// const message = channel.awaitMessages()
					// const message = await channel.messages.fetch("955362282144141382")

					// Bikin thread
					// const thread = await message.startThread({
					// 	name: 'food-talk',
					// 	reason: 'Needed a separate thread for food',
				
					// });

					// kalau udah ada threadnya
					// const thread = channel.threads.cache.find(x => x.name === 'food-talk');

					let files = []
					const attachments = []
					msg.attachments.each(data=>{
						files.push({
							attachment:data.attachment
						})
						attachments.push(data.attachment)
					})
					// thread.send({
					// 	content:msg.content,
					// 	files
					// })
					
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
							return RequestAxios.post('todos', {
								attachments,
								description:msg.content,
								UserId:msg.author.id
							})
							
						}
					})
					.then(()=>{
						return Promise.all(
							[
								RequestAxios.get(`todos/dailyStreak/${msg.author.id}`),
								RequestAxios.get(`todos/longestStreak/${msg.author.id}`),
							])
					})
					.then(values => {
						supabase.from('Users')
							.update({last_done:Time.getDate().toISOString().substring(0,10)})
							.eq('id',msg.author.id)
							.then()
						let dailyStreak = values[0][0].length
						let longestStreak = values[1][0].length
						DailyStreakController.achieveDailyStreak(msg.client,ChannelStreak,dailyStreak,msg.author)
						ChannelStreak.send({embeds:[DailyStreakMessage.dailyStreak(dailyStreak,msg.author,longestStreak)],content:`${msg.author}`})
					})
					.catch(err => {
						console.log(err)
					})
				}
				break;
			default:
				break;
				
		}
	},
};