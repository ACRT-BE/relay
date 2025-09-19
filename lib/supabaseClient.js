
import { createClient } from '@supabase/supabase-js';
export const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const FORCE_DEMO = (process.env.NEXT_PUBLIC_FORCE_DEMO || '') === '1';
export const hasSupabase = !!url && !!key && !FORCE_DEMO;
export const supabase = hasSupabase ? createClient(url, key, { auth: { persistSession: false }}) : null;
