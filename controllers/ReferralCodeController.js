const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")
const schedule = require('node-schedule');
const referralCodes = require('referral-codes');
const ChannelController = require("./ChannelController");
const ReferralCodeMessage = require("../views/ReferralCodeMessage");
const LocalData = require("../helpers/LocalData.js");
const {Modal,TextInputComponent,showModal} = require('discord-modals'); // Define the discord-modals package!
const GenerateImage = require("../helpers/GenerateImage");
const {AttachmentBuilder, Collection } = require("discord.js");
const MemberController = require("./MemberController");
const { CHANNEL_GUIDELINE, GUILD_ID } = require("../helpers/config");
const MessageFormatting = require("../helpers/MessageFormatting");
const DiscordWebhook = require("../helpers/DiscordWebhook");
class ReferralCodeController{
    static showModalRedeem(interaction){
        if(interaction.customId === 'redeem'){
			const modal = new Modal()
			.setCustomId("modalReferral")
			.setTitle("Referral Code")
			.addComponents(
				new TextInputComponent()
					.setCustomId('referral')
					.setLabel("Enter your referral code")
					.setStyle("SHORT")
					.setRequired(true)
			)
			showModal(modal, {
				client: interaction.client, // Client to show the Modal through the Discord API.
				interaction: interaction, // Show the modal with interaction data.
			});
			return true
		}
        return false
    }

    static async interactionClaimReferral(interaction,targetUserId){
        if (interaction.user.id !== targetUserId && targetUserId !== null) {
            await interaction.editReply("⚠️ Can't claim other people's referrals")
            return
        }
        const [inviteLink,totalInvite] = await Promise.all([
            ReferralCodeController.generateInviteLink(interaction.client,targetUserId),
            ReferralCodeController.getTotalInvited(targetUserId)
        ])
        const files = []
        const [whiteCover,darkCover] = await Promise.all([
            GenerateImage.referralCover(interaction.user,false),
            GenerateImage.referralCover(interaction.user,true),
        ])
        files.push(new AttachmentBuilder(whiteCover,{name:`referral_cover_${interaction.user.username}.png`}))
        files.push(new AttachmentBuilder(darkCover,{name:`referral_cover_${interaction.user.username}.png`}))
        await interaction.editReply(ReferralCodeMessage.replyInviteFriends(inviteLink,totalInvite,files))
    }

    static async generateInviteLink(client,UserId){
        const dataUser = await supabase.from('Users')
            .select('inviteCode')
            .eq('id',UserId)
            .single()
        if(dataUser.data?.inviteCode){
            return MessageFormatting.inviteLink(dataUser.data.inviteCode)
        }else{
            let invite = await ChannelController.getChannel(client,CHANNEL_GUIDELINE).createInvite({
                maxAge:0,
                unique:true,
                reason: 'invite link',
            })
            const inviteLink = MessageFormatting.inviteLink(invite.code)
            supabase.from('Users')
                .update({inviteCode:invite.code})
                .eq('id',UserId)
                .then()
            return inviteLink
        }
    }

    static async incrementTotalInvite(invite_code='',user_id=''){
        const {data:totalInvite} = await supabase
        .rpc('incrementTotalInvite', { invite_code,user_id })
        
        return totalInvite
    }

    static async cachingAllInviteLink(client,invites){
        const firstInvites = await client.guilds.cache.get(GUILD_ID).invites.fetch();
        for (const [inviteCode,invite] of firstInvites) {
            invites.set(inviteCode,invite.uses)
            await Time.wait()
        }
    }

    static async deleteInviteLink(client,inviteCode){
        try {
            const invite = await client.guilds.cache.get(GUILD_ID).invites.fetch(inviteCode)
		    await invite.delete()
            await supabase.from('Users')
                .update({inviteCode:null})
                .eq('inviteCode',inviteCode)
                .single()
        } catch (error) {
            DiscordWebhook.sendError(error,'delete invite link')
        }
    }

    static async interactionGenerateReferral(interaction,targetUserId){
        if (interaction.user.id !== targetUserId) {
            await interaction.editReply("⚠️ Can't claim other people's referrals")
            return
        }
        const referralCodes = ReferralCodeController.getActiveReferralCodeFromMessage(interaction.message.content)
        
        if (referralCodes.length > 0) {
            const files = []

            for (let i = 0; i < referralCodes.length; i++) {
                const referralCode = referralCodes[i];
                const buffer = await GenerateImage.referralTicket(referralCode)
                const attachment = new AttachmentBuilder(buffer,{name:`referral_ticket_${interaction.user.username}.png`})
                files.push(attachment)
                if (i === 9) {
                    break
                }
            }
            interaction.editReply({
                content:`**Share this referral ticket to your friends.**\nalso feel free to tag \`\`@joinclosa\`\`, we will help you spread your referral.`,
                files
            })
        }else{
            interaction.editReply(ReferralCodeMessage.allReferralAlreadyBeenRedeemed())
        }
    }

    static async interactionGenerateReferralCover(interaction,targetUserId){
        if (interaction.user.id !== targetUserId) {
            await interaction.editReply("⚠️ Can't claim other people's referrals")
            return
        }

        const totalReferralCode = await ReferralCodeController.getTotalActiveReferral(interaction.user.id)
        
        if (totalReferralCode > 0) {
            const files = []
            const [coverBlack,coverWhite] = await Promise.all([
                GenerateImage.referralCover(interaction.user),
                GenerateImage.referralCover(interaction.user,false)
            ])
            files.push(new AttachmentBuilder(coverBlack,{name:`referral_cover_${interaction.user.username}.png`}))
            files.push(new AttachmentBuilder(coverWhite,{name:`referral_coverWhite_${interaction.user.username}.png`}))
            interaction.editReply(ReferralCodeMessage.successGenerateReferralCover(files))
        }else{
            interaction.editReply(ReferralCodeMessage.allReferralAlreadyBeenRedeemed())
        }
    }

    static async addNewReferral(userId,totalReferral){
        const codes = referralCodes.generate({
            count:totalReferral,
            charset:referralCodes.charset(referralCodes.Charset.ALPHANUMERIC).toUpperCase(),
            length:10
        })
        const values = codes.map(code=>{
            return {
                UserId:userId,
                referralCode:code,
                isRedeemed:false,
            }
        })

        await supabase.from("Referrals")
            .insert(values)
        return values
    }

    static async generateReferral(client,user){
        const userId = user.id
        const isGenerateNewReferral = await ReferralCodeController.isEligibleGenerateNewReferral(userId)
        if (!isGenerateNewReferral) return

        const totalActiveReferral = await ReferralCodeController.getTotalActiveReferral(userId)
        if(totalActiveReferral >= 5) return


        const totalNewReferral = 3

        ReferralCodeController.addNewReferral(userId,totalNewReferral)

        supabase.from("Users")
        .select('id,notificationId')
        .eq("id",userId)
        .single()
        .then(async data=>{
            const isAdditionalReferral = totalActiveReferral > 0
            const {id:userId,notificationId} = data.data
            const bufferReferralCover = await GenerateImage.referralCover(user)
            const files = [new AttachmentBuilder(bufferReferralCover,{name:`referral_cover_${user.username}.png`})]
            ChannelController.sendToNotification(
                client,
                ReferralCodeMessage.sendReferralCode(userId,totalNewReferral,isAdditionalReferral,files),
                userId,
                notificationId
            )
            user.send(ReferralCodeMessage.sendReferralCode(userId,totalNewReferral,isAdditionalReferral,files))
                .catch(err=>console.log("Cannot send message to user"))
        })
    }

    static async giftMilestoneDailyStreak(client,user,totalStreak=7){
        const userId = user.id
        const totalNewReferral = 1

        const codes = referralCodes.generate({
            count:totalNewReferral,
            charset:referralCodes.charset(referralCodes.Charset.ALPHANUMERIC).toUpperCase(),
            length:10
        })
        const values = codes.map(code=>{
            return {
                UserId:userId,
                referralCode:code,
                isRedeemed:false,
            }
        })
        
        await supabase.from("Referrals")
            .insert(values)

        const bufferReferralCover = await GenerateImage.referralCover(user)
        const files = [new AttachmentBuilder(bufferReferralCover,{name:`referral_cover_${user.username}.png`})]
        ChannelController.sendToNotification(
            client,
            ReferralCodeMessage.achieveFirstDailyStreak(totalNewReferral,totalStreak,userId,files),
            userId,
        )
        user.send(ReferralCodeMessage.achieveFirstDailyStreak(totalNewReferral,totalStreak,userId,files)) 
            .catch(err=>console.log("Cannot send message to user"))
    }

    static async getTotalActiveReferral(userId){
        const data = await supabase.from("Referrals")
            .select('id')
            .eq("UserId",userId)
            .is('redeemedBy',null)
        return data.data.length
    }

    static async isEligibleGenerateNewReferral(userId){
        const dataUser = await supabase.from("Users")
            .select("longestStreak")
            .eq('id',userId)
            .single()
        

        return dataUser.data?.longestStreak >= 7
    }

    static async getReferrals(userId){
        const data = await supabase.from("Referrals")
            .select()
            .eq('UserId',userId)
            .is('redeemedBy',null)

        if (data.data?.length > 0) {
            let allReferralAlreadyBeenRedeemed = true
            const referral = data.data.map(code=>{
                if(!code.isRedeemed) allReferralAlreadyBeenRedeemed = false
                return `${code.referralCode}${code.isRedeemed ? " (redeemed ✅)" :''}`
            })
            return {
                allReferralAlreadyBeenRedeemed,
                referralCode:referral.join('\n'),
            }
        }else{
            return null
        }
    }

    static async validateReferral(referralCode){
        const data = await supabase.from("Referrals")
            .select()
            .eq('referralCode',referralCode)
            .single()
        const response = {
            valid:true,
            description:"",
            ownedBy:null
        }
        if (data.data) {
            const referral = data.data
            response.ownedBy = data.data.UserId
            if(referral.isRedeemed){
                response.valid = false
                response.description = 'redeemed'
            }
        }else{
            response.valid = false
            response.description = "invalid"
        }
        return response
    }

    static updateIsClaimed(userId){
        supabase.from("Referrals")
                .update({isClaimed:true})
                .eq('UserId',userId)
                .then()
                            
    }

    static async getTotalInvited(userId){
        const {data} = await supabase.from("Users")   
            .select('totalInvite')
            .eq('id',userId)
            .single()
        return data.totalInvite
    }

    static async getTotalDays(userId) {
        const data = await supabase.from("Users")
        .select('totalDay')
        .eq("id",userId)
        .single()

        return data.data.totalDay
    }
    static async getTotalDaysThisCohort(userId) {
        const data = await supabase.from("Users")
        .select('totalDaysThisCohort')
        .eq("id",userId)
        .single()

        return data.data.totalDaysThisCohort
    }

    static async updateTotalDaysThisCohort(userId){
        const totalDaysThisCohort = await ReferralCodeController.getTotalDaysThisCohort(userId)

        await supabase.from("Users")
            .update({totalDaysThisCohort:totalDaysThisCohort+1})
            .eq('id',userId)
    }



    static isTimeToGenerateReferral(){
        const {celebrationDate} = LocalData.getData()
        const oneWeekBeforeCelebration = Time.getDateOnly(Time.getNextDate(-8,celebrationDate))
        const todayDate = Time.getTodayDateOnly()

        return todayDate >= oneWeekBeforeCelebration && todayDate <= celebrationDate
    }

    

    static getExpiredDateFromMessage(msg){
        return msg.split('```')[0].split('*')[5].toUpperCase()
    }

    static getActiveReferralCodeFromMessage(msg){
        const referrals = msg.split('```')[1].split('\n')
        const referralCodes = []
        referrals.forEach(referral=>{
            if (!referral.includes("(redeemed ✅)") && referral !== '') {
                referralCodes.push(referral)
            }
        })
        
        return referralCodes
    }

    static async isFirstTimeRedeemReferral(userId){
        const data = await supabase.from("Referrals")
            .select("id")
            .eq('redeemedBy',userId)
        
        return data.data?.length === 0
    }

    static async isEligibleToRedeemRederral(userId){
        const data = await supabase.from("Users")
            .select('endMembership')
            .eq("id",userId)
            .single()
            
        return data.data?.endMembership === null
    }
}

module.exports = ReferralCodeController