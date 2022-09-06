const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")

class MembershipController{
    static async updateMembership(totalMonth,userId){
        
        const data = await supabase.from("Users")
            .select('end_membership')
            .eq('id',userId)
            .single()
        const end_membership = Time.getEndMembership(totalMonth,data.body.end_membership)

        supabase.from("Users")
            .update({end_membership})
            .eq('id',userId)
            .single()
            .then()
        
        const formattedDate = Time.getFormattedDate(Time.getDate(end_membership))
        return formattedDate
    }
}

module.exports = MembershipController