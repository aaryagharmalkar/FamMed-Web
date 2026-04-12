-- Enable required extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS (extends Supabase auth.users)
CREATE TABLE public.profiles (
	id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
	full_name TEXT NOT NULL,
	avatar_url TEXT,
	role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
	date_of_birth DATE,
	phone TEXT,
	emergency_contact TEXT,
	created_at TIMESTAMPTZ DEFAULT NOW(),
	updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAMILIES (a family group)
CREATE TABLE public.families (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	name TEXT NOT NULL,
	created_by UUID REFERENCES public.profiles(id),
	invite_code TEXT UNIQUE DEFAULT substr(md5(random()::TEXT), 1, 8),
	created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAMILY MEMBERS (links profiles to families with roles)
CREATE TABLE public.family_members (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
	profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
	role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'caregiver')),
	joined_at TIMESTAMPTZ DEFAULT NOW(),
	UNIQUE(family_id, profile_id)
);

-- MEDICINES
CREATE TABLE public.medicines (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
	assigned_to UUID REFERENCES public.profiles(id),
	name TEXT NOT NULL,
	generic_name TEXT,
	dosage TEXT NOT NULL,
	dosage_unit TEXT DEFAULT 'mg',
	form TEXT CHECK (form IN ('tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'patch', 'other')),
	frequency TEXT NOT NULL,
	instructions TEXT,
	stock_count INTEGER DEFAULT 0,
	low_stock_threshold INTEGER DEFAULT 5,
	start_date DATE,
	end_date DATE,
	is_active BOOLEAN DEFAULT TRUE,
	prescription_url TEXT,
	side_effects TEXT[],
	interactions TEXT[],
	created_by UUID REFERENCES public.profiles(id),
	created_at TIMESTAMPTZ DEFAULT NOW(),
	updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REMINDERS
CREATE TABLE public.reminders (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE,
	family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
	assigned_to UUID REFERENCES public.profiles(id),
	scheduled_time TIME NOT NULL,
	days_of_week INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6],
	is_active BOOLEAN DEFAULT TRUE,
	notification_method TEXT[] DEFAULT ARRAY['in-app'],
	last_triggered_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REMINDER LOGS (tracks taken/skipped/missed)
CREATE TABLE public.reminder_logs (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	reminder_id UUID REFERENCES public.reminders(id) ON DELETE CASCADE,
	medicine_id UUID REFERENCES public.medicines(id),
	scheduled_at TIMESTAMPTZ NOT NULL,
	action TEXT CHECK (action IN ('taken', 'skipped', 'missed', 'snoozed')),
	notes TEXT,
	logged_by UUID REFERENCES public.profiles(id),
	logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- HEALTH RECORDS
CREATE TABLE public.health_records (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
	profile_id UUID REFERENCES public.profiles(id),
	record_type TEXT CHECK (record_type IN ('prescription', 'lab_report', 'vaccination', 'diagnosis', 'allergy', 'surgery', 'other')),
	title TEXT NOT NULL,
	description TEXT,
	file_url TEXT,
	file_name TEXT,
	file_size INTEGER,
	mime_type TEXT,
	recorded_date DATE,
	doctor_name TEXT,
	hospital_name TEXT,
	tags TEXT[],
	created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT HISTORY
CREATE TABLE public.chat_messages (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
	role TEXT CHECK (role IN ('user', 'assistant')),
	content TEXT NOT NULL,
	created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
	type TEXT CHECK (type IN ('reminder', 'low_stock', 'missed_dose', 'info', 'alert')),
	title TEXT NOT NULL,
	body TEXT,
	is_read BOOLEAN DEFAULT FALSE,
	related_id UUID,
	created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helpers for family membership checks
CREATE OR REPLACE FUNCTION public.is_family_member(target_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
	SELECT EXISTS (
		SELECT 1
		FROM public.family_members fm
		WHERE fm.family_id = target_family_id
			AND fm.profile_id = auth.uid()
	);
$$;

CREATE OR REPLACE FUNCTION public.is_family_admin_or_caregiver(target_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
	SELECT EXISTS (
		SELECT 1
		FROM public.family_members fm
		WHERE fm.family_id = target_family_id
			AND fm.profile_id = auth.uid()
			AND fm.role IN ('admin', 'caregiver')
	);
$$;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles
	FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Family members can view related profiles" ON public.profiles
	FOR SELECT USING (
		EXISTS (
			SELECT 1
			FROM public.family_members fm_self
			JOIN public.family_members fm_target ON fm_self.family_id = fm_target.family_id
			WHERE fm_self.profile_id = auth.uid()
				AND fm_target.profile_id = public.profiles.id
		)
	);

CREATE POLICY "Users can update own profile" ON public.profiles
	FOR UPDATE USING (auth.uid() = id);

-- FAMILIES POLICIES
CREATE POLICY "Family members can view families" ON public.families
	FOR SELECT USING (public.is_family_member(id));

CREATE POLICY "Authenticated users can create families" ON public.families
	FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Family admins can update families" ON public.families
	FOR UPDATE USING (public.is_family_admin_or_caregiver(id));

CREATE POLICY "Family admins can delete families" ON public.families
	FOR DELETE USING (public.is_family_admin_or_caregiver(id));

-- FAMILY MEMBERS POLICIES
CREATE POLICY "Members can view family_members" ON public.family_members
	FOR SELECT USING (public.is_family_member(family_id));

CREATE POLICY "Admins can insert family_members" ON public.family_members
	FOR INSERT WITH CHECK (public.is_family_admin_or_caregiver(family_id));

CREATE POLICY "Admins can update family_members" ON public.family_members
	FOR UPDATE USING (public.is_family_admin_or_caregiver(family_id));

CREATE POLICY "Admins can delete family_members" ON public.family_members
	FOR DELETE USING (public.is_family_admin_or_caregiver(family_id));

-- MEDICINES POLICIES
CREATE POLICY "Family members can view medicines" ON public.medicines
	FOR SELECT USING (public.is_family_member(family_id));

CREATE POLICY "Family admins can insert medicines" ON public.medicines
	FOR INSERT WITH CHECK (public.is_family_admin_or_caregiver(family_id));

CREATE POLICY "Family admins can update medicines" ON public.medicines
	FOR UPDATE USING (public.is_family_admin_or_caregiver(family_id));

CREATE POLICY "Family admins can delete medicines" ON public.medicines
	FOR DELETE USING (public.is_family_admin_or_caregiver(family_id));

-- REMINDERS POLICIES
CREATE POLICY "Family members can view reminders" ON public.reminders
	FOR SELECT USING (public.is_family_member(family_id));

CREATE POLICY "Family admins can insert reminders" ON public.reminders
	FOR INSERT WITH CHECK (public.is_family_admin_or_caregiver(family_id));

CREATE POLICY "Family admins can update reminders" ON public.reminders
	FOR UPDATE USING (public.is_family_admin_or_caregiver(family_id));

CREATE POLICY "Family admins can delete reminders" ON public.reminders
	FOR DELETE USING (public.is_family_admin_or_caregiver(family_id));

-- REMINDER LOGS POLICIES
CREATE POLICY "Family members can view reminder logs" ON public.reminder_logs
	FOR SELECT USING (
		EXISTS (
			SELECT 1
			FROM public.reminders r
			WHERE r.id = reminder_id
				AND public.is_family_member(r.family_id)
		)
	);

CREATE POLICY "Family members can insert reminder logs" ON public.reminder_logs
	FOR INSERT WITH CHECK (
		EXISTS (
			SELECT 1
			FROM public.reminders r
			WHERE r.id = reminder_id
				AND public.is_family_member(r.family_id)
		)
	);

-- HEALTH RECORDS POLICIES
CREATE POLICY "Family members can view health records" ON public.health_records
	FOR SELECT USING (public.is_family_member(family_id));

CREATE POLICY "Family members can insert health records" ON public.health_records
	FOR INSERT WITH CHECK (public.is_family_member(family_id));

CREATE POLICY "Family members can update health records" ON public.health_records
	FOR UPDATE USING (public.is_family_member(family_id));

CREATE POLICY "Family admins can delete health records" ON public.health_records
	FOR DELETE USING (public.is_family_admin_or_caregiver(family_id));

-- CHAT MESSAGES POLICIES
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
	FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
	FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
	FOR DELETE USING (auth.uid() = profile_id);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON public.notifications
	FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
	FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "System or owners can insert notifications" ON public.notifications
	FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- TRIGGERS: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medicines_updated_at BEFORE UPDATE ON public.medicines
	FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
	FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
	INSERT INTO public.profiles (id, full_name, avatar_url)
	VALUES (
		NEW.id,
		COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Member'),
		NEW.raw_user_meta_data->>'avatar_url'
	);
	RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
	FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- INDEXES for performance
CREATE INDEX idx_family_members_family_profile ON public.family_members(family_id, profile_id);
CREATE INDEX idx_family_members_profile_id ON public.family_members(profile_id);
CREATE INDEX idx_medicines_family_id ON public.medicines(family_id);
CREATE INDEX idx_medicines_assigned_to ON public.medicines(assigned_to);
CREATE INDEX idx_reminders_medicine_id ON public.reminders(medicine_id);
CREATE INDEX idx_reminders_family_id ON public.reminders(family_id);
CREATE INDEX idx_reminder_logs_scheduled ON public.reminder_logs(scheduled_at);
CREATE INDEX idx_health_records_profile ON public.health_records(profile_id);
CREATE INDEX idx_health_records_family ON public.health_records(family_id);
CREATE INDEX idx_notifications_profile ON public.notifications(profile_id, is_read);
CREATE INDEX idx_chat_messages_profile ON public.chat_messages(profile_id, created_at DESC);

-- Supabase Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('health-files', 'health-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload" ON storage.objects
	FOR INSERT WITH CHECK (
		bucket_id = 'health-files' AND auth.role() = 'authenticated'
	);

CREATE POLICY "Users can view own files" ON storage.objects
	FOR SELECT USING (
		bucket_id = 'health-files' AND auth.uid()::text = (storage.foldername(name))[1]
	);

CREATE POLICY "Users can update own files" ON storage.objects
	FOR UPDATE USING (
		bucket_id = 'health-files' AND auth.uid()::text = (storage.foldername(name))[1]
	);

CREATE POLICY "Users can delete own files" ON storage.objects
	FOR DELETE USING (
		bucket_id = 'health-files' AND auth.uid()::text = (storage.foldername(name))[1]
	);
