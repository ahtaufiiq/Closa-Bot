const supabase = require("../helpers/supabaseClient")

class UsageController{
    static async getUsage(UserId){
        return await supabase.from("Usages")
            .select('*,Users(membershipType)')
            .eq("UserId",UserId)
    }
}

module.exports = UsageController