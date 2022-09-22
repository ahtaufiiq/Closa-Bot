const ChannelController = require("../controllers/ChannelController")
const { CHANNEL_TODO } = require("../helpers/config")

let accountabilityPartners = {
	"810695169497759814":["732219930954563615","408275385223217154"],
	"732219930954563615":["810695169497759814","408275385223217154"],
	"408275385223217154":["732219930954563615","810695169497759814"],
	"410304072621752320":["154228926615519232","692702690077179966","288320777365880832"],
	"154228926615519232":["410304072621752320","692702690077179966","288320777365880832"],
	"692702690077179966":["154228926615519232","410304072621752320","288320777365880832"],
	"288320777365880832":["154228926615519232","692702690077179966","410304072621752320"],
	"703533328682451004":["551025976772132874","725327505048993844"],
	"551025976772132874":["703533328682451004","725327505048993844"],
	"725327505048993844":["551025976772132874","703533328682451004"],
	"585824427548213270":["449853586508349440"],
	"449853586508349440":["585824427548213270"],

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