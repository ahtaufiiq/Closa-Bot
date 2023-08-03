const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const FormatString = require('../helpers/formatString');
const InfoUser = require('../helpers/InfoUser');
const MessageFormatting = require('../helpers/MessageFormatting');
const supabase = require('../helpers/supabaseClient');
const Time = require('../helpers/time');
const IntroMessage = require('../views/IntroMessage');
const DiscordWebhook = require('../helpers/DiscordWebhook');
const GoalController = require('../controllers/GoalController');
const GoalMessage = require('../views/GoalMessage');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('search')
		// .addSubcommand(subcommand =>
		// 	subcommand
		// 	.setName('profile')
		// 	.setDescription("Search profile of closa members")
		// 	.addUserOption(option => option.setName('user').setDescription('user').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('project')
				.setDescription("search your own project or project from a user")
				.addUserOption(option => option.setName('user').setDescription('user'))),
	async execute(interaction) {
		try {
			await interaction.deferReply({ephemeral:true})
			const command = interaction.options.getSubcommand()
			const taggedUser = interaction.options.getUser('user')
			const user = taggedUser? taggedUser : interaction.user

			if(command === 'project'){
				const {body:goals} = await supabase.from("Goals").select("id,project,goal,goalType").eq('UserId',user.id).order('lastProgress',{ascending:false}).limit(25)
				const goalMenus = GoalController.getFormattedGoalMenu(goals,true)
				interaction.editReply(GoalMessage.searchProject(user.id,goalMenus,interaction.user.id !== user.id))
			}else if(command === 'profile'){
				const dataUser = await supabase.from('Intros')
				.select()
				.eq('UserId',user.id)
				.limit(1)
				.single()

				if(!dataUser.body) return interaction.editReply("this member haven't made an intro")

				const {id,name,about,expertise,needHelp,social} = dataUser.body
				
				interaction.editReply({
					embeds:[
						new EmbedBuilder()
						.setColor("#ffffff")
						.setTitle(`See ${name.split(',')[0]} profile's →`)
						.setURL(MessageFormatting.linkToInsideThread(id))
						.setThumbnail(InfoUser.getAvatar(user))
						.addFields(
							{name:IntroMessage.titleField.name,value:FormatString.truncateString( name,1020)},
							{name:IntroMessage.titleField.about,value:FormatString.truncateString( about,1020)},
							{name:IntroMessage.titleField.expertise,value:FormatString.truncateString( expertise,1020)},
							{name:IntroMessage.titleField.needHelp,value:FormatString.truncateString( needHelp,1020)},
							{name:IntroMessage.titleField.social,value:FormatString.truncateString( social,1020)},
						)
					]
				})
			}else if(command === 'goal'){
				const dataUser = await supabase.from('Goals')
				.select("id,goal,about,role,deadlineGoal")
				.eq('UserId',user.id)
				.order('deadlineGoal',{ascending:false})
				.limit(1)
				.single()

				if(!dataUser.body) return interaction.editReply("this member haven't made an goal")

				const {id,role,goal,about,deadlineGoal} = dataUser.body
				const formattedDate = Time.getFormattedDate(Time.getDate(deadlineGoal))
				const dayLeft = Time.getDiffDay(Time.getDate(Time.getTodayDateOnly()),Time.getDate(deadlineGoal))
				let dayLeftDescription = `(${dayLeft} ${dayLeft > 1 ? "days": "day"} left)`
				
				interaction.editReply({
					embeds:[
						new EmbedBuilder()
						.setColor("#ffffff")
						.setTitle("See goal & latest progress →")
						.setURL(MessageFormatting.linkToInsideThread(id))
						.setThumbnail(InfoUser.getAvatar(user))
						.addFields(
							{ name: 'Goal 🎯', value:FormatString.truncateString( goal,1020), },
							{ name: 'About project', value:FormatString.truncateString( about,1020) },
							{ name: "Role", value:FormatString.truncateString( role,1020) },
							{ name: "Community deadline", value:FormatString.truncateString( `${formattedDate} ${dayLeft > 0 ? dayLeftDescription :'(ended)'}`,1020) },
						)	
					],
					// components:[
					// 	MessageComponent.createComponent(MessageComponent.addButton(`followGoal_${user.id}_${user.username}`,"Follow","SECONDARY"))
					// ]
				})
			}
		} catch (error) {
			DiscordWebhook.sendError(error,'command search')
		}
	},
};