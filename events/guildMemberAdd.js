const RequestAxios = require("../helpers/axios");
const { CHANNEL_REMINDER , CHANNEL_HIGHLIGHT, CHANNEL_TODO} = require("../helpers/config");
const DailyStreakMessage = require("../views/DailyStreakMessage");

module.exports = {
	name: 'guildMemberAdd',
	async execute(member) {
		RequestAxios.get('users/'+member.user.id)
			.then(data=>{
				if (!data) {
					return RequestAxios.post('users',{
						id:member.user.id,
						username:member.user.username,
						name:member.user.username
					})
				}
			})
			

	},
};