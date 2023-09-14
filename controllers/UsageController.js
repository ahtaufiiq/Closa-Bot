const supabase = require("../helpers/supabaseClient")

class UsageController{
    static async getUsage(UserId){
        return await supabase.from("Usages")
            .select('*,Users(membershipType)')
            .eq("UserId",UserId)
            .single()
    }

    static async isFreeUser(UserId){
        const data = await supabase.from("Users")
            .select("membershipType")
            .eq("id",UserId)
            .single()
        return data.data?.membershipType === null
    }

    static async alreadyReachedLimitCoworking(UserId){
        const data = await UsageController.getUsage(UserId)
        const {totalCoworking,Users:{membershipType}} = data.data
        return membershipType === null && totalCoworking >= 20
    }
    static async incrementTotalCoworking(UserId){
        const data = await supabase.from("Usages")
            .select('totalCoworking,totalProgress')
            .eq('UserId',UserId)
            .single()
        const totalCoworking = data.data?.totalCoworking + 1
        const totalProgress = data.data.totalProgress

        supabase.from("Usages")
            .update({totalCoworking})
            .eq("UserId",UserId)
            .then()
        return {totalCoworking,totalProgress}
    }
    static async incrementTotalProgress(UserId){
        const data = await supabase.from("Usages")
            .select('totalCoworking,totalProgress,Users(membershipType)')
            .eq('UserId',UserId)
            .single()
        let {totalCoworking,totalProgress,Users:{membershipType}}= data.data
        if((membershipType === 'lite' && totalProgress < 30) || (membershipType === null && totalProgress < 20) || membershipType === 'pro'){
            totalProgress += 1
        }
        supabase.from("Usages")
            .update({totalProgress})
            .eq("UserId",UserId)
            .then()
        return {totalProgress,totalCoworking,membershipType}
    }
}

module.exports = UsageController