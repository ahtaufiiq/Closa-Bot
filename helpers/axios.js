const axios = require('axios')
const {BASE_URL,SECRET_TOKEN} = require('./config')

class RequestAxios {
    static get(url) {
        
        return new Promise((resolve, reject) => {
            axios.get(BASE_URL + url, {
                headers: {
                    'content-type': 'application/json',
                    'accessToken':SECRET_TOKEN
                }
            }
            )
                .then((res) => {
                    resolve(res.data)
                })
                .catch((error) => {
                    reject(error)
                })
        })

    }

    static delete(url) {
        return new Promise((resolve, reject) => {
            axios.delete(BASE_URL + url, {
                headers: {
                    'content-type': 'application/json',
                    'accessToken':SECRET_TOKEN
                }
            }
            )
                .then((res) => {
                    resolve(res.data)
                })
                .catch((error) => {
                    reject(error)
                })
        })

    }

    static post(url, data) {
        return new Promise((resolve, reject) => {
            axios.post(BASE_URL + url, data, {
                headers: {
                    'content-type': 'application/json',
                    'accessToken':SECRET_TOKEN
                }}
            )
                .then((res) => {
                    resolve(res.data)
                })
                .catch((error) => {
                    reject(error)
                })
        })

    }
    static put(url, data) {
        return new Promise((resolve, reject) => {
            axios.put(BASE_URL + url, data, {
                headers: {
                    'content-type': 'application/json',
                    'accessToken':SECRET_TOKEN
                }}
            )
                .then((res) => {
                    resolve(res.data)
                })
                .catch((error) => {
                    reject(error)
                })
        })

    }
}


module.exports = RequestAxios
