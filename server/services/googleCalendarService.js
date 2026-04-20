import { google } from 'googleapis';
import { adminSupabase } from '../lib/adminSupabaseClient.js';

const getOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/google/callback`;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar'];

export const getGoogleAuthUrl = ({ userId }) => {
  const oauthClient = getOAuthClient();
  return oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_SCOPES,
    prompt: 'consent',
    state: userId,
  });
};

export const storeGoogleTokens = async ({ userId, tokens }) => {
  if (!adminSupabase) throw new Error('Supabase admin client is not configured.');

  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null;

  const { error } = await adminSupabase.from('google_tokens').upsert(
    {
      user_id: userId,
      access_token: tokens.access_token || null,
      refresh_token: tokens.refresh_token || null,
      expiry: expiresAt,
      scope: tokens.scope || GOOGLE_SCOPES.join(' '),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
};

export const exchangeGoogleCode = async ({ code }) => {
  const oauthClient = getOAuthClient();
  const { tokens } = await oauthClient.getToken(code);
  return tokens;
};

export const getGoogleConnectionStatus = async ({ userId }) => {
  if (!adminSupabase) throw new Error('Supabase admin client is not configured.');

  const { data, error } = await adminSupabase
    .from('google_tokens')
    .select('user_id, expiry, calendar_id, email')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return {
    connected: Boolean(data),
    ...data,
  };
};

const getUserTokens = async ({ userId }) => {
  if (!adminSupabase) throw new Error('Supabase admin client is not configured.');

  const { data, error } = await adminSupabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const getCalendarClientForUser = async ({ userId }) => {
  const tokenRow = await getUserTokens({ userId });
  const oauthClient = getOAuthClient();

  oauthClient.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date: tokenRow.expiry ? new Date(tokenRow.expiry).getTime() : undefined,
  });

  oauthClient.on('tokens', async (newTokens) => {
    try {
      await storeGoogleTokens({
        userId,
        tokens: {
          ...newTokens,
          refresh_token: newTokens.refresh_token || tokenRow.refresh_token,
        },
      });
    } catch (error) {
      console.error('Failed to persist refreshed Google tokens:', error.message);
    }
  });

  return {
    oauthClient,
    calendar: google.calendar({ version: 'v3', auth: oauthClient }),
    tokenRow,
  };
};

export const persistCalendarIdentity = async ({ userId, oauthClient }) => {
  if (!adminSupabase) throw new Error('Supabase admin client is not configured.');

  const calendarApi = google.calendar({ version: 'v3', auth: oauthClient });
  const [primaryCalendar, profileInfo] = await Promise.all([
    calendarApi.calendars.get({ calendarId: 'primary' }),
    google.oauth2({ version: 'v2', auth: oauthClient }).userinfo.get(),
  ]);

  const { error } = await adminSupabase
    .from('google_tokens')
    .update({
      calendar_id: primaryCalendar?.data?.id || null,
      email: profileInfo?.data?.email || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;
};
