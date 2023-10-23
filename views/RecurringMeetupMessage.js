const MessageComponent = require("../helpers/MessageComponent")
const MessageFormatting = require("../helpers/MessageFormatting")

class RecurringMeetupMessage {
    static askToScheduleRecurringMeetup(coworkingTime,partyId,tagPartyMembers){
        return {
            content:`Schedule default coworking time :woman_technologist::man_technologist:🕗

current default coworking time:
at **${coworkingTime} WIB every day.**
starting tomorrow.

you can also discuss with others to change the time.
↓
please confirm ${tagPartyMembers}`,
            components:[
                MessageComponent.createComponent(
                    MessageComponent.addButton(`attendMeetup`,'Confirm'),
                    MessageComponent.addButton(`cannotAttendMeetup`,"Skip","SECONDARY"),
                    MessageComponent.addButton(`rescheduleMeetup_null_${partyId}`,"Change time","SECONDARY"),
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

    static confirmationTwoDaysBeforeMeetup(partyId,weeklyMeetupId,meetupTime,linkCalendar,tagPartyMembers){
        return {
            content:`**Reminder** 🔔

Hi ${tagPartyMembers} it's 2 days before the next virtual meetup begin.

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

    static reminderOneDayBeforeMeetup(meetupTime,tagPartyMembers){
        return `🔔 **A friendly reminder** ${tagPartyMembers}! 
\`\`Tomorrow ${meetupTime} WIB\`\` is our virtual meetup session. 

see you soon everyone!`
    }

    static reminderOneHourBeforeMeetup(tagPartyMembers,partyId,coworkingTime){
        return {
            content:`Reminder 🔔

\`\`1 hour\`\` before coworking session started at ${coworkingTime} WIB

please confirm your attendance: ${tagPartyMembers}`,
            components:[MessageComponent.createComponent(
                MessageComponent.addButton(`attendMeetup`,'Yes'),
                MessageComponent.addButton(`cannotAttendMeetup`,"No","SECONDARY"),
                MessageComponent.addButton(`rescheduleMeetup_null_${partyId}`,"Reschedule","SECONDARY"),
            )]
        }
    }

    static reminderTenMinBeforeMeetup(tagPartyMembers){
        return `\`\`10 min\`\` before the party meetup session begin! ${tagPartyMembers}
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
                MessageComponent.addLinkEmojiButton("Weekly check-in guideline","https://closa.notion.site/Weekly-check-in-bb6ea395dc4e4873a182cc3e4ba194fd","📝")
            )]
        }
    }

    static remindUserJoinMeetupSession(channelId,tagPartyMembers,coworkingTime='20.00'){
        return {
            content:`\`\`5 minutes\`\` before coworking started at ${coworkingTime} WIB :bell:

1. Please join now: ${tagPartyMembers}
2. Turn-on video/sharescreen :camera: / :computer: *required or auto-kick (rules).
3. Read: [How to host coworking session ↗](https://closa.me/coworking-guideline) :woman_technologist::man_technologist:

${MessageFormatting.linkToChannel(channelId)}`,
        }
    }

    static reminderFiveMinutesBeforeEnded(voiceChannelId){
        return {
            content:`**Reminder**:bell: 
**5 minutes before the session end** @everyone`,
            components:[MessageComponent.createComponent(
                MessageComponent.addEmojiButton(`extendTemporaryVoice_null_${voiceChannelId}`,"Extend time","⏲")
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
                MessageComponent.addEmojiButton(`customExtend_null_${voiceChannelId}`,"Custom","⏲","SECONDARY"),
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

Feel free to share your moment anywhere and tag \`\`@joinclosa\`\` :smile:`
    }

    static reminderFifteenSecondsBeforeEnded(){
        return `**15s** before the voice room ended @everyone

That's a wrap! 🙌 
Thank you everyone~`
    }

    static guidelineForFirstJoinedVoiceChannel(UserId){
        return {
            content:`Please read the coworking guideline below ${MessageFormatting.tagUser(UserId)} & others.

Please start your session in 2 mins (to avoid auto-kick)
↳ write 1 specific task at ⁠#session-goals (if you haven't)`,
            components:[MessageComponent.createComponent(
                MessageComponent.addLinkButton('How to host coworking session','https://closa.me/coworking-guideline')
            )]
        }
    }
}

module.exports = RecurringMeetupMessage