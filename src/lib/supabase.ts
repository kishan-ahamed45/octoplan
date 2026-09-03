import { createClient } from '@supabase/supabase-js';

let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  ''
).trim();

// Normalize URL if dashboard URL was accidentally pasted
if (rawUrl.includes('supabase.com/dashboard/project/')) {
  const match = rawUrl.match(/project\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    rawUrl = `https://${match[1]}.supabase.co`;
  }
}

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  supabaseKey &&
  !rawUrl.includes('your-project') &&
  !supabaseKey.includes('your-')
);

export const supabase = isSupabaseConfigured
  ? createClient(rawUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  : null;
