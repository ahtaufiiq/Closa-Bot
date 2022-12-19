const supabase = require("../helpers/supabaseClient")

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
}

module.exports = UserController