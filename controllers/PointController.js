const supabase = require("../helpers/supabaseClient");
const Time = require("../helpers/time");

class PointController{
    static addPoint(UserId,type,minute){
        supabase.from("Points")
            .select()
            .eq('date',Time.getDateOnly(Time.getDate()))
            .eq("UserId",UserId)
            .single()
            .then(data => {
                const total_points = this.calculatePoint(type,minute)
                let isAddNewPoint = true
                if(data?.body === null){
                    if (type === 'chat') {
                        supabase.from("Points")
                            .insert({
                                UserId,
                                total_points,
                                last_chat:Time.getDate(),
                                date:Time.getDateOnly(Time.getDate())
                            })
                            .then()
                    }else if(type === 'reaction'){
                        supabase.from("Points")
                            .insert({
                                UserId,
                                total_points,
                                last_reaction:Time.getDate(),
                                date:Time.getDateOnly(Time.getDate())
                            })
                            .then()
                    }else{
                        supabase.from("Points")
                            .insert({
                                UserId,
                                total_points,
                                date:Time.getDateOnly(Time.getDate())
                            })
                            .then()
                    }
                }else{
                    if (type === 'cafe') {
                        supabase.from("Points")
                            .update({
                                total_points: data.body.total_points + total_points
                            })
                            .eq('date',Time.getDateOnly(Time.getDate()))
                            .eq("UserId",UserId)
                            .then()
                    }else if(type === 'focus'){
                        supabase.from("Points")
                            .update({
                                total_points: data.body.total_points + total_points
                            })
                            .eq('date',Time.getDateOnly(Time.getDate()))
                            .eq("UserId",UserId)
                            .then()
                    }else if(type === 'chat'){
                        if (Time.isMoreThanOneMinute(data.body.last_chat)) {
                            supabase.from("Points")
                                .update({
                                    last_chat:Time.getDate(),
                                    total_points: data.body.total_points + total_points
                                })
                                .eq('date',Time.getDateOnly(Time.getDate()))
                                .eq("UserId",UserId)
                                .then()
                        }else{
                            isAddNewPoint = false
                        }
                    }else if(type === 'reaction'){
                        if (Time.isMoreThanOneMinute(data.body.last_reaction)) {
                            supabase.from("Points")
                                .update({
                                    last_reaction:Time.getDate(),
                                    total_points: data.body.total_points + total_points
                                })
                                .eq('date',Time.getDateOnly(Time.getDate()))
                                .eq("UserId",UserId)
                                .then()
                        }else{
                            isAddNewPoint = false
                        }
                    }
                }
                if(isAddNewPoint) this.incrementTotalPoints(total_points,UserId)
            })
    }


    static calculatePoint(type,minute){
        let finalPoint = 1
        switch (type) {
            case 'chat':
                finalPoint = this.randomNumber(4,12)
                break;
            case 'reaction':
                finalPoint = this.randomNumber(1,4)
                break;
            case 'focus':
                finalPoint = minute * this.randomNumber(1,4)
                break;
            case 'cafe':
                finalPoint = minute
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
            .select('total_points')
            .eq('id',UserId)
            .single()
            .then(data=>{
                supabase.from("Users")
                    .update({
                        total_points:(data.body.total_points||0) + increment
                    })
                    .eq('id',UserId)
                    .then()
            })
    }
}

module.exports = PointController