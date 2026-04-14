import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingSupabaseVars = [];

if (!supabaseUrl) {
	missingSupabaseVars.push('VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
	missingSupabaseVars.push('VITE_SUPABASE_ANON_KEY');
}

export const hasSupabaseEnv = missingSupabaseVars.length === 0;

export const supabaseConfigError = hasSupabaseEnv
	? ''
	: `Missing Supabase environment variables: ${missingSupabaseVars.join(', ')}. Create a .env file from .env.example and restart Vite.`;

export const supabase = hasSupabaseEnv
	? createClient(supabaseUrl, supabaseAnonKey, {
			auth: {
				persistSession: true,
				autoRefreshToken: true,
				detectSessionInUrl: true,
			},
		})
	: null;

export const tables = {
	profiles: () => supabase.from('profiles'),
	families: () => supabase.from('families'),
	familyMembers: () => supabase.from('family_members'),
	medicines: () => supabase.from('medicines'),
	reminders: () => supabase.from('reminders'),
	reminderLogs: () => supabase.from('reminder_logs'),
	healthRecords: () => supabase.from('health_records'),
	notifications: () => supabase.from('notifications'),
	chatMessages: () => supabase.from('chat_messages'),
};

export const getCurrentSession = async () => {
	if (!supabase) {
		return { data: null, error: new Error(supabaseConfigError) };
	}

	const { data, error } = await supabase.auth.getSession();
	return { data: data?.session ?? null, error };
};

export const getCurrentUser = async () => {
	if (!supabase) {
		return { data: null, error: new Error(supabaseConfigError) };
	}

	const { data, error } = await supabase.auth.getUser();
	return { data: data?.user ?? null, error };
};
