class PaymentMessage{
    static remindEndedMembership(user,endedMembership){
        return `Hi ${user} :wave:,
Thank you for being part of Closa Community :sparkles:.

**A friendly reminder that your Closa membership will be ended within the next 1 day  on ${endedMembership}.
You can extend your membership period via this link**—  https://tally.so/r/wbRa2w`
    }
}

module.exports = PaymentMessage