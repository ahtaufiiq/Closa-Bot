const {createCanvas,loadImage,registerFont} = require('canvas')
const formatNumber = require('./formatNumber')
const FormatString = require('./formatString')
const Time = require('./time')
class GenerateImage{
    static async tracker(name,goalName,photo,data,longestStreak,totalDays,totalPoints,isVacation=false,vacationLeft=0,isBuyOneVacation=false,isSick=false){
        registerFont('./assets/fonts/Inter-Regular.ttf',{family:'Inter'})
        registerFont('./assets/fonts/Inter-Medium.ttf',{family:'Inter',weight:500})
        registerFont('./assets/fonts/Inter-SemiBold.ttf',{family:'Inter',weight:600})
        
        const canvas = createCanvas(1078,1167)

        const context = canvas.getContext('2d')
        const additionalStreak = isVacation ? '_vacation' : isSick ? "_sick" :longestStreak >= 100 ? '_100streak' : longestStreak >= 30 ? "_30streak" : ''
 
        const template = await loadImage(`./assets/images/template${additionalStreak}.png`)
        context.drawImage(template,0,0)
        context.fillStyle = "#2B2B2B"; 
        context.font = "600 56px Inter";
        context.fillText(name, 75 , 102 + 50);
        context.font = "600 48px Inter";
        const maxCharGoal = (isVacation || isSick) ?(vacationLeft === 0 ? 25 : 23) : 37
        context.fillText(FormatString.truncateString(goalName,maxCharGoal), 75 , 363 + 34);


        context.fillStyle = "#888888"; 
        context.font = "40px Inter";
        context.fillText(`${Time.getDay()} · ${Time.getFormattedDate(Time.getDate())}`, 75 , 198 + 30);
        
        context.font = "500 40px Inter";
        context.fillText(`${totalDays}`, 130 , 1051 + 38);
        context.fillText(`${longestStreak}`, 290 , 1051 + 38);
        
        context.font = "500 36px Inter";
        context.textAlign = 'end'
        context.fillText(`${formatNumber(totalPoints)} P`, 1004, 1051 + 38);
        

        if(isVacation || isSick){
            context.fillStyle = "#888888"; 
            context.font = "500 40px Inter";
            context.textAlign = 'end'
            if(vacationLeft === 0 ){
                if(isBuyOneVacation) context.fillText(`rest day`, 954, 363 + 34);
                else context.fillText(`last day`, 954, 363 + 34);
            }else{
                context.fillText(`${vacationLeft} ${vacationLeft > 1 ? "days" :"day"} left`, 954, 363 + 34);
                
            }
        }
          
        const greenDot = await loadImage(`./assets/images/progress${additionalStreak}.png`)
        const safetyDot = await loadImage(`./assets/images/safety${additionalStreak}.png`)
        const checklist = await loadImage(`./assets/images/checklist${additionalStreak}.png`)
        const empty = await loadImage(`./assets/images/empty.png`)

        const today = Time.getDate()
        const day = today.getDay() === 0 ? 7 : today.getDay()
        let startDate = Time.getNextDate(-(20+day))
        const endDate = Time.getNextDate(8-day)
        const fourWeek = {}
        let counter = 0
        let baris = 0
        let column = 0
        const gapX = 143
        const gapY = 108
        const startY = 541
        const startX = 75
        let startDrawEmpty = false

        while(Time.getDateOnly(startDate) !== Time.getDateOnly(endDate)){
            if (counter === 7) {
                column = 0
                baris++
                counter = 0
            }
            const x = startX+gapX*column
            const y = startY+gapY*baris
            fourWeek[Time.getDateOnly(startDate)] = {x,y}

            if(startDrawEmpty) context.drawImage(empty,x,y)
            if (Time.getDateOnly(Time.getDate()) === Time.getDateOnly(startDate)) startDrawEmpty = true
            
            startDate.setDate(startDate.getDate()+1)
            counter ++
            column++
           
        }
        


        for (let i = 0; i < data.length; i++) {
            const dateOnly = Time.getDateOnly(new Date(data[i].createdAt))

            if (fourWeek[dateOnly] && dateOnly <= Time.getTodayDateOnly()) {
                let {x,y} = fourWeek[dateOnly]
                if (Time.getDateOnly(Time.getDate()) === dateOnly && data[i].type !== 'safety') {
                    context.drawImage(checklist,x,y)
                }else if(data[i].type === 'safety'){
                    context.drawImage(safetyDot,x,y)
                }else{
                    context.drawImage(greenDot,x,y)
                }
            }
        }



        const photoUser = await loadImage(photo)

        const rectWidth = 111.48;
        const rectHeight = 111.48;
        const rectX = 885.26;
        const rectY = 110.26;
        const cornerRadius = 42;
        
        this.roundRect(context, rectX, rectY, rectWidth, rectHeight, cornerRadius);
        context.clip()
        context.drawImage(photoUser,rectX,rectY,rectWidth,rectHeight)
        const buffer = canvas.toBuffer('image/png')
        return buffer
    }

    static roundRect(ctx, x, y, width, height, radius = 5) {

        if (typeof radius === 'undefined') {
        radius = 5;
        }
        if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
        }
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y); // top left
        ctx.lineTo(x + width - radius.tr, y); // top right - radiusnya
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr); // panjangnya,y -> panjangnya sampai y
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();

    
    }

    static async referralTicket(referralCode,expired){
        registerFont('./assets/fonts/IBMPlexMono-Regular.ttf',{family:'IBMPlexMono',weight:400})
        registerFont('./assets/fonts/DMMono-Medium.ttf',{family:'DMMono',weight:500})
        
        const canvas = createCanvas(1213,913)

        const context = canvas.getContext('2d')
 
        const template = await loadImage('./assets/images/referral_code.png')
        context.drawImage(template,0,0)
        context.fillStyle = "#FAFAFB"; 
        context.font = "400 48px IBMPlexMono";
        context.textAlign = 'center'
        context.fillText(referralCode, 607 , 478);
        
        context.fillStyle = "#888888"; 
        context.font = "500 28px DMMono";
        context.textAlign = 'end'
        context.fillText(expired, 1155 , 108);

          
        const buffer = canvas.toBuffer('image/png')
        return buffer
    }
}

module.exports = GenerateImage