const schedule = require('node-schedule');
const Email = require('../helpers/Email');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const PaymentMessage = require('../views/PaymentMessage');

class PaymentController{

    static getEndedMembership(dayLeft=0){
        return supabase.from('Users')
        .select('email,name')
        .eq('end_membership',Time.getReminderDate(dayLeft))
    }
    static async remindMember(client){
        
        let rulePaymentReminder = new schedule.RecurrenceRule();
		rulePaymentReminder.hour = Time.minus7Hours(8)
		rulePaymentReminder.minute = 0
		schedule.scheduleJob(rulePaymentReminder,function(){
            
            PaymentController.getEndedMembership(5)
                .then(async data=>{
                    if (data.body) PaymentController.sendEmailReminder(data.body,5)
                })

            PaymentController.getEndedMembership(3)
                .then(async data=>{
                    if (data.body) PaymentController.sendEmailReminder(data.body,3)
                })
			PaymentController.getEndedMembership(1)
                .then(async data=>{
                    if (data.body) {
                        PaymentController.sendEmailReminder(data.body,1)
                        PaymentController.sendDiscordReminder(client,data.body,1)
                    }
                })
			PaymentController.getEndedMembership()
                .then(async data=>{
                    if (data.body) {
                        PaymentController.sendEmailReminder(data.body,0)
                        PaymentController.sendDiscordReminder(client,data.body,0)
                    }
                })
		
		})
    }

    static sendEmailReminder(members,dayLeft=0){
        const endedMembership = Time.getFormattedDate(Time.getNextDate(dayLeft))
        Email.sendPaymentReminder(members,`${dayLeft} ${dayLeft > 1 ?"days":"day"}`,endedMembership)
    }

    static async sendDiscordReminder(client, members,dayLeft){
        const endedMembership = Time.getFormattedDate(Time.getNextDate(dayLeft))
        for (let i = 0; i < members.length; i++) {
            const {id} = members[i];
            const {user} = await client.guilds.cache.get(GUILD_ID).members.fetch(id)
            user.send(PaymentMessage.remindEndedMembership(user,endedMembership))
        }
    }
}

module.exports = PaymentController