const MessageFormatting = require("../helpers/MessageFormatting")
const TemplateEmbedMessage = require("./TemplateEmbedMessage")

class RecurringMeetupMessage {
    static askToScheduleRecurringMeetup(formattedDate,meetupDate,partyId){
        return {
            content:`**Attend your first virtual party meetup!:wave: **
Your first meetup will be held next week on **${formattedDate} at 21.00 WIB :calendar_spiral: **

> \`Our goal at closa is To make it easy for you to genuinely connect, share & reflect on your progress.\`

notes:
• Your default party meetup: every tuesday at 21.00 WIB
• *the bot will create a temporary \`\`30 min\`\` discord voice room for you to join & talk on the day of meetup.
• Then the room will automatically deleted by bot*. 
• if majority people answer no then the meetup will be rescheduled.

**Confirm** @here`,
            components:[
                TemplateEmbedMessage.createComponent(
                    TemplateEmbedMessage.addButton(`attendMeetup_null_${partyId}|${meetupDate}`,'Accept'),
                    TemplateEmbedMessage.addButton(`cannotAttendMeetup_null_${partyId}|${meetupDate}`,"Decline","SECONDARY")
                )
            ]
        }
    }

    static showHowToRescheduleMeetup(formattedDate,customDate){
        return `:repeat: **The meetup automatically rescheduled in the next week:**
:calendar_spiral:**${formattedDate} at 21.30 WIB**

You can also change the schedule manually using command below:
\`\`\`/schedule meetup ${customDate} at 21.00\`\`\`
ps: *feel free to discuss with other member to adjust the time and date according to aligned schedule.*`
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

    static countdownMeetup(min,channelId){
        return `\`\`The virtual meetup just started!\`\` @here

\`\`⏳\`\`the room will be ended in → **${min} min** (${min===0 ? "ended":'live'})
\`\`📜\`\` _turn on video to have a proper conversation._

let's have a good time~
Join here → ${MessageFormatting.tagChannel(channelId)}`
    }

    static countdownMeetupVoiceChat(min){
        return `\`\`⏳\`\`the room will be ended in → **${min} min** (${min===0 ? "ended":'live'})
\`\`📜\`\` _turn on video to have a proper conversation._

cc: @here `
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