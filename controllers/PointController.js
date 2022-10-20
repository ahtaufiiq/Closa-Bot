const { CHANNEL_TODO, CHANNEL_HIGHLIGHT, CHANNEL_TOPICS, CHANNEL_GOALS, CHANNEL_INTRO, CHANNEL_CELEBRATE, CHANNEL_SESSION_GOAL, CHANNEL_MEMES } = require("../helpers/config");
const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");

class PointController{
    static addPoint(UserId,type,minute,channelId){
        if (channelId === '954303982812151818' || channelId === '953578577847271455' || channelId === '990886446468575282' || channelId === '948593850690191470') return
        
        supabase.from("Points")
            .select()
            .eq('date',Time.getDateOnly(Time.getDate()))
            .eq("UserId",UserId)
            .single()
            .then(data => {
                const totalPoint = this.calculatePoint(type,minute,channelId)
                let isAddNewPoint = true
                if(data?.body === null){
                    if (type === 'chat') {
                        supabase.from("Points")
                            .insert({
                                UserId,
                                totalPoint,
                                lastChat:Time.getDate(),
                                date:Time.getDateOnly(Time.getDate())
                            })
                            .then()
                    }else if(type === 'reaction'){
                        supabase.from("Points")
                            .insert({
                                UserId,
                                totalPoint,
                                lastReaction:Time.getDate(),
                                date:Time.getDateOnly(Time.getDate())
                            })
                            .then()
                    }else{
                        supabase.from("Points")
                            .insert({
                                UserId,
                                totalPoint,
                                date:Time.getDateOnly(Time.getDate())
                            })
                            .then()
                    }
                }else{
                    if (type === 'cafe') {
                        supabase.from("Points")
                            .update({
                                totalPoint: data.body.totalPoint + totalPoint
                            })
                            .eq('date',Time.getDateOnly(Time.getDate()))
                            .eq("UserId",UserId)
                            .then()
                    }else if(type === 'focus'){
                        supabase.from("Points")
                            .update({
                                totalPoint: data.body.totalPoint + totalPoint
                            })
                            .eq('date',Time.getDateOnly(Time.getDate()))
                            .eq("UserId",UserId)
                            .then()
                    }else if(type === 'chat'){
                        if (Time.isMoreThanOneMinute(data.body.lastChat)) {
                            supabase.from("Points")
                                .update({
                                    lastChat:Time.getDate(),
                                    totalPoint: data.body.totalPoint + totalPoint
                                })
                                .eq('date',Time.getDateOnly(Time.getDate()))
                                .eq("UserId",UserId)
                                .then()
                        }else{
                            isAddNewPoint = false
                        }
                    }else if(type === 'reaction'){
                        if (Time.isMoreThanOneMinute(data.body.lastReaction)) {
                            supabase.from("Points")
                                .update({
                                    lastReaction:Time.getDate(),
                                    totalPoint: data.body.totalPoint + totalPoint
                                })
                                .eq('date',Time.getDateOnly(Time.getDate()))
                                .eq("UserId",UserId)
                                .then()
                        }else{
                            isAddNewPoint = false
                        }
                    }
                }
                if(isAddNewPoint) this.incrementTotalPoints(totalPoint,UserId)
            })
    }


    static calculatePoint(type,minute,channelId){
        let finalPoint = 1
        switch (type) {
            case 'chat':
                switch (channelId) {
                    case CHANNEL_TODO:
                        finalPoint = 25
                        break;
                    case CHANNEL_HIGHLIGHT:
                        finalPoint = 10
                        break;
                    case CHANNEL_TOPICS:
                        finalPoint = this.randomNumber(20,50)
                        break;
                    case CHANNEL_MEMES:
                        finalPoint = 10
                        break;
                    case CHANNEL_GOALS:
                        finalPoint = 100
                        break;
                    case CHANNEL_CELEBRATE:
                        finalPoint = 200
                        break;
                    case CHANNEL_INTRO:
                        finalPoint = 50
                        break;
                    case CHANNEL_SESSION_GOAL:
                        finalPoint = 10
                        break;
                    default:
                        finalPoint = 2
                        break;
                }
                break;
            case 'reaction':
                finalPoint = 1
                break;
            case 'cafe':
                finalPoint = Math.floor(minute / 25)
            case 'boost':
                finalPoint = 5
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
}

module.exports = PointController