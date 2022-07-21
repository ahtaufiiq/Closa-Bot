const RequestAxios = require("../helpers/axios");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");

module.exports = {
	name: 'guildMemberAdd',
	async execute(member) {
		RequestAxios.get('users/'+member.user.id)
			.then(data=>{
				if (!data) {
					supabase.from("Users")
						.insert([{
							id:member.user.id,
							username:member.user.username,
							name:member.user.username,
							total_days:0,
							total_points:0,
							last_active:Time.getTodayDateOnly()
						}])
						.then()
					
				}
			})
			

	},
};