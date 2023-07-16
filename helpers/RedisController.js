const Redis = require("ioredis");
const { UPSTASH_REDIS_REST_URL } = require("./config");


class RedisController{
    static async get(key){
        const redis = new Redis(UPSTASH_REDIS_REST_URL);
        const value = await redis.get(key)
        redis.disconnect()
        return value
    }

    static async set(key,value,ttl){
        const redis = new Redis(UPSTASH_REDIS_REST_URL);
        if(!ttl) await redis.set(key,value)
        else await redis.set(key,value,"EX",ttl)
        redis.disconnect()
    }
}

module.exports = RedisController