class FormatString {
    static truncateString(text="",maxLength=90,isTwoDot=false){
        if(text===null) text = ''
        if (text.length > maxLength) {
            return text.substring(0,maxLength) +`${isTwoDot ? ".." : "..."}`
        }else{
            return text
        }
    }

    static notCharacter(text){
        return text > "~"
    }

    static isNumber(stringNumber){
        return !Number.isNaN(Number(stringNumber))
    }

    static capitalizeWords(str) {
        return str.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    static capitalizeFirstChar(str) {
        if(!str) return ''
        const word = str.trim()
        return word.charAt(0).toUpperCase() + word.slice(1)
    }

    static 
}

module.exports = FormatString