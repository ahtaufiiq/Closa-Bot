const fs = require('fs')
class LocalData {
    static getData(){
        return JSON.parse(fs.readFileSync('data.json'))
    }

    static writeData(data) {
        fs.writeFileSync('data.json',JSON.stringify(data,null,2))
    }
}

module.exports = LocalData