const MemberController = require("../controllers/MemberController");
const getIdTopics = require("../helpers/getIdTopic");

module.exports = {
	name: 'messageReactionRemove',
	async execute(reaction,user) {
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