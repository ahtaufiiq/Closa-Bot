class FormatString {
    static truncateString(text,maxLength=90){
        return text.substring(0,maxLength) +'...'
    }
}

module.exports = FormatString