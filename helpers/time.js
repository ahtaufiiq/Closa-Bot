const {TIMEZONE} = require('../helpers/config')
class Time {
    static haveTime(text){
        const patternTime = /\d+[.:]\d+/
        return patternTime.test(text)
    }

    static getTimeFromText(text){
        const patternTime = /\d+[.:]\d+/
        return text.match(patternTime)[0]
    }
    static convertTime(time,type='long'){
        let hour = Math.floor(time/60)
        let minute = time%60
        if (time<60) {
          return formatMinute(minute)
        }else{
          if (minute>1) {
              return `${formatHour(hour)} ${formatMinute(minute)}`
          }else{
              return formatHour(hour)
          }
        }
        
        function formatMinute(minute) {
            if(type === 'short') return `${minute} m`   
            if (minute==1) {
                return `${minute} minute`   
            }else{
                return `${minute} minutes`   
            }
          }
        
        function formatHour(hour) {
            if(type === 'short') return `${hour} h`   
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

    static getNextDate(day=0){
        const date = Time.getDate()
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
    static getFormattedDate(date){
        return date.toLocaleDateString("en-US", { dateStyle:'medium'}) //Apr 26 2022
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

    static isValidStreak(date,currentStreak) {
        return this.isYesterday(date) || (this.onlyMissOneDay(date) && currentStreak > 3)
    }

    static onlyMissOneDay(date){
        return date === this.getDateOnly(this.getNextDate(-2))
    }

    static getEndMembership(typeMembership,total,dateMembership) {
        const date = new Date(dateMembership)
        if (typeMembership.includes('Month')) {
            const totalMonth = date.getMonth()+ Number(total)
            date.setMonth(totalMonth)
        }else if(typeMembership.includes('Year')){
            const totalYear = date.getFullYear() + Number(total)
            date.setFullYear(totalYear)
        }
        date.setDate(20)
        return date.toISOString().substring(0,10)
    }

    static isMoreThanOneMinute(date) {
        if(date === null) return true
        const diff = Time.getDate().getTime() - Time.getDate(date).getTime()
        const diffInMinute = Math.ceil(diff / 1000/60)
        return diffInMinute > 1
    }
}

module.exports = Time