const ChannelController = require("../controllers/ChannelController")
const { CHANNEL_TODO } = require("../helpers/config")

let accountabilityPartners = {
	"293596894410702850":["699128646270582784","410304072621752320"],
	"699128646270582784":["293596894410702850","410304072621752320"],
	"410304072621752320":["699128646270582784","293596894410702850"],
	"694910683925446668":["408275385223217154","585824427548213270"],
	"408275385223217154":["694910683925446668","585824427548213270"],
	"585824427548213270":["408275385223217154","694910683925446668"],
	"449853586508349440":["518443432365129733","615905564781969409"],
	"518443432365129733":["449853586508349440","615905564781969409"],
	"615905564781969409":["518443432365129733","449853586508349440"],
	"551025976772132874":["1008757160332754985","703533328682451004"],
	"1008757160332754985":["551025976772132874","703533328682451004"],
	"703533328682451004":["1008757160332754985","551025976772132874"],

}

class AccountabilityPartnerMessage{
    static remindPartnerAfterMissTwoDays(userId){
        return `Hi <@${userId}>, you haven't update your ${ChannelController.getStringChannel(CHANNEL_TODO)} in the last two days.
how are you doing? is everything okay? 

cc ${accountabilityPartners[userId].map(idUser=>`<@${idUser}>`)}: please check how <@${userId}> doing on your multi-chat.
Let's support each other to make ${ChannelController.getStringChannel(CHANNEL_TODO)} 🙌`
    }
}

module.exports = AccountabilityPartnerMessage