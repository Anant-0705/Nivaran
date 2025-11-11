const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check if credentials are configured
const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && 
         supabaseUrl !== 'YOUR_SUPABASE_URL' && 
         supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
         supabaseUrl.startsWith('https://');
};

// Client with anon key for general operations
const supabase = isSupabaseConfigured() ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Admin client with service role key for admin operations
const supabaseAdmin = isSupabaseConfigured() && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

module.exports = {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured
};
