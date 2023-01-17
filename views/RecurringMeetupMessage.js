const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")

class RecurringMeetupMessage {
    static askToScheduleRecurringMeetup(formattedDate,meetupDate,partyId){
        return {
            content:`**Attend your first virtual party meetup!:wave: **
Your first meetup will be held next week on **${formattedDate} at 21.00 WIB :calendar_spiral: **

> \`Our goal at closa is To make it easy for you to genuinely connect, share & reflect on your progress.\`

notes:
• Your default party meetup: every tuesday at \`21.00 WIB\`
• Minimum \`2 people\` accepted to host the meetup.
• *the bot will create a temporary \`\`30 min\`\` discord voice room for you to join & talk on the day of meetup.
• Then the room will automatically deleted by bot*. 
• if majority people answer no then the meetup will be rescheduled.

**Confirm** @everyone`,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`attendMeetup_null_${partyId}|${meetupDate}`,'Accept'),
                    MessageComponent.addButton(`cannotAttendMeetup_null_${partyId}|${meetupDate}`,"Decline","DANGER"),
                    MessageComponent.addButton(`rescheduleMeetup_null_${partyId}`,"Reschedule","SECONDARY"),
                )
            ]
        }
    }

    static showHowToRescheduleMeetup(formattedDate,customDate,partyId){
        return {
            content:`:repeat: **The meetup automatically rescheduled**
:calendar_spiral:**${formattedDate} at 21.30 WIB**

You can also change the schedule manually using command below:
\`\`\`/schedule meetup ${customDate} at 21.00\`\`\`
Also you can reschedule manually using the button below:`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`rescheduleMeetup_null_${partyId}`,"Reschedule")
            )]
        }
    }

    static confirmationTwoDaysBeforeMeetup(partyId,weeklyMeetupId,meetupTime,linkCalendar){
        return {
            content:`**Reminder** 🔔

Hi @everyone it's 2 days before the next virtual meetup begin.

**on ${meetupTime} WIB**
p.s: minimal 2 people accepted the invitation to host virtual meetup.

\`\`Please confirm your attendance\`\``,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`acceptConfirmationMeetup_null_${partyId}|${weeklyMeetupId}`,'Yes'),
                    MessageComponent.addButton(`declineConfirmationMeetup_null_${partyId}|${weeklyMeetupId}`,"No","SECONDARY"),
                    MessageComponent.addLinkButton('Add to calendar',linkCalendar)
                )
            ]
        }
    }

    static reminderOneDayBeforeMeetup(meetupTime){
        return `🔔 **A friendly reminder** @everyone! 
\`\`Tomorrow ${meetupTime} WIB\`\` is our virtual meetup session. 

see you soon everyone!`
    }

    static reminderOneHourBeforeMeetup(){
        return `Today is the day! 
\`\`1h\`\` before the virtual meetup begin @everyone`
    }

    static reminderTenMinBeforeMeetup(){
        return `\`\`10 min\`\` before the party meetup session begin! @everyone 
prepare your seat & chill ✨`
    }

    static remindSomeoneToAcceptMeetup(tagMembers){
        return `Hi ${tagMembers} please confirm your virtual meetup attendance to the message above.`
    }

    static cannotSetMeetupAfterCelebrationDay(){
        return "Cannot set more than celebration day."
    }

    static meetupSuccessfullyScheduled(meetupDate){
        return `:white_check_mark: \`\`Meetup successfully scheduled\`\` on **${meetupDate}**`
    }

    static notAutomaticRescheduleMeetupAfterCelebrationDay(customDate){
        return `2 people can't attend the meetup
**Please discuss & set a new schedule by typing the command below in this chat**
\`\`/schedule meetup ${customDate} at 21.00\`\`

\`\`💡\`\` Make sure to set the schedule before celebration day.`
    }

    static countdownMeetup(min,channelId){
        return `\`\`The virtual meetup ${min===0 ? "ended" : "just started"}!\`\` @everyone

\`\`⏳\`\`the room will be ended in → **${min} min** ${min===0 ? "(ended)":'🔴 **LIVE**'}
\`\`📜\`\` _turn on video to have a proper conversation._

let's have a good time~
Join here → ${MessageFormatting.tagChannel(channelId)}`
    }

    static countdownMeetupVoiceChat(min){
        return {
            content:`\`\`⏳\`\` room ended in → **${min} min** ${min===0 ? "(ended)":'🔴 **LIVE**'}
\`\`📜\`\` _turn on video to have a proper conversation._

Have a good time! @everyone

\`\`here's the guideline\`\``,
            components:[MessageComponent.createComponent(
                MessageComponent.addLinkButton("Weekly check-in guideline","https://closa.notion.site/Weekly-check-in-bb6ea395dc4e4873a182cc3e4ba194fd").setEmoji("📝")
            )]
        }
    }

    static remindUserJoinMeetupSession(channelId){
        return `Hi @everyone the virtual meetup room is ready.

Waiting for 2 people to start the virtual meetup session.

Join → ${MessageFormatting.tagChannel(channelId)}`
    }

    static reminderFiveMinutesBeforeEnded(voiceChannelId){
        return {
            content:`**Reminder**:bell: 
**5 minutes before the session end** @everyone`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`extendTemporaryVoice_null_${voiceChannelId}`,"Extend time").setEmoji("⏲")
            )]
        }
    }

    static optionExtendedTime(voiceChannelId){
        return {
            content:`**How long do you want to extend the session time?**`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`extendSession_null_${voiceChannelId}-5`,"5 min"),
                MessageComponent.addButton(`extendSession_null_${voiceChannelId}-10`,"10 min"),
                MessageComponent.addButton(`extendSession_null_${voiceChannelId}-15`,"15 min"),
                MessageComponent.addButton(`customExtend_null_${voiceChannelId}`,"Custom","SECONDARY").setEmoji("⏲"),
                MessageComponent.addButton(`cancelExtend`,"Cancel","SECONDARY"),
            )]
        }
    }

    static cancelExtendTime(){
        return `**Extend time has been canceled**`
    }

    static replyExtendTime(){
        return `Success extend time, bot will update countdown`
    }

    static successExtendTime(extendTime){
        return `**Added ${extendTime} more minutes ✅**`
    }

    static reminderTwoMinutesBeforeEnded(){
        return `**Reminder**:bell: 
\`2 minutes\` before the session end @everyone

**Let's end it with a group photo :camera_with_flash: ** 

Feel free to share your moment anywhere and tag \`\`@beclosa\`\` :smile:`
    }

    static reminderFifteenSecondsBeforeEnded(){
        return `**15s** before the voice room ended @everyone

That's a wrap! 🙌 
Thank you everyone~`
    }
}

module.exports = RecurringMeetupMessage