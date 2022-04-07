const DailyStreakController = require("../controllers/DailyStreakController");
const RequestAxios = require("../helpers/axios");
const { CHANNEL_REMINDER , CHANNEL_HIGHLIGHT, CHANNEL_TODO,CHANNEL_STREAK,GUILD_ID,CHANNEL_GOALS} = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const DailyStreakMessage = require("../views/DailyStreakMessage");
const schedule = require('node-schedule');

module.exports = {
	name: 'messageReactionRemove',
	async (reaction,user) {
		// handle only message with this id
		if(reaction.message.id !== "960790258256064542") return
		if (reaction.partial) {
			try {
				await reaction.fetch();
			} catch (error) {
				console.error('Something went wrong when fetching the message:', error);
				return;
			}
		}
		const idTopic = getIdTopics(`${reaction.emoji}`)
		if (idTopic) {
			MemberController.removeRole(reaction.client,user.id,idTopic)
		}
	},
};