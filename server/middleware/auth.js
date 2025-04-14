// JWT auth middleware: expects Authorization: Bearer <token> header.
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
