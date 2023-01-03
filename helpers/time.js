const {TIMEZONE} = require('../helpers/config')
const LocalData = require('./LocalData.js')
class Time {
    static haveTime(text){
        const patternTime = /\d+[.:]\d+/
        return patternTime.test(text)
    }

    static getTimeFromText(text){
        const patternTime = /\d+[.:]\d+/
        return text.match(patternTime)[0]
    }
    static getDiffDay(fromDate,toDate){
        const diff = toDate.getTime() - fromDate.getTime()
        return Math.floor(diff/ 1000 / 60 /60/24)
    }
    static getDiffTime(fromDate,toDate){
        const diff = toDate.getTime() - fromDate.getTime()
        return Math.floor(diff/ 1000 / 60 )
    }

    static getDayLeft(toDate){
        return this.getDiffDay(Time.getDate(Time.getTodayDateOnly()),toDate)
    }
    static convertTime(time,type='long'){
        let day = Math.floor((time/60/24))
        let hour = Math.floor(time/60)
        let minute = time%60
        if(day > 0){
            hour = hour % 24
            return `${formatDay(day)} ${formatHour(hour)}`
        }else if (time<60) {
          return formatMinute(minute)
        }else{
          if (minute>1) {
              return `${formatHour(hour)} ${formatMinute(minute)}`
          }else{
              return formatHour(hour)
          }
        }

        function formatDay(day) {
            if(type === 'short') return `${day} d` 
            return `${day} ${day>1?"days":"day"}`
        }
        
        function formatMinute(minute) {
            if(type === 'short') return `${minute} min`   
            if (minute==1) {
                return `${minute} minute`   
            }else{
                return `${minute} minutes`   
            }
          }
        
        function formatHour(hour) {
            if(type === 'short') return `${hour}h`   
            if (hour==1) {
                return `${hour} hour`   
            }else{
                return `${hour} hours`   
            }
          }
    }
    static getDate(customDate){
        const date= customDate ? new Date(customDate) : new Date()
        date.setHours(date.getHours()+Number(TIMEZONE))
        return date
    }

    static getBeginningOfTheMonth(month=0){
        const todayDate = this.getDate()
        const beginningMonthDate =  this.getDate(`${todayDate.getFullYear()}-${todayDate.getMonth()+1 + month}-01`)
        return beginningMonthDate
    }

    static getDay(){
        return this.getDate().toLocaleDateString("en-US", { weekday: 'long'})
    }

    static getNextDate(day=0,dateOnly){
        const date = dateOnly ? Time.getDate(dateOnly):Time.getDate()
        date.setDate(date.getDate()+day)
        return date
    }

    static getReminderDate(day=0){
        const date = this.getNextDate(day)
        return this.getDateOnly(date)
    }

    static getThisMonth(month){
        let months = ["January","February","March","April","May","June","July","August","September",'October',"November","December"]
        month = month === undefined ? this.getDate().getMonth() : month < 0 ? month + 12 : month
        return months[month]
    }

    static convertMonthInNumber(month){
        let listMonth = {
            "january":0,
            "february":1,
            "march":2,
            "april":3,
            "may":4,
            "june":5,
            "july":6,
            "august":7,
            "september":8,
            'october':9,
            "november":10,
            "december":11
        }
        const monthInNumber = listMonth[month.trim().toLowerCase()]
        
        return monthInNumber === undefined ? -1 : monthInNumber
    }

    static minus7Hours(hour){
    	hour = hour - Number(TIMEZONE)		
        return hour < 0 ? 24 + hour : hour
    }

    static isYesterday(date) {
        const todayDate = Time.getDate()
    
        todayDate.setDate(todayDate.getDate()-1)
        const stringDate = todayDate.toISOString().substring(0,10)
        
        return stringDate === date
    }
    
    static getDateOnly(date){
        return date.toISOString().substring(0,10) //2022-04-26
    }
    static getTodayDateOnly(){
        return this.getDate().toISOString().substring(0,10)
    }
    static getTomorrowDateOnly(){
        return Time.getDateOnly(Time.getNextDate(1))
    }
    static getFormattedDate(date,showDay=false,dateStyle='medium',showTime=false){
        let formattedDate = date.toLocaleDateString("en-US", { dateStyle}) //Apr 26, 2022

        if (showDay ) {
            const [month,date,year] = formattedDate.split(/[, ]+/)
            formattedDate = `${Time.getDay()}, ${date} ${month} ${year}` //Tuesday, 29 Oct, 2022
        }

        if(showTime){
            formattedDate += ` at ${date.getHours()}.${date.getMinutes()}`
        }
        return formattedDate
    }
    
    static isVacationMode(date) {
        const todayDate = Time.getDate()
        let stringDate = todayDate.toISOString().substring(0,10)
    
        if (todayDate.getDay() === 1) {
            todayDate.setDate(todayDate.getDate()-1)
            if (stringDate === date) {
                return true
            }
            todayDate.setDate(todayDate.getDate()-1)
            stringDate = todayDate.toISOString().substring(0,10)
            if (stringDate === date) {
                return true
            }
            todayDate.setDate(todayDate.getDate()-1)
            stringDate = todayDate.toISOString().substring(0,10)
            if (stringDate === date) {
                return true
            }
        }else if(todayDate.getDay() === 0){
            todayDate.setDate(todayDate.getDate()-1)
            if (stringDate === date) {
                return true
            }
            todayDate.setDate(todayDate.getDate()-1)
            stringDate = todayDate.toISOString().substring(0,10)
            if (stringDate === date) {
                return true
            }
        }
        return false
    }

    static isValidCooldownPeriod(lastDone){
        const {kickoffDate} = LocalData.getData()
		const oneDayBeforeCelebrationDay = Time.getDateOnly(Time.getNextDate(-8,kickoffDate))
		const isFirstDayAfterKickoff = Time.getDateOnly(Time.getNextDate(-34,kickoffDate)) === Time.getTodayDateOnly()
        return (this.isCooldownPeriod() || isFirstDayAfterKickoff) && lastDone >= oneDayBeforeCelebrationDay
    }

    static isCooldownPeriod(){
		const {kickoffDate} = LocalData.getData()
		const startCooldownPeriod = Time.getDateOnly(Time.getNextDate(-7,kickoffDate))
		const todayDate = Time.getTodayDateOnly()
		return todayDate >= startCooldownPeriod && todayDate <= kickoffDate
	}

    static isFirstDayCooldownPeriod(){
        const {kickoffDate} = LocalData.getData()
		const startCooldownPeriod = Time.getDateOnly(Time.getNextDate(-7,kickoffDate))
		const todayDate = Time.getTodayDateOnly()
		return todayDate === startCooldownPeriod
    }

    static isValidStreak(currentStreak,lastDone,lastSafety) {
        return this.isYesterday(lastDone) || this.isYesterday(lastSafety) || (this.onlyMissOneDay(lastDone,lastSafety) && currentStreak > 2)
    }

    static onlyMissOneDay(lastDone,lastSafety){
        return lastDone === this.getDateOnly(this.getNextDate(-2)) || lastSafety === this.getDateOnly(this.getNextDate(-2))
    }

    static addDateByWeek(dateOnly,totalweek){
        const date = Time.getDate(dateOnly)
        date.setDate(date.getDate() + (totalweek * 7))
        return Time.getDateOnly(date)
    }

    static getEndMembership(totalMonth,dateMembership ) {
        const date = Time.getDate(dateMembership)
        date.setMonth(date.getMonth() + totalMonth)
        return date.toISOString().substring(0,10)
    }

    static isMoreThanOneMinute(date) {
        if(date === null || date === undefined) return true
        const diff = Time.getDate().getTime() - Time.getDate(date).getTime()
        const diffInMinute = Math.ceil(diff / 1000/60)
        return diffInMinute > 1
    }

    static getNextTuesdayDate(){
        const day = Time.getDate().getDay()
        let date
        if (day === 2) {
            date = Time.getNextDate(7)
        }else if(day < 2){
            date = Time.getNextDate(2 - day)
        }else {
            date = Time.getNextDate(7 - (day - 2) )
        }
        return date
    }

}

module.exports = Time