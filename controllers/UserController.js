const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")
const ChannelController = require("./ChannelController")

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
		if(!pointLeft) return ChannelController.sendError(`update point ${pointLeft} - ${userId}`)
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
			.gte('lastDone',Time.getDateOnly(Time.getNextDate(-14)))
	}

	static async getTotalPoint(userId){
        const data = await supabase.from("Users")
            .select('totalPoint')
            .eq('id',userId)
            .single()
        return data.body.totalPoint
    }

	static async getNotificationId(userId){
		const data = await supabase.from("Users")
			.select('notificationId')
			.eq('id',userId)
			.single()
		return data.body.notificationId
	}

	static async incrementTotalPoints(increment,id_user){
		if(!increment) return ChannelController.sendError(`update point ${increment} - ${id_user}`)
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