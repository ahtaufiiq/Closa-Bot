const CoworkingController = require("../controllers/CoworkingController");

module.exports = {
	name: 'guildScheduledEventUpdate',
	async execute(oldGuildScheduledEvent,newGuildScheduledEvent) {
        if (newGuildScheduledEvent.status === "ACTIVE" && oldGuildScheduledEvent.status === 'SCHEDULED') {
            CoworkingController.sendNotificationStartEvent(newGuildScheduledEvent.client,'Night',newGuildScheduledEvent.id)
        }
	},
};