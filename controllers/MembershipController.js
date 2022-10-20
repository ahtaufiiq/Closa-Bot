const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")

class MembershipController{
    static async updateMembership(totalMonth,userId){
        
        const data = await supabase.from("Users")
            .select('endMembership')
            .eq('id',userId)
            .single()
        const endMembership = Time.getEndMembership(totalMonth,data.body.endMembership)

        supabase.from("Users")
            .update({endMembership})
            .eq('id',userId)
            .single()
            .then()
        
        const formattedDate = Time.getFormattedDate(Time.getDate(endMembership))
        return formattedDate
    }
}

module.exports = MembershipController