const {createCanvas,loadImage,registerFont} = require('canvas')
const UserController = require('../controllers/UserController')
const formatNumber = require('./formatNumber')
const FormatString = require('./formatString')
const InfoUser = require('./InfoUser')
const Time = require('./time')
const {split} = require('canvas-hypertxt')
const supabase = require('./supabaseClient')
const ChannelController = require('../controllers/ChannelController')
class GenerateImage{
    static async tracker(user,goalName,photo,data,friends,currentStreak,longestStreak,totalDays,totalPoints,isVacation=false,vacationLeft=0,isBuyOneVacation=false,isSick=false){
        registerFont('./assets/fonts/Inter-Regular.ttf',{family:'Inter'})
        registerFont('./assets/fonts/Inter-Medium.ttf',{family:'Inter',weight:500})
        registerFont('./assets/fonts/Inter-SemiBold.ttf',{family:'Inter',weight:600})

        function getNextMilestoneStreak(currentStreak){
            if(currentStreak < 7) return 7
            else if(currentStreak < 30) return 30 
            else if(currentStreak < 100) return 100 
            else if(currentStreak < 200) return 200 
            else if(currentStreak < 365) return 365 
            else return 1000 
        }
 
        function drawProgressBar(context,x,y,percentage,type='long',width=12){
            context.beginPath()
            let maxLength = 923.5
            if(percentage >= 100) percentage = 100
            const barLength = (maxLength * percentage / 100)
            context.moveTo(x, y);
            context.lineTo(x + barLength, y);
            context.lineCap = 'round'
            context.lineWidth = width;
            const gradient = context.createLinearGradient(x, y, x + barLength , y+width);
            gradient.addColorStop(0,"#2AFCD7" );
            gradient.addColorStop(0.25,"#2EDDD0" );
            gradient.addColorStop(0.5,"#5569E8" );
            gradient.addColorStop(0.75,"#FC7BFF" );
            gradient.addColorStop(1,"#F9B06E" );
            context.strokeStyle = (isVacation || isSick || longestStreak < 30) ? "#00B264" : longestStreak < 100 ? '#FF9500' : longestStreak < 200 ? '#19C9BE' : longestStreak < 365 ? '#5856FF' : gradient
            context.stroke();
            context.closePath()
        }

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

        function drawRoundedImage(context, img, x, y, width, height, radius) {
            context.save();
            roundedRect(context, x, y, width, height, radius);
            context.clip();
            context.drawImage(img, x, y, width, height);
            context.restore();
        }
        const additionalStreak = isVacation ? '_vacation' : isSick ? "_sick" : longestStreak >= 365 ? '_365streak' : longestStreak >= 200 ? '_200streak' : longestStreak >= 100 ? '_100streak' : longestStreak >= 30 ? "_30streak" : longestStreak >= 7 ? '_7streak': ''

        const [greenDot,safetyDot,checklist,empty,zap,zap100,zap200,zap365] = await Promise.all([
            loadImage(`./assets/images/progress${additionalStreak}.png`),
            loadImage(`./assets/images/safety${additionalStreak}.png`),
            loadImage(`./assets/images/checklist${additionalStreak}.png`),
            loadImage(`./assets/images/empty.png`),
            loadImage(`./assets/images/zap.png`),
            loadImage(`./assets/images/zap_100.png`),
            loadImage(`./assets/images/zap_200.png`),
            loadImage(`./assets/images/zap_365.png`),
        ])
        const nextMilestoneStreak = getNextMilestoneStreak(longestStreak)
        const remainingDays = nextMilestoneStreak - currentStreak
        const progressToMilestone = Math.round(currentStreak/nextMilestoneStreak*100)

        // canvas
        const canvas = createCanvas(1081.8,1560)
        const context = canvas.getContext('2d')
        const template = await loadImage(`./assets/images/template${additionalStreak}.png`)
        context.drawImage(template,0,0)

        context.fillStyle = "#31373D"; 
        context.font = "600 45px Inter";
        const name = UserController.getNameFromUserDiscord(user)
        context.fillText(FormatString.truncateString(name,20), 228 , 132);
        
        context.textAlign = 'end'
        context.font = "600 72px Inter";
        context.fillText(`${currentStreak}`, 964 , 152.9);

        drawProgressBar(context,77.6,276,progressToMilestone)
        
        context.fillStyle = "#888888"; 
        context.font = "500 36px Inter";
        context.fillText(`${remainingDays} day${remainingDays > 1 ? 's' : ''} away`, 1008.5 , 342);

        context.textAlign = 'start'
        
        context.font = "500 36px Inter";
        context.fillText(`${formatNumber(totalPoints)} pts`, 227.9, 192.3);
        
        context.fillStyle = "#31373D"; 
        context.font = "600 45px Inter";
        // const maxCharGoal = (isVacation || isSick) ?(vacationLeft === 0 ? 25 : 23) : 37
        context.fillText(FormatString.truncateString(goalName,24), 72 , 501);

        
        context.textAlign = 'end'
        context.fillStyle = "#888888"; 
        context.font = "40px Inter";
        context.fillText(`${Time.getFormattedDate(Time.getDate()).split(',').join(' ·')}`, 1006.8 , 1485.5);
        context.textAlign = 'start'
        
        context.font = "500 36px Inter";
        context.fillText(`DAY ${totalDays}`, 129 , 1485);
        

        if(isVacation || isSick){
            context.fillStyle = "#888888"; 
            context.font = "500 39px Inter";
            context.fillText(nextMilestoneStreak,71.9 , 344.9)
            const iconStreak = nextMilestoneStreak >= 365 ? zap365 : nextMilestoneStreak >= 200 ? zap200 : nextMilestoneStreak >= 100 ? zap100 : zap
            const totalDigitStreak = `${nextMilestoneStreak}`.length
            const addCoordinate = totalDigitStreak === 3 ? 24 : totalDigitStreak === 4 ? 45 : 0
            context.drawImage(iconStreak,129 + addCoordinate,312) 

            context.font = "500 36px Inter";
            context.textAlign = 'end'
            const xCoordinat = 958
            const yCoordinat = 498
            if(vacationLeft === 0 ){
                if(isBuyOneVacation) context.fillText(`rest day`, xCoordinat, yCoordinat);
                else context.fillText(`last day`, xCoordinat, yCoordinat);
            }else{
                context.fillText(`${vacationLeft} ${vacationLeft > 1 ? "days" :"day"} left`, xCoordinat, yCoordinat);
            }


        }

        const today = Time.getDate()
        const day = today.getDay() === 0 ? 7 : today.getDay()
        let startDate = Time.getNextDate(-(20+day))
        const endDate = Time.getNextDate(8-day)
        const fourWeek = {}
        let counter = 0
        let baris = 0
        let column = 0
        const gapX = 143.9
        const gapY = 108
        const startY = 651
        const startX = 72.5
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

        const friendsImageSize = 122;
        let xCoordinatFriends = 78
        let yCoordinatFriends = 1192.8

        let xCoordinatStreak = 75
        context.textAlign = 'center'
        for (let i = 0; i < friends.length; i++) {
            try {
                const {currentStreak,avatarURL} = friends[i];
                const totalDigitStreak = `${currentStreak}`.length
                const addCoordinate = totalDigitStreak === 2 ? 5 : totalDigitStreak === 1 ? 10 : 0
                const photo = await loadImage(avatarURL)
                const streakImage = currentStreak >= 365 ? zap365 : currentStreak >= 200 ? zap200 : currentStreak >= 100 ? zap100 : zap
                drawRoundedImage(context,photo,xCoordinatFriends,yCoordinatFriends,friendsImageSize,friendsImageSize,friendsImageSize/2)
                context.drawImage(streakImage,xCoordinatFriends+78.5,yCoordinatFriends + 145.2)
                context.fillText(currentStreak,xCoordinatStreak+45+addCoordinate,yCoordinatFriends + 175);
                xCoordinatFriends += 200.5
                xCoordinatStreak += 200.5
                
            } catch (error) {
                ChannelController.sendError('invalid avatar image',friends[i].id)
                supabase.from("Users")
                    .update({avatarURL:null})
                    .eq('id',friends[i].id)
                    .then()
            }
        }


        const photoUser = await loadImage(photo)

        const rectWidth = 112;
        const rectHeight = 112;
        const rectX = 79;
        const rectY = 91;
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

    static async referralTicket(referralCode){
        registerFont('./assets/fonts/IBMPlexMono-Regular.ttf',{family:'IBMPlexMono',weight:400})
        registerFont('./assets/fonts/DMMono-Medium.ttf',{family:'DMMono',weight:500})
        
        const canvas = createCanvas(1440,1440)

        const context = canvas.getContext('2d')
 
        const template = await loadImage('./assets/images/referral_code.png')
        context.drawImage(template,0,0)
        context.fillStyle = "#FAFAFB"; 
        context.font = "400 48px IBMPlexMono";
        context.textAlign = 'center'
        context.fillText(referralCode, 721 , 776);
        
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
        context.fillText(FormatString.truncateString(username,20), 300 , 1786);

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
            context.font = "500 44px BaiJamjuree";
            context.fillText(`${totalReferral} invite${totalReferral>1? "s" : ""}`, 1005 , 366);

        }else{
            const template = await loadImage(`./assets/images/referral_cover_oneInvite${isDarkMode ? "":"_white"}.png`) 
            context.drawImage(template,0,0)
        }

        
        if(!isDarkMode) context.fillStyle = "#2B2B2B"

        context.textAlign = 'center'
        context.font = "600 42px Archivo";
        const username = UserController.getNameFromUserDiscord(user)
        context.fillText(username, 719 , 1358);

		const avatarUrl = InfoUser.getAvatar(user)
        const photoUser = await loadImage(avatarUrl)

        const rectWidth = 135.7;
        const rectHeight = 135.7;
        const rectX = 652;
        const rectY = 1156;
        const cornerRadius = 43;
        
        this.roundRect(context, rectX, rectY, rectWidth, rectHeight, cornerRadius);
        context.clip()
        context.drawImage(photoUser,rectX,rectY,rectWidth,rectHeight)
        
        const buffer = canvas.toBuffer('image/png')
        return buffer
    }

    static async dailySummary({user,dailyWorkTime,tasks,projects,totalSession,coworkingFriends,dateOnly}){
        function drawProgressBar(context,x,y,percentage,type='long',width=6){
            context.beginPath()
            let maxLength = 350
            if(type === 'short') maxLength = 100
            if(percentage >= 100) percentage = 100
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
            if(percentage === 0) return
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
        context.fillText(FormatString.truncateString(UserController.getNameFromUserDiscord(user),16), 117.2 , 57);
        
        context.fillStyle = "#888888"; 
        context.font = "400 18px Archivo";
        context.fillText(`${totalSession}x ${totalSession > 1 ? 'sessions': 'session'}`, 117 , 86);

        context.textAlign = 'right'

        context.font = "400 20px Archivo";
        context.fillText(Time.getFormattedDate(Time.getDate(dateOnly),false,'long'), 514.5 , 84);
        context.textAlign = 'left'


        //--- Work Hours ----//
        const percentageWorkHours = Math.round(totalTime/dailyWorkTime*100)
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
        context.fillText(`${percentageFocus}%`, 86 , 336);

        context.fillStyle = "#31373D"; 
        context.font = "500 20px Archivo";
        context.fillText(`${percentageBreak}%`, 336 , 336);

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
            if(i === 3) break
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
            if(i === 3) break
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
                context.font = "500 20px Archivo";
                context.drawImage(streakPartner,xCoordinatCoworker+2,yCoordinatCoworker + 50)
                context.fillText(coworkingFriend.streak,xCoordinatCoworker+31.8,yCoordinatCoworker + 73.8);
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
            if(Time.getDateOnly(coworkingDate) === Time.getTodayDateOnly()) weekday = "Today"

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

        if(attendances.length > 5){
            context.fillText(`${attendances.length - 5}+`,778.5,371);
        }


        
        const coworkerImageSize = 95;
        let startPoint = attendances.length - 1
        if(startPoint > 4) startPoint = 4

        let xCoordinatCoworker = 322 + (85 * startPoint)
        let yCoordinatCoworker = 307


        for (let i = startPoint; i >= 0; i--) {
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
    static async project({user,project,goal,date}){
        registerFont('./assets/fonts/PlusJakartaSans-Bold.ttf',{family:'JakartaSans'})
        
        function wrapText(context, text, x, y, maxWidth, lineHeight) {
            const words = text.split(/[ \n]/);
            let line = '';
            let currentY = y;
            let counter = 0
            for (let i = 0; i < words.length; i++) {
              const testLine = line + words[i] + ' ';
              const metrics = context.measureText(testLine);
              const testWidth = metrics.width;
          
              if (testWidth > maxWidth && i > 0) {
                counter++
                if(counter === 4){
                    line += '...'
                    break
                }
                context.fillText(line, x, currentY);
                line = words[i] + ' ';
                currentY += lineHeight;
              } else {
                line = testLine;
              }
            }
            context.fillText(line, x, currentY);
        }

        const template = await loadImage(`./assets/images/project_template.png`)
        
        const canvas = createCanvas(1080,1080)
        const context = canvas.getContext('2d')
        context.drawImage(template,0,0)

        context.textAlign = 'center'

        context.fillStyle = "#00B264"; 
        context.font = "42px JakartaSans";
        
        context.fillText(project,template.width/2,391)

        context.fillStyle = "#2B2B2B"; 
        context.font = "64px JakartaSans";
        wrapText(context,goal,template.width/2,485,900,76.8)
        
        context.fillStyle = "#888888"; 
        context.font = "36px JakartaSans";
        context.textAlign = 'end'
        context.fillText('by '+Time.getFormattedDate(date,false,'medium').toLowerCase(),1011,1010)
        
        context.textAlign = 'start'
        context.fillStyle = "#7E7C7C"; 
        context.fillText(FormatString.truncateString(UserController.getNameFromUserDiscord(user),20),239,1010)


        const hostAvatar = await loadImage(InfoUser.getAvatar(user))
        const sizeAvatar = 138
        const coordinatX = 71.5
        const coordinatY = 875.5
        this.roundRect(context,coordinatX,coordinatY,sizeAvatar,sizeAvatar,32)
        context.clip()
        context.drawImage(hostAvatar,coordinatX,coordinatY,sizeAvatar,sizeAvatar)

        const buffer = canvas.toBuffer('image/png')
        return buffer
    }

    static async coworkingStreakBadge(totalStreak,totalSession,totalTime,user,partner){
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
        
        function drawRoundedImage(context, img, x, y, width, height, radius) {
            context.save();
            roundedRect(context, x, y, width, height, radius);
            context.lineWidth = 12
            context.strokeStyle = getGradientColor(x, y, x , y + 100,totalStreak)
            context.shadowColor = 'rgba(0, 0, 0, 0.45)';
            context.shadowOffsetY = 4.17
            context.shadowBlur = 4.17;
            context.stroke()
            context.clip();
            context.drawImage(img, x, y, width, height);
            context.restore();
        }

        function getGradientColor(x0,y0,x1,y1,streak) {
            const gradientStreak = {
                7:{start:'#E9F1F9',end:'#BDC4CB'},
                30:{start:'#F2E499',end:'#A49F78'},
                100:{start:'#99F2D2',end:'#659B8E'},
                200:{start:'#CFD4FF',end:'#8E8CF9'},
                365:{start:'#E9F1F9',end:'#BDC4CB'},
            }
            const gradient = context.createLinearGradient(x0, y0, x1 , y1);
            gradient.addColorStop(0,gradientStreak[streak].start );
            gradient.addColorStop(1, gradientStreak[streak].end);
            return gradient
        }
        const canvas = createCanvas(1440,1920)

        const context = canvas.getContext('2d')
 
        const template = await loadImage(`./assets/images/coworking_streak_${totalStreak}_badge.png`)
        context.drawImage(template,0,0)
        context.fillStyle = "#161F26"; 
        context.font = "500 36px Inter";
        const username = UserController.getNameFromUserDiscord(user)
        context.fillText(username, 191.5 , 1744.8);
        const usernamePartner = UserController.getNameFromUserDiscord(partner)
        context.fillText(usernamePartner, 191.5 , 1788.9);


        const xSession = 1157.4
        const ySession = 1397
        context.textAlign = 'end'

        context.fillStyle = getGradientColor(xSession,ySession-25,xSession,ySession + 60,totalStreak)
        context.font = "600 48px Archivo";
        context.fillText(`${totalSession} sessions`, xSession, ySession);
        const totalTimeInHour = Math.floor(totalTime / 60)
        const coworkingTime = totalTimeInHour < 1 ? `${totalTime} minutes` : `${totalTimeInHour} hour${totalTimeInHour > 1 ? 's':''}`
        context.fillText(coworkingTime, xSession, ySession + 52);

        const rectWidth = 90;
        const rectHeight = 90;
        const rectX = 991;
        const rectY = 1242;
        const cornerRadius = 45;
        
        const photoUser = await loadImage(InfoUser.getAvatar(user))
        const photoPartner = await loadImage(InfoUser.getAvatar(partner))
        drawRoundedImage(context,photoPartner,rectX + 71,rectY,rectWidth,rectHeight,cornerRadius)
        drawRoundedImage(context,photoUser,rectX,rectY,rectWidth,rectHeight,cornerRadius)
        const buffer = canvas.toBuffer('image/png')
        return buffer
    }

    static async coworkingTimeBadge(user,totalSession,type){
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
        
        function drawRoundedImage(context, img, x, y, width, height, radius) {
            context.save();
            roundedRect(context, x, y, width, height, radius);
            context.lineWidth = 12
            context.strokeStyle = getGradientColor(x, y, x , y + 100,type)
            context.shadowColor = 'rgba(0, 0, 0, 0.45)';
            context.shadowOffsetY = 4.17
            context.shadowBlur = 4.17;
            context.stroke()
            context.clip();
            context.drawImage(img, x, y, width, height);
            context.restore();
        }

        function getGradientColor(x0,y0,x1,y1,type) {
            const gradientType = {
                '1000min':{start:'#E9F1F9',end:'#BDC4CB'},
                '50hr':{start:'#F2E499',end:'#A49F78'},
                '100hr':{start:'#F2E499',end:'#A49F78'},
                '300hr':{start:'#99F2D2',end:'#659B8E'},
                '500hr':{start:'#CFD4FF',end:'#8E8CF9'},
                '1000hr':{start:'#1CEFFF',middle:'#F2E499',end:'#F4C4F3'},
            }
            const gradient = context.createLinearGradient(x0, y0, x1 , y1);
            gradient.addColorStop(0,gradientType[type].start );
            if(type === '1000hr') gradient.addColorStop(0.5,gradientType[type].middle );
            gradient.addColorStop(1, gradientType[type].end);
            return gradient
        }
        const canvas = createCanvas(1440,1920)

        const context = canvas.getContext('2d')
 
        const template = await loadImage(`./assets/images/coworking_time_${type}_badge.png`)
        context.drawImage(template,0,0)
        context.fillStyle = "#161F26"; 
        context.font = "500 40px Inter";
        const username = UserController.getNameFromUserDiscord(user)
        context.fillText(username, 192 , 1788);

        const xSession = 1164.5
        const ySession = 1461
        context.textAlign = 'end'

        context.fillStyle = getGradientColor(xSession,ySession-25,xSession,ySession + 60,type)
        context.font = "600 48px Archivo";
        context.fillText(`${totalSession} sessions`, xSession, ySession);

        const rectWidth = 94;
        const rectHeight = 94;
        const rectX = 1063;
        const rectY = 1300.5;
        const cornerRadius = 45;
        
        const photoUser = await loadImage(InfoUser.getAvatar(user))
        drawRoundedImage(context,photoUser,rectX,rectY,rectWidth,rectHeight,cornerRadius)
        const buffer = canvas.toBuffer('image/png')
        return buffer
    }
}

module.exports = GenerateImage
