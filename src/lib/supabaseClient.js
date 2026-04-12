import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing Supabase environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
	},
});

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
	const { data, error } = await supabase.auth.getSession();
	return { data: data?.session ?? null, error };
};

export const getCurrentUser = async () => {
	const { data, error } = await supabase.auth.getUser();
	return { data: data?.user ?? null, error };
};
