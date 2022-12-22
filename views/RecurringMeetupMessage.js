const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")

class RecurringMeetupMessage {
    static askToScheduleRecurringMeetup(formattedDate,meetupDate,partyId){
        return {
            content:`**Attend your first virtual party meetup!:wave: **
Your first meetup will be held next week on **${formattedDate} at 21.00 WIB :calendar_spiral: **

> \`Our goal at closa is To make it easy for you to genuinely connect, share & reflect on your progress.\`

notes:
• Minimum 2 people accepted to host the meetup.
• Your default party meetup: every tuesday at 21.00 WIB
• *the bot will create a temporary \`\`30 min\`\` discord voice room for you to join & talk on the day of meetup.
• Then the room will automatically deleted by bot*. 
• if majority people answer no then the meetup will be rescheduled.

**Confirm** @here`,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`attendMeetup_null_${partyId}|${meetupDate}`,'Accept'),
                    MessageComponent.addButton(`cannotAttendMeetup_null_${partyId}|${meetupDate}`,"Decline","SECONDARY")
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

    static reminderOneDayBeforeMeetup(){
        return `🔔 **A friendly reminder** @here! 
\`\`Tomorrow\`\` is our virtual meetup session, see you soon everyone!`
    }

    static reminderOneHourBeforeMeetup(){
        return `Today is the day! 
\`\`1h\`\` before the virtual meetup begin @here`
    }

    static reminderTenMinBeforeMeetup(){
        return `\`\`10 min\`\` before the party meetup session begin! @here 
prepare your seat & chill ✨`
    }

    static remindSomeoneToAcceptMeetup(tagMembers){
        return `Hi ${tagMembers} please confirm your virtual meetup attendance to the message above.`
    }

    static confirmationTwoDaysBeforeMeetup(partyId,weeklyMeetupId,meetupTime){
        return {
            content:`**on ${meetupTime}**
p.s: minimal 2 people accepted the invitation to host virtual meetup.

\`\`Please confirm your attendance\`\``,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`acceptConfirmationMeetup_null_${partyId}|${weeklyMeetupId}`,'Yes'),
                    MessageComponent.addButton(`declineConfirmationMeetup_null_${partyId}|${weeklyMeetupId}`,"No","SECONDARY")
                )
            ]
        }
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
        return `\`\`The virtual meetup just started!\`\` @here

\`\`⏳\`\`the room will be ended in → **${min} min** ${min===0 ? "(ended)":'🔴 **LIVE**'}
\`\`📜\`\` _turn on video to have a proper conversation._

let's have a good time~
Join here → ${MessageFormatting.tagChannel(channelId)}`
    }

    static countdownMeetupVoiceChat(min){
        return {
            content:`Have a good time! @here

\`\`⏳\`\`the room will be ended in → **${min} min** ${min===0 ? "(ended)":'🔴 **LIVE**'}
\`\`📜\`\` _turn on video to have a proper conversation._

\`\`here's the icebreaker questions (if you need it)\`\``,
            components:[MessageComponent.createComponent(
                MessageComponent.addLinkButton("Icebreaker questions","https://closa.notion.site/Icebreaker-Questions-a26d658e90984fb38b37f86d156dcfbe")
            )]
        }
    }

    static remindUserJoinMeetupSession(channelId){
        return `Hi @here the virtual meetup room is ready.

Waiting for 2 people to start the virtual meetup session.

Join → ${MessageFormatting.tagChannel(channelId)}`
    }

    static reminderFiveMinutesBeforeEnded(){
        return `**Reminder**:bell: 

\`5 minutes\` before the party end @here
**Let's end it with a group photo :camera_with_flash: ** 

Feel free to share your moment anywhere :smile:`
    }

    static reminderFifteenSecondsBeforeEnded(){
        return `**15s** before the voice room ended @here

That's a wrap! 🙌 
Thank you everyone~`
    }
}

module.exports = RecurringMeetupMessage