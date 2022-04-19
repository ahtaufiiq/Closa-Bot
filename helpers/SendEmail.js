const nodemailer = require('nodemailer');
const { EMAIL_PASS } = require('./config');
class SendEmail {
    static init(){
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: 'closa.app@gmail.com',
                pass: EMAIL_PASS,
            },
            });
        return transporter
    }
    static reminderPayment(name,email,reminder,date){
        const transporter =  this.init()
        const linkForm = 'https://tally.so/r/wbRa2w'
        transporter.sendMail({
            from: '"Closa" <closa.app@gmail.com>', // sender address
            to: email, // list of receivers
            subject: "Membership Subscription Reminder — Closa", // Subject line
            html: `Hi ${name} ,
                <br>    
                Thank you for being part of Closa Community.
                <br><br>
                <b>A friendly reminder that your Closa membership will be ended within the next ${reminder} on ${date}. 
                <br>
                You can extend your membership period via this link</b>—  ${linkForm}
                <br><br>
                You can reply to this email if you have any questions or concerns.
                <br><br>
                Regards,
                <br>
                Apri, Co-founder @ Closa`, // html body
        }).then(info => {
            console.log({info});
        }).catch(console.error);
    }

    static membershipRenewal(name,email,date){
        const transporter =  this.init()
        transporter.sendMail({
            from: '"Closa" <closa.app@gmail.com>', // sender address
            to: email, // list of receivers
            subject: "Membership Renewal — Closa", // Subject line
            html: `Hi ${name} ,
                <br>    
                Your membership status already extended until ${date}.
                <br>    
                Thank you for your support to closa community!
                <br><br>
                Regards,
                <br>
                Apri, Co-founder @ Closa`, // html body
        }).then(info => {
            console.log({info});
        }).catch(console.error);
    }
}

module.exports = SendEmail