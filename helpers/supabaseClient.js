const { createClient } = require('@supabase/supabase-js')
const {SUPABASE_KEY,SUPABASE_URL} = require('./config')
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
module.exports = supabase

