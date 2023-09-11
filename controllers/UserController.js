const DiscordWebhook = require("../helpers/DiscordWebhook")
const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")

class UserController{
	static async updateData(data,userId){
		return await supabase.from("Users")
		.update(data)
		.eq('id',userId)
	}
	
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
		if(!pointLeft) return DiscordWebhook.sendError(`update point ${pointLeft} - ${userId}`)
        return await supabase.from("Users")
            .update({totalPoint:pointLeft})
            .eq('id',userId)
    }

	static async getDetail(userId,select=undefined){
		return await supabase.from("Users")
			.select(select)
			.eq('id',userId)
			.single()
	}

	static async getAllMembers(select=undefined){
		return await supabase.from("Users")
			.select(select)
	}

	static async getActiveMembers(select=undefined){
		return await supabase.from("Users")
			.select(select)
			.gte('endMembership',Time.getTodayDateOnly())
			.gte('lastActive',Time.getDateOnly(Time.getNextDate(-14)))
	}

	static async getTotalPoint(userId){
        const data = await supabase.from("Users")
            .select('totalPoint')
            .eq('id',userId)
            .single()
        return data.data.totalPoint
    }

	static async getNotificationId(userId){
		const data = await supabase.from("Users")
			.select('notificationId')
			.eq('id',userId)
			.single()
		return data.data.notificationId
	}

	static async incrementTotalPoints(increment,id_user){
		if(!increment) return DiscordWebhook.sendError(`update point ${increment} - ${id_user}`)
		return await supabase
			.rpc('incrementTotalPoint', { increment, id_user })
    }

	static getNameFromUserDiscord(user){
		const data = {
			"659411113825402902":'saftrn'
		}
		if(data[user.id]) return data[user.id]
		else return user.username
	}

	static async updateLastActive(userId){
		return await supabase.from("Users")
			.update({
				lastActive:Time.getTodayDateOnly()
			})
			.eq('id',userId)
	}
}

module.exports = UserController