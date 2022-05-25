const {createCanvas,loadImage,registerFont} = require('canvas')
const fs = require('fs')
const FormatString = require('./formatString')
const Time = require('./time')
class GenerateImage{
    static async tracker(name,goalName,photo,data,streak){
        registerFont('./assets/fonts/Inter-Regular.ttf',{family:'Inter'})
        registerFont('./assets/fonts/Inter-SemiBold.ttf',{family:'InterSemiBold'})
        
        const canvas = createCanvas(1078,1125)

        const context = canvas.getContext('2d')
 

        const template = await loadImage('./assets/images/template.jpg')
        context.drawImage(template,0,0)
        context.fillStyle = "#161F26"; 
        context.font = "56px InterSemiBold";
        context.fillText(name, 75 , 102 + 50);
        context.font = "48px InterSemiBold";
        context.fillText(FormatString.truncateString(goalName,25), 75 , 359 + 34);

        context.fillStyle = "#888888"; 
        context.font = "40px Inter";
        context.fillText(`${Time.getDay()} · ${Time.getFormattedDate(Time.getDate())}`, 75 , 198 + 30);
        
        context.fillText(`${streak} streak`, 122 , 1010 + 37);
          
        const greenDot = await loadImage('./assets/images/green_dot.png')
        const checklist = await loadImage('./assets/images/checklist.png')
        const empty = await loadImage('./assets/images/empty.png')

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
            if (fourWeek[dateOnly]) {
                let {x,y} = fourWeek[dateOnly]
                if (Time.getDateOnly(Time.getDate()) === dateOnly) {
                    context.drawImage(checklist,x,y)
                }else{
                    context.drawImage(greenDot,x,y)
                }
            }
        }



        const photoUser = await loadImage(photo)

        var rectWidth = 111.48;
        var rectHeight = 111.48;
        //   const midSize = rectHeight/2
        const midSize = rectHeight
        var rectX = 885.26;
        var rectY = 110.26;
        var cornerRadius = 42;
        
        this.roundRect(context, rectX, rectY, rectWidth, rectHeight, cornerRadius);
        context.clip()
        context.drawImage(photoUser,rectX,rectY,rectWidth,rectHeight)
        const buffer = canvas.toBuffer('image/png')
        return buffer
    }

    static roundRect(ctx, x, y, width, height, radius,) {

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
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();

    
    }
}

module.exports = GenerateImage