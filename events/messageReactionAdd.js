const ChannelController = require("../controllers/ChannelController");
const DailyReport = require("../controllers/DailyReport");
const MemberController = require("../controllers/MemberController");
const PointController = require("../controllers/PointController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const Email = require("../helpers/Email");
const MessageFormatting = require("../helpers/MessageFormatting");
const { CHANNEL_PAYMENT, CHANNEL_GUIDELINE } = require("../helpers/config");
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
		if(reaction.message.channelId === CHANNEL_PAYMENT && (`${reaction.emoji}`=== '✅' || `${reaction.emoji}`=== '💌')){
			const msg = await ChannelController.getMessage(
				ChannelController.getChannel(reaction.client,CHANNEL_PAYMENT),
				reaction.message.id
			)
			const embed = msg.embeds[0]
			let email = ''
			let nickname = ''
			for (let i = 0; i < embed.fields.length; i++) {
				const {name,value} = embed.fields[i];
				if(name.toLowerCase().includes('email')){
					email = value
				}else if(name.toLowerCase().includes('name')){
					nickname = value
				}
			}	
			let invite = await ChannelController.getChannel(reaction.client,CHANNEL_GUIDELINE).createInvite({
                maxAge:2_592_000,
                unique:true,
				maxUses:1,
                reason: 'invite link',
            })
			
            const inviteLink = MessageFormatting.inviteLink(invite.code)
			const thread = await ChannelController.getThread(
				ChannelController.getChannel(reaction.client,CHANNEL_PAYMENT),
				reaction.message.id
			)
			if(`${reaction.emoji}`=== '✅'){
				Email.sendInvitationForProductiveMember(nickname,email,inviteLink)
			}else{
				Email.sendInvitation6WeekChallenge(nickname,email,inviteLink)
			}
			thread.send(inviteLink)
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