const MemberController = require("../controllers/MemberController");
const PointController = require("../controllers/PointController");
const getIdTopics = require("../helpers/getIdTopic");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");

module.exports = {
	name: 'messageReactionAdd',
	async execute(reaction, user) {	
		// handle only message with this id
		if(user.bot) return
		PointController.addPoint(user.id,'reaction',reaction.message.channelId)
		if(reaction.message.id !== "960790258256064542") return
		if (reaction.partial) {
			try {
				await reaction.fetch();
			} catch (error) {
				console.error('Something went wrong when fetching the message:', error);
				return;
			}
		}
		
		supabase.from("Users")
		.update({
			last_active:Time.getTodayDateOnly()
		})
		.eq('id',user.id)
		.then()
		const idTopic = getIdTopics(`${reaction.emoji}`)
		if (idTopic) {
			MemberController.addRole(reaction.client,user.id,idTopic)
		}
	},
};