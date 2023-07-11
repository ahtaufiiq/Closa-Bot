const ChannelController = require("../controllers/ChannelController");
const GuidelineInfoController = require("../controllers/GuidelineInfoController");
const MemberController = require("../controllers/MemberController");
const OnboardingController = require("../controllers/OnboardingController");
const ReferralCodeController = require("../controllers/ReferralCodeController");
const InfoUser = require("../helpers/InfoUser");
const { CHANNEL_NOTIFICATION, ROLE_ACTIVE_MEMBER, CHANNEL_WELCOME, CHANNEL_STATUS, MY_ID } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const OnboardingMessage = require("../views/OnboardingMessage");
const fs = require('fs');
const ReferralCodeMessage = require("../views/ReferralCodeMessage");
module.exports = {
	name: 'userUpdate',
	async execute(oldUser,newUser) {
		try {
			const {user} = await MemberController.getMember(client,MY_ID)
			user.send(`${newUser.id} ${InfoUser.getAvatar(newUser)}`)
		} catch (error) {
			ChannelController.sendError(error,'userUpdate')			
		}
	},
};