const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time")

class MembershipController{
    static async updateMembership(totalMonth,userId){
        const data = await supabase.from("Users")
            .select('endMembership')
            .eq('id',userId)
            .single()
        const initialDate = data.data.endMembership < Time.getTodayDateOnly() ? Time.getTodayDateOnly() : data.data.endMembership
        const endMembership = Time.getEndMembership(totalMonth,initialDate)

        await supabase.from("Users")
            .update({endMembership})
            .eq('id',userId)
            .single()
        
        const formattedDate = Time.getFormattedDate(Time.getDate(endMembership))
        return formattedDate
    }
}

module.exports = MembershipController