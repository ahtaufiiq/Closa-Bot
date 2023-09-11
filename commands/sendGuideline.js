const { PermissionFlagsBits,SlashCommandBuilder } = require('discord.js');
const GuidelineInfoController = require('../controllers/GuidelineInfoController');
const supabase = require('../helpers/supabaseClient');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('send')
		.setDescription('Send')
		.addSubcommand(subcommand =>
			subcommand
				.setName('guideline')
				.setDescription('send guideline to notification')
				.addUserOption(option => option.setName('user').setDescription('user')))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true});
		const user = interaction.options.getUser('user')
		if(!user){
			
			const data = await supabase.from("Users")
				.select('id,notificationId')
				.eq('notificationId',interaction.channelId)
				.single()
			const {id,notificationId} = data.data
			await GuidelineInfoController.generateGuideline(interaction.client,id,notificationId)
		}else{
			await GuidelineInfoController.generateGuideline(interaction.client,user.id)
		}
		interaction.editReply('success send guideline to user')
	},
};