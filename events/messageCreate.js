const DailyStreakController = require("../controllers/DailyStreakController");
const RequestAxios = require("../helpers/axios");
const { CHANNEL_REMINDER , CHANNEL_HIGHLIGHT, CHANNEL_TODO} = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const DailyStreakMessage = require("../views/DailyStreakMessage");

module.exports = {
	name: 'messageCreate',
	async execute(msg) {
		const ChannelReminder = msg.guild.channels.cache.get(CHANNEL_REMINDER)
		switch (msg.channelId) {
			case CHANNEL_HIGHLIGHT:
				
				RequestAxios.post('highlights', {
					description: msg.content,
					UserId: msg.author.id
				})
				.then(()=>{
					
					supabase.from('Users')
						.update({last_highlight:Time.getDate().toISOString().substring(0,10)})
						.eq('id',msg.author.id)
						.then()
				})
					
				break;
			case CHANNEL_TODO:
				let todos = []
				msg.content.split('\n').forEach(el => {
					if (el != '') {
						if (el.includes(`✅`) || el.includes(':white_check_mark:')) {
							todos.push({
								description:el,
								UserId:msg.author.id
							})
						}
					}
				});
				
				
				RequestAxios.get(`todos/${msg.author.id}`)
				.then((data) => {
					if (data.length > 0) {
						RequestAxios.post('todos/many', {
							todos
						})
						throw new Error("Tidak perlu kirim daily streak ke channel")
					} else {
						return RequestAxios.post('todos/many', {
							todos
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
					DailyStreakController.achieveDailyStreak(msg.client,ChannelReminder,dailyStreak,msg.author)
					ChannelReminder.send({embeds:[DailyStreakMessage.dailyStreak(dailyStreak,msg.author,longestStreak)]})
				})
				.catch(err => {
					console.log(err)
				})
				break;
		
			default:
				break;
		}
	},
};