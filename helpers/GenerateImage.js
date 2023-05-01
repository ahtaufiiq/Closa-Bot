const {createCanvas,loadImage,registerFont} = require('canvas')
const UserController = require('../controllers/UserController')
const formatNumber = require('./formatNumber')
const FormatString = require('./formatString')
const InfoUser = require('./InfoUser')
const Time = require('./time')
class GenerateImage{
    static async tracker(user,goalName,photo,data,longestStreak,totalDays,totalPoints,isVacation=false,vacationLeft=0,isBuyOneVacation=false,isSick=false){
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
        const name = UserController.getNameFromUserDiscord(user)
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

    static roundRect(context, x, y, width, height, radius = 5) {

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
        context.beginPath();
        context.moveTo(x + radius.tl, y); // top left
        context.lineTo(x + width - radius.tr, y); // top right - radiusnya
        context.quadraticCurveTo(x + width, y, x + width, y + radius.tr); // panjangnya,y -> panjangnya sampai y
        context.lineTo(x + width, y + height - radius.br);
        context.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        context.lineTo(x + radius.bl, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        context.lineTo(x, y + radius.tl);
        context.quadraticCurveTo(x, y, x + radius.tl, y);
        context.closePath();

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

    static async streakBadge(totalStreak,user){
        registerFont('./assets/fonts/Archivo-SemiBold.ttf',{family:'Archivo',weight:600})
        
        const canvas = createCanvas(1440,1920)

        const context = canvas.getContext('2d')
 
        const template = await loadImage(`./assets/images/${totalStreak}_streak_badge.png`)
        context.drawImage(template,0,0)
        context.fillStyle = "#161F26"; 
        context.font = "600 42px Archivo";
        const username = UserController.getNameFromUserDiscord(user)
        context.fillText(username, 300 , 1786);

		const avatarUrl = InfoUser.getAvatar(user)
        const photoUser = await loadImage(avatarUrl)

        const rectWidth = 83;
        const rectHeight = 83.5;
        const rectX = 186.5;
        const rectY = 1730.8;
        const cornerRadius = 30;
        
        this.roundRect(context, rectX, rectY, rectWidth, rectHeight, cornerRadius);
        context.clip()
        context.drawImage(photoUser,rectX,rectY,rectWidth,rectHeight)
        
        const buffer = canvas.toBuffer('image/png')
        return buffer
    }

    static async referralCover(totalReferral,user,isDarkMode=true){
        registerFont('./assets/fonts/Archivo-SemiBold.ttf',{family:'Archivo',weight:600})
        registerFont('./assets/fonts/BaiJamjuree-Medium.ttf',{family:'BaiJamjuree',weight:500})
        
        const canvas = createCanvas(1440,1440)

        const context = canvas.getContext('2d')
        context.fillStyle = "#F6F8FA"; 
 
        if(totalReferral > 1){
            const template = await loadImage(`./assets/images/referral_cover_template${isDarkMode ? "":"_white"}.png`)
            context.drawImage(template,0,0)
            context.font = "500 48px BaiJamjuree";
            context.fillText(`${totalReferral} invite${totalReferral>1? "s" : ""}`, 1033 , 222.5);

        }else{
            const template = await loadImage(`./assets/images/referral_cover_oneInvite${isDarkMode ? "":"_white"}.png`) 
            context.drawImage(template,0,0)
        }

        
        if(!isDarkMode) context.fillStyle = "#2B2B2B"

        context.textAlign = 'center'
        context.font = "600 42px Archivo";
        const username = UserController.getNameFromUserDiscord(user)
        context.fillText(username, 721 , 1330);

		const avatarUrl = InfoUser.getAvatar(user)
        const photoUser = await loadImage(avatarUrl)

        const rectWidth = 124.6;
        const rectHeight = 124;
        const rectX = 657.6;
        const rectY = 1140.9;
        const cornerRadius = 43;
        
        this.roundRect(context, rectX, rectY, rectWidth, rectHeight, cornerRadius);
        context.clip()
        context.drawImage(photoUser,rectX,rectY,rectWidth,rectHeight)
        
        const buffer = canvas.toBuffer('image/png')
        return buffer
    }

    static async dailySummary({user,dailyWorkTime,tasks,projects,totalSession,coworkingFriends}){
        function drawProgressBar(context,x,y,percentage,type='long',width=6){
            context.beginPath()
            let maxLength = 350
            if(type === 'short') maxLength = 100
            maxLength -= 6.3
            context.moveTo(x, y);
            context.lineTo(x + (maxLength * percentage / 100), y);
            context.lineCap = 'round'
            context.lineWidth = width;
            context.strokeStyle = "#00B264";
            context.stroke();
            context.closePath()
        }

        function drawCircle(context, x, y, stroke,percentage) {
            context.beginPath()

            context.arc(x, y, 43, 1.5 * Math.PI, (1.5 + (2 * percentage / 100)) * Math.PI);
            context.lineCap = "round";
            if (stroke) {
              context.lineWidth = 8
              context.strokeStyle = stroke
              context.stroke()
            }
            context.closePath()
        }

        registerFont('./assets/fonts/Archivo-SemiBold.ttf',{family:'Archivo',weight:600})
        registerFont('./assets/fonts/Archivo-Medium.ttf',{family:'Archivo',weight:500})
        registerFont('./assets/fonts/Archivo-Regular.ttf',{family:'Archivo',weight:400})

        let totalTime = 0
        let totalFocusTime = 0
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            totalTime += Number(task.totalTime)
            totalFocusTime += Number(task.focusTime)
        }

        let totalProjectTime = 0
        projects.forEach(project=>{
            totalProjectTime += Number(project.totalTime)
        })

        // import image
        const fillGrey = await loadImage(`./assets/images/fill_grey.png`)
        const template = await loadImage(`./assets/images/template_daily_summary.png`)
        const streakPartner = await loadImage(`./assets/images/streak_partner.png`)
        const frameAvatar = await loadImage(`./assets/images/frame_avatar.png`)
        const frameProfile = await loadImage(`./assets/images/frame_profile.png`)
        const photoUser = await loadImage(InfoUser.getAvatar(user))
        const canvas = createCanvas(546,906)
        const context = canvas.getContext('2d')
        context.drawImage(template,0,0)


        //--- Header ----//
        
        context.drawImage(photoUser,39,36,56,56)
        context.drawImage(frameProfile,35,32,64,64)

        context.fillStyle = "#31373D"; 
        context.font = "600 24px Archivo";
        context.fillText(UserController.getNameFromUserDiscord(user), 117.2 , 57);
        
        context.fillStyle = "#888888"; 
        context.font = "400 18px Archivo";
        context.fillText(`${totalSession}x ${totalSession > 1 ? 'sessions': 'session'}`, 117 , 86);

        context.textAlign = 'right'

        context.font = "400 20px Archivo";
        context.fillText(Time.getFormattedDate(Time.getDate(),false,'long'), 514.5 , 84);
        context.textAlign = 'left'


        //--- Work Hours ----//
        const percentageWorkHours = totalTime > dailyWorkTime ? 100 : Math.round(totalTime/dailyWorkTime*100)
        drawProgressBar(context,164,133,percentageWorkHours)

        context.fillStyle = "#31373D"; 
        context.font = "600 48px Archivo";
        context.fillText(Time.convertTime(totalTime,'short',true), 34 , 208);

        context.font = "600 24px Archivo";
        context.fillText(`${percentageWorkHours}%`, 326.8 , 208);

        context.fillStyle = "#888888"; 
        context.font = "400 20px Archivo";
        context.fillText(`of ${Time.convertTime(dailyWorkTime,'short',true)}`, 396.3 , 208);


        //--- Breakdown ----//
        const totalBreak = totalTime - totalFocusTime
        const percentageFocus = Math.round(totalFocusTime/totalTime* 100) 
        const percentageBreak = 100 - percentageFocus
        drawProgressBar(context,163,252,percentageFocus)

        drawCircle(context,83.5,328.4,"#00B264",percentageFocus)
        drawCircle(context,332.5,328.4,"#5856FF",percentageBreak)

        context.textAlign = 'center'
        context.fillStyle = "#31373D"; 
        context.font = "500 20px Archivo";
        context.fillText(`${percentageFocus}%`, 82.3 , 336);

        context.fillStyle = "#31373D"; 
        context.font = "500 20px Archivo";
        context.fillText(`${percentageBreak}%`, 330.6 , 336);

        context.textAlign = 'left'
        context.fillStyle = "#31373D"; 
        context.font = "600 22px Archivo";
        context.fillText(Time.convertTime(totalFocusTime,'short',true), 147 , 351);
        
        context.fillStyle = "#31373D"; 
        context.font = "600 22px Archivo";
        context.fillText(Time.convertTime(totalBreak,'short',true), 396 , 352.7);


        // //--- Tasks ----//

        let koordinatTask = 482
        let koordinatProgressTask = 474
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const percentage = Math.round(+task.totalTime / totalTime * 100) 
            context.fillStyle = "#31373D"; 
            context.font = "400 20px Archivo";
            context.fillText(`${percentage}%`, 35 , koordinatTask);
            
            context.fillStyle = "#31373D"; 
            context.font = "400 20px Archivo";
            context.fillText(FormatString.truncateString(FormatString.capitalizeFirstChar(task.taskName),18,true), 94.5 , koordinatTask);
    
            context.fillStyle = "#888888"; 
            context.font = "400 20px Archivo";
            context.textAlign = 'right'
            context.fillText(Time.convertTime(+task.totalTime,'short',true), 510 , koordinatTask);
            context.textAlign = 'left'

    
            drawProgressBar(context,296,koordinatProgressTask,percentage,'short')

            koordinatTask += 39.2
            koordinatProgressTask += 40
        }

        if(tasks.length < 2) context.drawImage(fillGrey,36,508)
        if(tasks.length < 3) context.drawImage(fillGrey,36,548)



        //--- Top Projects ----//


        let koordinatProject = 683
        let koordinatProgressProject = 676

        // Project 1
        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            const percentage = Math.round(+project.totalTime / totalProjectTime * 100) 

            context.fillStyle = "#31373D"; 
            context.font = "400 20px Archivo";
            context.fillText(`${percentage}%`, 34.5 , koordinatProject);
    
            context.fillStyle = "#31373D"; 
            context.font = "400 20px Archivo";
            context.fillText(FormatString.truncateString(FormatString.capitalizeFirstChar(project.name),18,true), 94.8 , koordinatProject);
    
            context.fillStyle = "#888888"; 
            context.font = "400 20px Archivo";
            context.textAlign = 'right'
            context.fillText(Time.convertTime(+project.totalTime,'short',true), 510 , koordinatProject);
            context.textAlign = 'left'
            drawProgressBar(context,296,koordinatProgressProject,percentage,'short')
            koordinatProject += 40.2
            koordinatProgressProject += 40
        }

        // context.drawImage(fillGrey,35,763)
        if(projects.length < 2) context.drawImage(fillGrey,35,710)
        if(projects.length < 3) context.drawImage(fillGrey,35,751)
        
        // //--- Coworking Friends ----//
        const coworkerImageSize = 61;
        let xCoordinatCoworker = 162.5
        let yCoordinatCoworker = 806

        const sizeFrame = 62
        let xCoordinateFrame = 161.9
        let yCoordinateFrame = 806
        let counterCoordinatFrame = 0
        for (let i = 0; i < coworkingFriends.length; i++) {
            const coworkingFriend = coworkingFriends[i];
            const photo = await loadImage(coworkingFriend.avatar)
            context.drawImage(photo,xCoordinatCoworker,yCoordinatCoworker,coworkerImageSize,coworkerImageSize)
            context.drawImage(frameAvatar,xCoordinateFrame,yCoordinateFrame,sizeFrame,sizeFrame)

            if(coworkingFriend.streak > 1){
                context.textAlign = 'end'
                context.fillStyle = "#888888"; 
                context.font = "500 16px Archivo";
                context.drawImage(streakPartner,xCoordinatCoworker+4.5,yCoordinatCoworker + 52)
                context.fillText(coworkingFriend.streak,xCoordinatCoworker+31.5,yCoordinatCoworker + 71);
            }
            counterCoordinatFrame += 0.01
            xCoordinatCoworker += 76.2
            xCoordinateFrame += 76.2 + counterCoordinatFrame
        }

        const buffer = canvas.toBuffer('image/png')
        return buffer
    }

    static async coworkingEvent({host, title, session, coworkingDate, attendances,isLive}){
        registerFont('./assets/fonts/Archivo-SemiBold.ttf',{family:'Archivo',weight:600})
        registerFont('./assets/fonts/Inter-Medium.ttf',{family:'Inter',weight:500})

        function roundedRect(context, x, y, width, height, radius) {
            context.beginPath();
            context.moveTo(x + radius, y);
            context.lineTo(x + width - radius, y);
            context.arcTo(x + width, y, x + width, y + radius, radius);
            context.lineTo(x + width, y + height - radius);
            context.arcTo(x + width, y + height, x + width - radius, y + height, radius);
            context.lineTo(x + radius, y + height);
            context.arcTo(x, y + height, x, y + height - radius, radius);
            context.lineTo(x, y + radius);
            context.arcTo(x, y, x + radius, y, radius);
            
        }
          
          // Function to draw a rounded image using the rounded rectangle path and clipping
        function drawRoundedImage(context, img, x, y, width, height, radius) {
            context.save();
            roundedRect(context, x, y, width, height, radius);
            context.lineWidth = 8
            context.strokeStyle = '#EFEFEF'
            context.stroke()
            context.clip();
            context.drawImage(img, x, y, width, height);
            context.restore();
        }

        const drawRotatedImage = (context, image, x, y, angle,size) => {
            let [width, height ] = [size,size];
          
            context.save();
            context.translate(x + width / 2, y + height / 2);
            context.rotate(angle);
            context.drawImage(image, -width / 2, -height / 2, width, height);
            context.restore();
          };

        const formatCoworkingTime = (date,session)=>{
            let [weekday] = date.toLocaleDateString("en-US", { weekday: 'short', day:'2-digit',month:'short',}).split(/[, ]+/)
            return `${weekday} · ${Time.getHoursFromDate(date)}.${Time.getMinutesFromDate(date)} WIB · (${session} min)`
        }
        // import image
        const template = await loadImage(`./assets/images/coworking_template_${isLive? 'live' : 'upcoming'}.png`)
        const frameAvatar = await loadImage(`./assets/images/coworking_photo_frame.png`)
        const canvas = createCanvas(1080,810)
        const context = canvas.getContext('2d')
        context.drawImage(template,-15.5,-11)






        context.fillStyle = "#31373D"; 
        context.font = "600 48px Archivo";
        context.fillText(FormatString.truncateString(title,28),321,179);

        const [month,date] = Time.getFormattedDate(coworkingDate,false,'medium').split(/[ ,]/)
        
        context.fillStyle = "#2B2B2B"; 
        context.textAlign = 'center'
        context.font = "500 64px Inter";
        context.fillText(date,169,217);
        
        context.fillStyle = "#484A4E"; 
        context.font = "500 32px Inter";
        context.fillText(month,170,112);

        context.fillStyle = "#656A71"; 
        context.textAlign = 'start'
        context.font = "500 40px Inter";
        context.fillText(formatCoworkingTime(coworkingDate,session),320,249);
        
        
        context.fillStyle = "#888888"; 
        context.font = "500 40px Inter";
        context.fillText(UserController.getNameFromUserDiscord(host),72,722);


        
        const coworkerImageSize = 95;

        let xCoordinatCoworker = 322 + (85 * (attendances.length - 1))
        let yCoordinatCoworker = 307


        for (let i = attendances.length - 1; i >= 0; i--) {
            const photo = await loadImage(attendances[i])
            roundedRect(context,xCoordinatCoworker,yCoordinatCoworker,coworkerImageSize,coworkerImageSize,48)
            drawRoundedImage(context,photo,xCoordinatCoworker,yCoordinatCoworker,coworkerImageSize,coworkerImageSize,48)
            
            xCoordinatCoworker -= 85
        }

        const hostAvatar = await loadImage(InfoUser.getAvatar(host))
        
        const rectX = 795
        const rectY = 510
        const size = 222.5
        
        
        const rectXFrame = 777
        const rectYFrame = 495
        const sizeFrame = 260
        
        drawRotatedImage(context,hostAvatar,rectX,rectY, 4 * (Math.PI / 180),size)
        context.drawImage(frameAvatar,rectXFrame,rectYFrame,sizeFrame,sizeFrame)
        const buffer = canvas.toBuffer('image/png')
        return buffer
    }
}

module.exports = GenerateImage