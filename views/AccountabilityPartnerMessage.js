const ChannelController = require("../controllers/ChannelController")
const { CHANNEL_TODO } = require("../helpers/config")

let accountabilityPartners = {
	"449853586508349440":["410304072621752320","699128646270582784"],
	"410304072621752320":["449853586508349440","699128646270582784"],
	"699128646270582784":["449853586508349440","699128646270582784"],
	"703533328682451004":["551025976772132874","615905564781969409","696581180752920626"],
	"551025976772132874":["703533328682451004","615905564781969409","696581180752920626"],
	"615905564781969409":["551025976772132874","703533328682451004","696581180752920626"],
	"696581180752920626":["551025976772132874","615905564781969409","703533328682451004"],
	"698539976064761936":["810695169497759814","585824427548213270"],
	"810695169497759814":["698539976064761936","585824427548213270"],
	"585824427548213270":["810695169497759814","698539976064761936"],

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