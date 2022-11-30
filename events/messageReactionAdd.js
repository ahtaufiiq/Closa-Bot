const DailyReport = require("../controllers/DailyReport");
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
		await DailyReport.activeMember(reaction.client,user.id)
		PointController.addPoint(user.id,'reaction',0,reaction.message.channelId)
		if(reaction.message.id !== "960790258256064542" && reaction.message.id !== "1013254534262423553") return
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
			lastActive:Time.getTodayDateOnly()
		})
		.eq('id',user.id)
		.then()
		const idTopic = getIdTopics(`${reaction.emoji}`)
		if (idTopic) {
			MemberController.addRole(reaction.client,user.id,idTopic)
		}
	},
};