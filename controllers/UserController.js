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

	static async updatePoint(pointLeft,userId){
        return await supabase.from("Users")
            .update({totalPoint:pointLeft})
            .eq('id',userId)
    }

	static async getActiveMembers(){
		return await supabase.from("Users")
			.select()
			.gte('endMembership',Time.getTodayDateOnly())
	}

	static async getNotificationId(userId){
		const data = await supabase.from("Users")
			.select('notificationId')
			.eq('id',userId)
			.single()
		return data.body.notificationId
	}

	static async incrementTotalPoints(increment,UserId){
        supabase.from("Users")
            .select('totalPoint')
            .eq('id',UserId)
            .single()
            .then(data=>{
                supabase.from("Users")
                    .update({
                        totalPoint:(data.body?.totalPoint||0) + increment
                    })
                    .eq('id',UserId)
                    .then()
            })
    }
}

module.exports = UserController