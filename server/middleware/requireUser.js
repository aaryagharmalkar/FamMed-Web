import { adminSupabase } from '../lib/adminSupabaseClient.js';

export const requireUser = async (req, res, next) => {
  try {
    if (!adminSupabase) {
      return res.status(500).json({ error: 'Backend Supabase admin client is not configured.' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token.' });
    }

    const {
      data: { user },
      error,
    } = await adminSupabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Authentication failed.' });
  }
};
