const schedule = require('node-schedule');
const { CHANNEL_STATUS } = require('../helpers/config');
const supabase = require("../helpers/supabaseClient")
const Time = require("../helpers/time");
const StatusReportMessage = require('../views/StatusReportMessage');
const ChannelController = require('./ChannelController');

class WeeklyReport{
    static async getTotalRevenue(){
        
        let data = await supabase.from("Payments")
                     .select('price')

        let total = 0
        data.data.forEach(payment=>{
            total += payment.price
        })

        return total
    }

    static async getMRR(){
        let data = await supabase.from("Payments")
                        .select('price')
                        .gte('createdAt',Time.getDateOnly(Time.getBeginningOfTheMonth()))
        let total = 0
        data.data.forEach(payment=>{
            total += payment.price
        })
        
        return total
						
    }

    static async getPreviousMRR(){
        let data = await supabase.from("Payments")
            .select('price')
            .gte('createdAt',Time.getDateOnly(Time.getBeginningOfTheMonth(-1)))
            .lt('createdAt',Time.getDateOnly(Time.getBeginningOfTheMonth()))
        let total = 0
        data.data.forEach(payment=>{
            total += payment.price
        })
        
        return total
    }

    static async getInactiveMember(){
        let data = await supabase.from("Users")
            .select('name')
            .gte('endMembership',Time.getTodayDateOnly())
            .lt('lastActive',Time.getDateOnly(Time.getNextDate(-7)))

        return data.data
    }

    static async getNewMember(){
        let data = await supabase.from("Payments")
            .select('name')
            .gte('createdAt',Time.getDateOnly(Time.getBeginningOfTheMonth()))
            .eq('type','Payment')
        return data.data
    }

    static async getAllMember(){
        let data = await supabase.from("Users")
            .select('name,lastActive')
            .gte('endMembership',Time.getTodayDateOnly())
            .order('lastActive',{ascending:false})
        return data.data
    }

    static async getAllMemberPreviousMonth(){
        let data = await supabase.from("Users")
            .select('name,lastActive')
            .gte('endMembership',Time.getDateOnly(Time.getBeginningOfTheMonth(-1)))
            .order('lastActive',{ascending:false})
        return data.data
    }

    static async getPreviousWeeklyStat(){
        let data = await supabase.from("WeeklyStats")
            .select()
            .eq('date',Time.getDateOnly(Time.getNextDate(-7)))
            .single()

        return data.data
    }

    static async getPreviousMonthlyRetentionRate(){
        let data = await supabase.from("WeeklyStats")
            .select()
            .gte('date',Time.getDateOnly(Time.getBeginningOfTheMonth(-1)))
            .lt('date',Time.getDateOnly(Time.getBeginningOfTheMonth()))

        if (data.data.length === 0) return 0
        
        let retentionRate = 0
        data.data.forEach(stat=>{
            retentionRate += stat.retentionRate
        })
        retentionRate /= data.data.length
        return Number(retentionRate.toFixed(0))
    }

    static async getMonthlyRetentionRate(){
        let data = await supabase.from("WeeklyStats")
            .select()
            .gte('date',Time.getDateOnly(Time.getBeginningOfTheMonth()))    

        if (data.data.length === 0) return 0

        let retentionRate = 0
        data.data.forEach(stat=>{
            retentionRate += stat.retentionRate
        })
        retentionRate /= data.data.length
        return Number(retentionRate.toFixed(0))
    }

    static sendWeeklyStatus(client){
        const channelStatus = ChannelController.getChannel(client,CHANNEL_STATUS)
        
        schedule.scheduleJob(`1 0 ${Time.minus7Hours(8)} * * 1`,async function() {
			
			Promise.all([
				WeeklyReport.getAllMember(),
				WeeklyReport.getInactiveMember()
			]).then(([allMembers,inactiveMembers])=>{
				const todayDate = Time.getDate()
				const date = Time.getDateOnly(todayDate)
				const totalMember = allMembers.length
				const totalActiveMember = totalMember - inactiveMembers.length
				const retentionRate = Number((totalActiveMember/totalMember*100).toFixed(0))
				const inactiveMembersName = inactiveMembers.map(member=>member.name)
				return supabase.from("WeeklyStats")
							.insert({
								retentionRate,
								date,
								totalMember:totalMember,
								inactiveMember:`${inactiveMembersName}`
							})
			}).then(()=>{
				return Promise.all(
						[		
							WeeklyReport.getAllMemberPreviousMonth(),
							WeeklyReport.getAllMember(),
							WeeklyReport.getNewMember(),
							WeeklyReport.getInactiveMember(),
							WeeklyReport.getPreviousMRR(),
							WeeklyReport.getMRR(),
							WeeklyReport.getTotalRevenue(),
							WeeklyReport.getPreviousWeeklyStat(),
							WeeklyReport.getPreviousMonthlyRetentionRate(),
							WeeklyReport.getMonthlyRetentionRate()
						]
						).then(([previousMembers,allMembers,NewMembers,inactiveMembers,previousMRR,MRR,totalRevenue,previousWeeklyStat,previousMonthlyRetentionRate,monthlyRetentionRate]) =>{
							const [
								totalPreviousMembers,
								totalMember,
								totalNewMember,
								totalInactiveMember]=[previousMembers.length,allMembers.length,NewMembers.length,inactiveMembers.length]
								
							channelStatus.send(
								StatusReportMessage.weeklyReport(
									totalPreviousMembers,
									totalMember,
									totalNewMember,
									totalInactiveMember,
									previousMRR,
									MRR,
									totalRevenue,
									previousWeeklyStat,
									previousMonthlyRetentionRate,
									monthlyRetentionRate
								)
							)
					
								
						})
			})
		})
    }
}

module.exports = WeeklyReport