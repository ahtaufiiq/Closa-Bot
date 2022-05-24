const {createCanvas,loadImage,registerFont} = require('canvas')
const fs = require('fs')
const Time = require('./time')
class GenerateImage{
    static async tracker(name,date,photo,data){

        
        const canvas = createCanvas(1078,1165)

        const context = canvas.getContext('2d')
        registerFont('./assets/fonts/Inter-Regular.ttf',{family:'Inter'})
        registerFont('./assets/fonts/Inter-SemiBold.ttf',{family:'InterSemiBold'})

        const template = await loadImage('./assets/images/template.png')
        context.drawImage(template,0,0)
        context.fillStyle = "#161F26"; 
        context.font = "600 56px InterSemiBold";
        context.fillText(name, 75 , 102 + 50);

        context.fillStyle = "#888888"; 
        context.font = "400 40px Inter";
        context.fillText(date, 75 , 198 + 30);
          

        const today = Time.getDate()
        const startDate = Time.getNextDate(-28)

        const greenDot = await loadImage('./assets/images/green_dot.png')
        const gap = 143

        for (let i = 0; i < data.length; i++) {
            if(Time.getNextDate(-27).getDate() === data[i].date)context.drawImage(greenDot,75,469)
            if(Time.getNextDate(-26).getDate() === data[i].date)context.drawImage(greenDot,75,469 + 143)
            if(Time.getNextDate(-25).getDate() === data[i].date)context.drawImage(greenDot,75,469 + 143 * 2)
            if(Time.getNextDate(-24).getDate() === data[i].date)context.drawImage(greenDot,75,469 + 143 * 3)
    
            if(Time.getNextDate(-23).getDate() === data[i].date)context.drawImage(greenDot,75 + gap,469)
            if(Time.getNextDate(-22).getDate() === data[i].date)context.drawImage(greenDot,75 + gap,469 + 143)
            if(Time.getNextDate(-21).getDate() === data[i].date)context.drawImage(greenDot,75 + gap,469 + 143 * 2)
            if(Time.getNextDate(-20).getDate() === data[i].date)context.drawImage(greenDot,75 + gap,469 + 143 * 3)
    
            if(Time.getNextDate(-19).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 2 ,469)
            if(Time.getNextDate(-18).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 2 ,469 + 143)
            if(Time.getNextDate(-17).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 2 ,469 + 143 * 2)
            if(Time.getNextDate(-16).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 2 ,469 + 143 * 3)
    
            if(Time.getNextDate(-15).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 3 ,469)
            if(Time.getNextDate(-14).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 3 ,469 + 143)
            if(Time.getNextDate(-13).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 3 ,469 + 143 * 2)
            if(Time.getNextDate(-12).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 3 ,469 + 143 * 3)
    
            if(Time.getNextDate(-11).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 4 ,469)
            if(Time.getNextDate(-10).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 4 ,469 + 143)
            if(Time.getNextDate(-9).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 4 ,469 + 143 * 2)
            if(Time.getNextDate(-8).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 4 ,469 + 143 * 3)
    
            if(Time.getNextDate(-7).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 5 ,469)
            if(Time.getNextDate(-6).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 5 ,469 + 143)
            if(Time.getNextDate(-5).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 5 ,469 + 143 * 2)
            if(Time.getNextDate(-4).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 5 ,469 + 143 * 3)
    
            if(Time.getNextDate(-3).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 6 ,469)
            if(Time.getNextDate(-2).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 6 ,469 + 143)
            if(Time.getNextDate(-1).getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 6 ,469 + 143 * 2)
            if(Time.getNextDate().getDate() === data[i].date)context.drawImage(greenDot,75 + gap * 6 ,469 + 143 * 3)
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