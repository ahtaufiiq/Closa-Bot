const {TIMEZONE} = require('../helpers/config')
class Time {
    static convertTime(time){
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
            if (minute==1) {
                return `${minute} minute`   
            }else{
                return `${minute} minutes`   
            }
          }
        
        function formatHour(hour) {
            if (hour==1) {
                return `${hour} hour`   
            }else{
                return `${hour} hours`   
            }
          }
    }
    static getDate(){
        const date= new Date()
        date.setHours(date.getHours()+Number(TIMEZONE))
        return date
    }

    static getThisMonth(){
        let months = ["January","February","March","April","May","June","July","August","September",'October',"November","December"]
        let today = this.getDate()
        return months[today.getMonth()]
    }
    static minus7Hours(hour){
    	hour = hour - Number(TIMEZONE)		
        return hour < 0 ? 24 + hour : hour
    }
}

module.exports = Time