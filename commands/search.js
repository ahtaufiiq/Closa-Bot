const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v9');
const { MessageEmbed } = require('discord.js');
const ChannelController = require('../controllers/ChannelController');
const UserController = require('../controllers/UserController');
const { CHANNEL_GOALS } = require('../helpers/config');
const FormatString = require('../helpers/formatString');
const InfoUser = require('../helpers/InfoUser');
const MessageFormatting = require('../helpers/MessageFormatting');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const PointMessage = require('../views/PointMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('search')
		.addSubcommand(subcommand =>
			subcommand
				.setName('goal')
				.setDescription("Search goal & latest update from a user")
				.addUserOption(option => option.setName('user').setDescription('user').setRequired(true))),
	async execute(interaction) {
		await interaction.deferReply({ephemeral:true})
		const command = interaction.options.getSubcommand()
		const taggedUser = interaction.options.getUser('user')
		const user = taggedUser? taggedUser : interaction.user

		const dataUser = await supabase.from('Goals')
			.select("id,goal,about,role,deadlineGoal")
			.eq('UserId',user.id)
			.order('deadlineGoal',{ascending:false})
			.limit(1)
			.single()

		const {id,role,goal,about,deadlineGoal} = dataUser.body
		const formattedDate = Time.getFormattedDate(Time.getDate(deadlineGoal))
		const dayLeft = Time.getDiffDay(Time.getDate(Time.getTodayDateOnly()),Time.getDate(deadlineGoal))
		let dayLeftDescription = `(${dayLeft} ${dayLeft > 1 ? "days": "day"} left)`
		
		interaction.editReply({
			embeds:[
				new MessageEmbed()
				.setColor("#ffffff")
				.setTitle("See goal & latest progress →")
				.setURL(MessageFormatting.linkToInsideThread(id))
				.setThumbnail(InfoUser.getAvatar(user))
				.addFields(
					{ name: 'Goal 🎯', value:FormatString.truncateString( goal,1020) },
					{ name: 'About project', value:FormatString.truncateString( about,1020) },
					{ name: "Role", value:FormatString.truncateString( role,1020) },
					{ name: "Community deadline", value:FormatString.truncateString( `${formattedDate} ${dayLeft > 0 ? dayLeftDescription :'(ended)'}`,1020) },
				)	
			]
		})
	},
};