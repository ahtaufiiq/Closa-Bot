function formatToRupiah(price) {
    const priceStr = price.toString()
    let result = ''
    let counter = 1
    for (let i = priceStr.length - 1; i >= 0; i--) {
        result = priceStr[i] + result
        if (counter === 3 && i !== 0) {
            result = '.' + result
            counter = 0
        }
        counter ++
    }

    return `IDR ${result}`
}

module.exports = formatToRupiah