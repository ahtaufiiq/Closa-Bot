const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const ChannelController = require("../controllers/ChannelController");
const { CHANNEL_ANNOUNCEMENT } = require("../helpers/config");
const { linkToMessage } = require("../helpers/MessageFormatting");
const MessageComponent = require("../helpers/MessageComponent");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('6wic')
        .setDescription('6wic start')
        .addSubcommand(subCommand=> 
            subCommand
            .setName('start')
            .setDescription('send waitlist 6wic to announcement'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
            const command = interaction.options.getSubcommand()
            await interaction.deferReply({ephemeral:true});
            
            if(command === 'start'){
                const channelAnnouncement = ChannelController.getChannel(interaction.client,CHANNEL_ANNOUNCEMENT)
                const msg = await channelAnnouncement.send({
                    components:[MessageComponent.createComponent(MessageComponent.addButton('joinSixWeekChallenge','🕹️ Register 6-week challenge'))]
                })
                interaction.editReply(linkToMessage(CHANNEL_ANNOUNCEMENT,msg.id))
            }
    },
}