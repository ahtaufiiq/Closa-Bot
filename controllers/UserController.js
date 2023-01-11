const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")

class UserController{
	static async updateLastSafety(dateOnly,userId){
		supabase.from("Users")
		.update({'lastSafety':dateOnly})
		.eq('id',userId)
		.then()
	}

	static async updateOnVacation(onVacation,userId){
		supabase.from("Users")
		.update({onVacation})
		.eq('id',userId)
		.then()
	}

	static async getActiveMembers(){
		return await supabase.from("Users")
			.select()
			.gte('endMembership',Time.getTodayDateOnly())
	}
}

module.exports = UserController