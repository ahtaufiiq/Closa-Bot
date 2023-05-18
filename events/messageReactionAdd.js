const ChannelController = require("../controllers/ChannelController");
const DailyReport = require("../controllers/DailyReport");
const MemberController = require("../controllers/MemberController");
const PointController = require("../controllers/PointController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const Email = require("../helpers/Email");
const { CHANNEL_PAYMENT } = require("../helpers/config");
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
		console.log('reaction',`${reaction.emoji}`);
		if(reaction.message.channelId === CHANNEL_PAYMENT && `${reaction.emoji}`=== '✅'){
			const msg = await ChannelController.getMessage(
				ChannelController.getChannel(reaction.client,CHANNEL_PAYMENT),
				reaction.message.id
			)
			const embed = msg.embeds[0]
			let email = ''
			let nickname = ''
			console.log(embed.fields);
			for (let i = 0; i < embed.fields.length; i++) {
				const {name,value} = embed.fields[i];
				if(name.toLowerCase().includes('email')){
					email = value
				}else if(name.toLowerCase().includes('name')){
					nickname = value
				}
			}	
			const [{referralCode}] =  await ReferralCodeController.addNewReferral("449853586508349440",1)
			const thread = await ChannelController.getThread(
				ChannelController.getChannel(reaction.client,CHANNEL_PAYMENT),
				reaction.message.id
			)
			Email.sendEmailEarlyAccess(nickname,email,referralCode)
			thread.send(referralCode)
		}
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