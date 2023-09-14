const supabase = require("../helpers/supabaseClient")

class UsageController{
    static async getUsage(UserId){
        return await supabase.from("Usages")
            .select('*,Users(membershipType)')
            .eq("UserId",UserId)
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