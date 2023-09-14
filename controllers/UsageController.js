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
            .select('totalCoworking')
            .eq('UserId',UserId)
            .single()
        const totalCoworking = data.data?.totalCoworking + 1
        supabase.from("Usages")
            .update({totalCoworking})
            .eq("UserId",UserId)
            .then()
        return totalCoworking
    }
}

module.exports = UsageController