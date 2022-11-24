const { CHANNEL_TODO, CHANNEL_HIGHLIGHT, CHANNEL_TOPICS, CHANNEL_GOALS, CHANNEL_INTRO, CHANNEL_CELEBRATE, CHANNEL_SESSION_GOAL, CHANNEL_MEMES, CHANNEL_GENERAL, CHANNEL_FORUM } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");

class PointController{
    static addPoint(UserId,type,minute,channelId){
        supabase.from("Points")
            .select()
            .eq("UserId",UserId)
            .single()
            .then(data => {
                const totalPoint = this.calculatePoint(type,minute,channelId)
                let key,value 
                switch (type) {
                    case "GUILD_TEXT":
                        if (channelId === CHANNEL_GENERAL && Time.isMoreThanOneMinute(data.body?.lastTimeChatGeneral)) {
                            key = 'lastTimeChatGeneral'
                            value = new Date()
                        }else if(channelId === CHANNEL_MEMES && !PointController.isTodayDate(data.body?.lastDateMemes)){
                            key = "lastDateMemes"
                            value = Time.getTodayDateOnly()
                        }else if(channelId === CHANNEL_SESSION_GOAL && !PointController.isTodayDate(data.body?.lastDateSessionGoal)){
                            key = "lastDateSessionGoal"
                            value = Time.getTodayDateOnly()
                        }else if(channelId === CHANNEL_FORUM && !PointController.isTodayDate(data.body?.lastDateForum)){
                            key = "lastDateForum"
                            value = Time.getTodayDateOnly()
                        }else if(channelId === CHANNEL_CELEBRATE && PointController.isBiweeklyDate(data.body?.lastDateCelebrate)){
                            key = "lastDateCelebrate"
                            value = Time.getTodayDateOnly()
                        }else if(channelId === CHANNEL_GOALS && PointController.isBiweeklyDate(data.body?.lastDateGoal)){
                            key = "lastDateGoal"
                            value = Time.getTodayDateOnly()
                        }
                        break;
                    case "GUILD_PUBLIC_THREAD":
                        if(Time.isMoreThanOneMinute(data.body?.lastTimeChatThread)){
                            key = 'lastTimeChatThread'
                            value = new Date()
                        }
                        break;
                    case "goal":
                        if(PointController.isBiweeklyDate(data.body?.lastDateGoal)){
                            key = 'lastDateGoal'
                            value = Time.getTodayDateOnly()
                        }
                        break;
                    case "reaction":
                        if(Time.isMoreThanOneMinute(data.body?.lastTimeReaction)){
                            key = "lastTimeReaction"
                            value = new Date()
                        }
                        break;
                }

                if(data?.body === null){
                    if(key){
                        console.log(`insertData: ${key} -> ${totalPoint}`);
                        supabase.from("Points")
                            .insert({
                                UserId,
                                [key]:value,
                            })
                            .then()
                    }
                }else{
                    if(key){
                        console.log(`updateData: ${key} -> ${totalPoint}`);
                        supabase.from("Points")
                            .update({
                                [key]:value,
                                updatedAt:new Date()
                            })
                            .eq("UserId",UserId)
                            .then()
                    }
                }
                if(key || type === 'cafe' || type === 'boost'){
                    console.log('increment point',type);
                    this.incrementTotalPoints(totalPoint,UserId)
                }
            })
    }


    static calculatePoint(type,minute,channelId){
        let finalPoint = 1
        switch (type) {
            case 'GUILD_TEXT':
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
                    case CHANNEL_HIGHLIGHT:
                        finalPoint = PointController.randomNumber(10,50)
                        break;
                    case CHANNEL_INTRO:
                        finalPoint = PointController.randomNumber(50,100)
                        break;
                    case CHANNEL_CELEBRATE:
                        finalPoint = PointController.randomNumber(100,300)
                        break;
                    case CHANNEL_GOALS:
                        finalPoint = PointController.randomNumber(100,300)
                        break;
                }
                break;
            case 'GUILD_PUBLIC_THREAD':
                finalPoint = PointController.randomNumber(1,5)
                break;
            case 'cafe':
                finalPoint = Math.floor(minute / 20) * PointController.randomNumber(20,50)
                break
            case 'goal':
                finalPoint = PointController.randomNumber(100,300)
                break
            case 'boost':
                finalPoint = PointController.randomNumber(1,10)
                break;
        }
        return finalPoint
    }

    static randomNumber(start,end){
        const diff = end-start
        return Math.floor(Math.random()*diff) + start
    }

    static incrementTotalPoints(increment,UserId){
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

		if(data?.body){
            const lastBoostDate = Time.getDateOnly(Time.getDate(data.body.lastBoost))
			if (Time.isMoreThanOneMinute(data.body.lastBoost)) result.isMoreThanOneMinute = true
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