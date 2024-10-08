const { ChannelType } = require("discord.js");
const { CHANNEL_TODO, CHANNEL_HIGHLIGHT, CHANNEL_TOPICS, CHANNEL_GOALS, CHANNEL_INTRO, CHANNEL_CELEBRATE, CHANNEL_SESSION_GOAL, CHANNEL_MEMES, CHANNEL_GENERAL, CHANNEL_FORUM } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");
const UserController = require("./UserController");

class PointController{
    static addPoint(UserId,type,minute,channelId){
        if(type === ChannelType.GuildText){
            if(channelId !== CHANNEL_SESSION_GOAL && channelId !== CHANNEL_GENERAL && channelId !== CHANNEL_TODO) return
        }else if(type === ChannelType.PublicThread) return
        else if(type === 'reaction') return
        
        supabase.from("Points")
            .select()
            .eq("UserId",UserId)
            .single()
            .then(data => {
                const totalPoint = this.calculatePoint(type,minute,channelId)
                let key,value 
                switch (type) {
                    case ChannelType.GuildText:
                        if (channelId === CHANNEL_GENERAL && Time.isMoreThanOneMinute(data.data?.lastTimeChatGeneral)) {
                            key = 'lastTimeChatGeneral'
                            value = new Date()
                        }else if(channelId === CHANNEL_MEMES && !PointController.isTodayDate(data.data?.lastDateMemes)){
                            key = "lastDateMemes"
                            value = Time.getTodayDateOnly()
                        }else if(channelId === CHANNEL_SESSION_GOAL && !PointController.isTodayDate(data.data?.lastDateSessionGoal)){
                            key = "lastDateSessionGoal"
                            value = Time.getTodayDateOnly()
                        }else if(channelId === CHANNEL_FORUM && !PointController.isTodayDate(data.data?.lastDateForum)){
                            key = "lastDateForum"
                            value = Time.getTodayDateOnly()
                        }else if(channelId === CHANNEL_CELEBRATE && PointController.isBiweeklyDate(data.data?.lastDateCelebrate)){
                            key = "lastDateCelebrate"
                            value = Time.getTodayDateOnly()
                        }else if(channelId === CHANNEL_GOALS && PointController.isBiweeklyDate(data.data?.lastDateGoal)){
                            key = "lastDateGoal"
                            value = Time.getTodayDateOnly()
                        }
                        break;
                    case ChannelType.PublicThread:
                        if(Time.isMoreThanOneMinute(data.data?.lastTimeChatThread)){
                            key = 'lastTimeChatThread'
                            value = new Date()
                        }
                        break;
                    case "goal":
                        if(PointController.isBiweeklyDate(data.data?.lastDateGoal)){
                            key = 'lastDateGoal'
                            value = Time.getTodayDateOnly()
                        }
                        break;
                    case "reaction":
                        if(Time.isMoreThanOneMinute(data.data?.lastTimeReaction)){
                            key = "lastTimeReaction"
                            value = new Date()
                        }
                        break;
                }

                if(data?.data === null){
                    if(key){
                        supabase.from("Points")
                            .insert({
                                UserId,
                                [key]:value,
                            })
                            .then()
                    }
                }else{
                    if(key){
                        supabase.from("Points")
                            .update({
                                [key]:value,
                                updatedAt:new Date()
                            })
                            .eq("UserId",UserId)
                            .then()
                    }
                }
                if(key || type === 'voice' || type === 'boost'){
                    UserController.incrementTotalPoints(totalPoint,UserId)
                }
            })
    }


    static calculatePoint(type,minute,channelId){
        let finalPoint = 1
        switch (type) {
            case ChannelType.GuildText:
                switch (channelId) {
                    case CHANNEL_GENERAL:
                        finalPoint = PointController.randomNumber(1,5)
                        break;
                    case CHANNEL_MEMES:
                        finalPoint = PointController.randomNumber(10,20)
                        break;
                    case CHANNEL_SESSION_GOAL:
                        finalPoint = PointController.randomNumber(10,20)
                        break;
                    case CHANNEL_TODO:
                        finalPoint = PointController.randomNumber(10,50)
                        break;
                }
                break;
            case ChannelType.PublicThread:
                finalPoint = PointController.randomNumber(1,5)
                break;
            case 'voice':
                finalPoint = minute
                break
            case 'goal':
                finalPoint = PointController.randomNumber(100,300)
                break
            case 'celebration':
                finalPoint = PointController.randomNumber(100,300)
                break
            case 'intro':
                finalPoint = PointController.randomNumber(100,150)
                break
            case 'reflection':
                finalPoint = PointController.randomNumber(100,150)
                break
            case 'highlight':
                finalPoint = PointController.randomNumber(10,50)
                break
            case 'boost':
                finalPoint = PointController.randomNumber(1,10)
                break;
            case 'personalBoost':
                finalPoint = PointController.randomNumber(1,25)
                break;
        }
        return finalPoint
    }

    static randomNumber(start,end){
        const diff = end-start
        return Math.floor(Math.random()*diff) + start
    }

    static async validateTimeBoost(senderId,targetUserId){
		const id = `${senderId}_${targetUserId}`
		let data = await supabase.from("Boosts")
			.select()
			.eq("id",id)
			.single()
        
        const result = {
            isMoreThanOneMinute:false,
            isIncrementPoint:false
        }

		if(data?.data){
            const lastBoostDate = Time.getDateOnly(Time.getDate(data.data.lastBoost))
			if (Time.isMoreThanOneMinute(data.data.lastBoost)) result.isMoreThanOneMinute = true
            if(lastBoostDate !== Time.getTodayDateOnly()) result.isIncrementPoint = true
		}else{
			result.isMoreThanOneMinute = true
		}
		return result
	}

    static isTodayDate(dateOnly){
        if(dateOnly === null || dateOnly === undefined) return false
        return dateOnly === Time.getTodayDateOnly()
    }

    static isBiweeklyDate(dateOnly){
        if(dateOnly === null || dateOnly === undefined) return true
        return dateOnly <= Time.getDateOnly(Time.getNextDate(-14))
    }
}

module.exports = PointController