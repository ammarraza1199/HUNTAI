// frontend/lib/supabase.ts
// HuntAI - AI Job Hunter Agent
// Supabase Browser Client Configuration

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing in browser environment.');
}

// Client as a singleton for frontend application state
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Auth helper for easier session management
export const getCurrentSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
};

export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
};
