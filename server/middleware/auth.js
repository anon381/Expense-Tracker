// JWT auth middleware.
// Expects an Authorization header in the form: "Bearer <jwt>".
// On success attaches minimal user identity (id, username) to req.user.
// On failure returns 401 with a code distinguishing expired vs invalid tokens.
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, username: payload.username };
    return next();
  } catch (e) {
    if (e?.name === 'TokenExpiredError') {
      console.warn('Expired token');
      return res.status(401).json({ error: 'token expired', code: 'TOKEN_EXPIRED' });
    }
    console.warn('Invalid token', e?.message);
    return res.status(401).json({ error: 'invalid token', code: 'TOKEN_INVALID' });
  }
}
