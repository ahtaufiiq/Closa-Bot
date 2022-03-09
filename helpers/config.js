require('dotenv').config()


module.exports = {
    TOKEN: process.env.TOKEN,
    CLIENT_ID: process.env.CLIENT_ID,
    MY_ID: process.env.MY_ID,
    GUILD_ID: process.env.GUILD_ID,
    CHANNEL_REMINDER: process.env.CHANNEL_REMINDER,
    CHANNEL_HIGHLIGHT: process.env.CHANNEL_HIGHLIGHT,
    CHANNEL_TODO: process.env.CHANNEL_TODO,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
    SECRET_TOKEN: process.env.SECRET_TOKEN,
    BASE_URL: process.env.BASE_URL
}