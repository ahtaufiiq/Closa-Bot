class FormatString {
    static truncateString(text,maxLength=90){
        if (text.length > maxLength) {
            return text.substring(0,maxLength) +'...'
        }else{
            return text
        }
    }
}

module.exports = FormatString