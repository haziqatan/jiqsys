import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://dznuvdnapgcanljuauhn.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bnV2ZG5hcGdjYW5sanVhdWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzM3MjAsImV4cCI6MjA4ODkwOTcyMH0.r9vn3Ul0LXIN7m0mIZHW8Z5hakQVEsX6HQJkvx6RHRM';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

let supabaseClientInstance;

export function getSupabaseClient() {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClientInstance;
}

export function initializeSupabaseGlobals() {
  const client = getSupabaseClient();
  window.__JIQSYS_SUPABASE_URL__ = supabaseUrl;
  window.__JIQSYS_SUPABASE_ANON_KEY__ = supabaseAnonKey;
  window.__JIQSYS_SUPABASE_CLIENT__ = client;
  return client;
}

