const DiscordWebhook = require("../helpers/DiscordWebhook")
const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")

class AdvanceReportController{
    static getMaxCoworkingHours(days){
        let maxHour = 0
        let stats = {
            max:{
                day:'',
                time:0
            },
            min:{
                day:'',
                time:null
            }
        }
        for (const day in days) {
            const {totalTime} = days[day]
            if(totalTime > maxHour){
                maxHour = totalTime
                stats.max.day = day
            }
            if(stats.min.time === null || totalTime < stats.min.time){
                stats.min.time = totalTime
                stats.min.day = day
            }
        }

        return Math.floor(maxHour * 10 / 60)/10
    }
    static getStatsCoworking(days){
        let stats = {
            max:{
                day:'',
                time:0
            },
            min:{
                day:'',
                time:null
            },
            average:0,
            totalTime:0,
            totalDay:0
        }
        for (const day in days) {
            const {totalTime} = days[day]
            stats.totalTime += totalTime
            stats.totalDay ++
            if(totalTime > stats.max.time){
                stats.max.day = day
                stats.max.time = totalTime
            }
            if(stats.min.time === null || totalTime < stats.min.time){
                stats.min.time = totalTime
                stats.min.day = day
            }
        }
        days[stats.max.day].showTime = true
        days[stats.min.day].showTime = true
        stats.average = Math.ceil(stats.totalTime / stats.totalDay)
        return stats
    }

    static generateLeftLabel(totalTime){
        let maxHour = Math.floor(totalTime * 10 / 60)/10

        if(maxHour <= 2) return [0,0.5,1,1.5,2]
        let highestLabel
        if(maxHour % 1 !== 0) maxHour = Math.floor(maxHour) + 1

        if(maxHour % 2 === 0) highestLabel = maxHour 
        else highestLabel = maxHour + 1
        const result = []
        for (let i = 0; i < 5; i++) {
            result.push(i * highestLabel / 4)
        }
        return result
    }

    static generateListWeek(){
        const date = Time.getDate()
        const day = date.getDay() || 7
        const startingDate = Time.getNextDate(-(day-1))
        const listWeek = []
        for (let i = 0; i < 7; i++) {
            const date = new Date(startingDate.valueOf())
            date.setDate(date.getDate() + i)
            const [day,dateOfMonth,month,year] = Time.getFormattedDate(date,true).split(/[, ]+/)

            listWeek.push({
                date,
                labelHistogram: `${day.substring(0,3)} · ${dateOfMonth}`,
                formattedDate:`${dateOfMonth} ${month}, ${year}`
            })
        }
        return listWeek
    }

    static getFormattedReportDate(date){
        const [day,dateOfMonth,month,year] = Time.getFormattedDate(date,true).split(/[, ]+/)
        return `${dateOfMonth} ${month}, ${year}`
    }
    
    static getWeekDateRange(week=0){
        const date = Time.getDate()
        const day = date.getDay() || 7
        const startingDate = Time.getNextDate(-(day-1)+(7*week))
        const endingDate = Time.getNextDate(6,Time.getDateOnly(startingDate))
        
        return `${AdvanceReportController.getFormattedReportDate(startingDate)} — ${AdvanceReportController.getFormattedReportDate(endingDate)}`
    }
    static getWeekDateRangeByDate(date){
        const day = date.getDay() || 7
        const startingDate = Time.getNextDate(-(day-1),Time.getDateOnly(date))
        const endingDate = Time.getNextDate(6,Time.getDateOnly(startingDate))
        
        return `${AdvanceReportController.getFormattedReportDate(startingDate)} — ${AdvanceReportController.getFormattedReportDate(endingDate)}`
    }

    static getMostProductiveTime(productiveTime){
        const mostProductiveTime = {
            time:'-',
            total:0
        }
        
        for (const key in productiveTime) {
            const {time,total} = mostProductiveTime
            if(time === '-' || (time > key && total <= productiveTime[key])) {
                mostProductiveTime.time = key
                mostProductiveTime.total = productiveTime[key]
            }
        }
        
        return mostProductiveTime.time
    }

    static getThisDay(date){
        if(date) return Time.getDay(date,'short')
        else return Time.getDay(Time.getDate(),'short')
    }

    static generateListProductiveTime(totalTime){
        const date = Time.getDate()
        const startingDate = Time.getDate()

        // masih ada problem buat nentuin starting date
        // misal kalo startnya 9.20 -> kalo sekarang bakal di set ke 9.00
        // handle ada kemungkinan menitnya ngelebihi, makanya pake yang date
        startingDate.setMinutes(startingDate.getMinutes()-totalTime)
        const diffMinute = startingDate.getMinutes() % 30
        startingDate.setMinutes(startingDate.getMinutes()-diffMinute)

        let counterTime = -30
        let result = []
        while (counterTime < totalTime) {
            counterTime += 30
            if(counterTime > totalTime) break
            result.push(`${Time.getTimeOnly(startingDate,true)}`)
            startingDate.setMinutes(startingDate.getMinutes()+30)
        }
        return result
    }

    static async updateDataWeeklyPurchaseTicket(UserId,type){
        try {
            const dataWeeklyPurchase = await supabase.from('WeeklyPurchaseTickets')
                .select()
                .eq("UserId",UserId)
                .eq('dateRange',AdvanceReportController.getWeekDateRange())
                .single()
            if(dataWeeklyPurchase.body){
                const data = {}
                if(type === 'vacation') data.totalVacationTicket = dataWeeklyPurchase.body.totalVacationTicket + 1
                else data.totalSickTicket = dataWeeklyPurchase.body.totalSickTicket + 1

                await supabase.from("WeeklyPurchaseTickets")
                    .update(data)
                    .eq('id',dataWeeklyPurchase.body.id)
            }else{
                const data = {
                    UserId,dateRange:AdvanceReportController.getWeekDateRange()
                }
                if(type === 'vacation') data.totalVacationTicket = 1
                else data.totalSickTicket = 1

                await supabase.from("WeeklyPurchaseTickets")
                    .insert(data)
            }
        } catch (error) {
            DiscordWebhook.sendError(error,'update weekly purchase ticket ' + UserId)
        }
    }

    static async updateDataWeeklyReport(UserId,{taskName,totalTime,focusTime,breakTime},project,coworkingPartners,yesterdayProgress,week=0){
        const date = Time.getNextDate(week)
        const dateRange = AdvanceReportController.getWeekDateRangeByDate(date)
        if(yesterdayProgress){
            totalTime -= yesterdayProgress.totalTime
            focusTime -= yesterdayProgress.focusTime
            breakTime -= yesterdayProgress.breakTime
        }
        try {
            const dataWeeklyReport = await supabase.from("CoworkingWeeklyReports")
                .select()
                .eq("UserId",UserId)
                .eq('dateRange',dateRange)
                .single()
            const listProductiveTime = AdvanceReportController.generateListProductiveTime(totalTime)
            
            if(dataWeeklyReport.body){
                const {
                    dailyCoworkingStats,
                    productiveTime,
                    thisWeekStats,
                    totalSession,
                    tasks,
                    projects,
                } = dataWeeklyReport.body
                let updatedDailyCoworkingStats = false
                for (const day in dailyCoworkingStats) {
                    if(day === AdvanceReportController.getThisDay(date)){
                        dailyCoworkingStats[day].totalTime += totalTime
                        dailyCoworkingStats[day].focusTime += focusTime
                        dailyCoworkingStats[day].breakTime += breakTime
                        updatedDailyCoworkingStats = true
                        break
                    }
                }
                if(!updatedDailyCoworkingStats){
                    dailyCoworkingStats[AdvanceReportController.getThisDay(date)] = {totalTime,focusTime,breakTime,dateOnly:Time.getDateOnly(date)}
                }

                thisWeekStats.totalTime += totalTime
                thisWeekStats.focusTime += focusTime
                thisWeekStats.breakTime += breakTime
                thisWeekStats.totalSessionThisWeek += 1

                let isMatchingTaskName = false
                for (let i = 0; i < tasks.length; i++) {
                    const task = tasks[i];
                    if(task.taskName === taskName){
                        task.totalTime += totalTime
                        task.focusTime += focusTime
                        task.breakTime += breakTime
                        isMatchingTaskName = true
                    }
                }
                if(!isMatchingTaskName){
                    tasks.push({
                        taskName,totalTime,focusTime,breakTime
                    })
                }

                let isMatchingProject = false
                for (let i = 0; i < projects.length; i++) {
                    const oldProject = projects[i];
                    if(oldProject.ProjectId === project.id){
                        oldProject.totalTime += totalTime
                        isMatchingProject = true
                        break
                    }
                }
                if(!isMatchingProject){
                    projects.push({ProjectId:project.id,name:project.name,totalTime})
                }

                for (let i = 0; i < listProductiveTime.length; i++) {
                    const time = listProductiveTime[i];
                    if(productiveTime[time]) productiveTime[time]++
                    else productiveTime[time] = 1
                }

                const data = {
                    dailyCoworkingStats,productiveTime,thisWeekStats,totalSession:totalSession+1,tasks,projects,coworkingPartners
                }


                supabase.from("CoworkingWeeklyReports")
                    .update(data)
                    .eq("UserId",UserId)
                    .eq('dateRange',dateRange)
                    .then()

            }else{
                const dataUser = await supabase.from("Users")
                    .select()
                    .eq("id",UserId)
                    .single()
                const {totalFocusSession:totalSession,dailyWorkTime} = dataUser.body
                const dataLastWeek = await supabase.from("CoworkingWeeklyReports")
                    .select()
                    .eq("UserId",UserId)
                    .eq('dateRange',AdvanceReportController.getWeekDateRange(-1-week))
                    .single()
                const lastWeekStats = {
                    totalSessionLastWeek:null,
                    totalTimeLastWeek:null
                }
    
                if(dataLastWeek.body){
                    lastWeekStats.totalSessionLastWeek = dataLastWeek.body.thisWeekStats.totalSessionThisWeek
                    lastWeekStats.totalTimeLastWeek = dataLastWeek.body.thisWeekStats.totalTime
                }
    
                const productiveTime = {}
                for (let i = 0; i < listProductiveTime.length; i++) {
                    const time = listProductiveTime[i];
                    productiveTime[time] = 1
                }
                
                const data = {
                    dailyCoworkingStats:{
                        [AdvanceReportController.getThisDay()]:{
                            totalTime,focusTime,breakTime,dateOnly:Time.getTodayDateOnly()
                        }
                    },
                    productiveTime,
                    lastWeekStats,
                    thisWeekStats:{
                        focusTime,
                        breakTime,
                        totalTime,
                        totalSessionThisWeek:1
                    },
                    totalSession,
                    coworkingPartners,
                    tasks:[{taskName,totalTime,focusTime,breakTime}],
                    projects:[{ProjectId:project.id,name:project.name,totalTime}],
                    weeklyGoal:dailyWorkTime*7,
                    UserId,
                    dateRange
                }
                supabase.from("CoworkingWeeklyReports")
                    .insert(data)
                    .then()
                    
            }
        } catch (error) {
            DiscordWebhook.sendError(error,'updateDataWeeklyReport '+ UserId)
        }
    }

    static async getDataWeeklyReport(UserId,dateRange=AdvanceReportController.getWeekDateRange()){
        const [dataUser,dataWeeklyReport,dataPurchaseTicket] = await Promise.all([
            supabase.from("Users")
                .select('totalFocusSession')
                .eq('id',UserId)
                .single(),
            supabase.from("CoworkingWeeklyReports")
                .select()
                .eq("UserId",UserId)
                .eq('dateRange',dateRange)
                .single(),
            supabase.from("WeeklyPurchaseTickets")
                .select()
                .eq("UserId",UserId)
                .eq('dateRange',dateRange)
                .single()
        ])
        if(!dataWeeklyReport.body) return null
        return {
            totalSession:dataUser.body.totalFocusSession,
            ...dataWeeklyReport.body,
            totalSickTicket: dataPurchaseTicket.body?.totalSickTicket,
            totalVacationTicket: dataPurchaseTicket.body?.totalVacationTicket,
        }
    }

    static async updateDataWeeklyGoal(dailyWorkTime,UserId){
        const data = await supabase.from("CoworkingWeeklyReports").select('id')
            .eq('UserId',UserId)
            .eq('dateRange',AdvanceReportController.getWeekDateRange())
            .single()
        if(data.body){
            await supabase.from("CoworkingWeeklyReports")
                .update({weeklyGoal:dailyWorkTime*7})
                .eq('id',data.body.id)
        }
    }

    static getThumbnailOption(position,action='next'){
        let newPosition = +position + (action === 'next' ? 1 : -1)
        if(newPosition > 9) return 0
        else if(newPosition === 0) return 9
        else return newPosition
    }
}

module.exports = AdvanceReportController