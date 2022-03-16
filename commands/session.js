const { SlashCommandBuilder } = require('@discordjs/builders');
const RequestAxios = require('../helpers/axios');
const { GUILD_ID } = require('../helpers/config');
const FocusSessionMessage = require('../views/FocusSessionMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('session')
		.setDescription('to check your session status'),
	async execute(interaction) {
		const userId = interaction.user.id
		
		const {user} = await interaction.client.guilds.cache.get(GUILD_ID).members.fetch(userId)
		RequestAxios.get('voice/report/'+userId)
			.then(async data=>{
				await interaction.reply({embeds:[FocusSessionMessage.report(user,data)]})
			})
	},
};