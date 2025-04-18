import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername, findUserById, initStore } from '../store/userStore.js';
import { initRefreshStore, createRefreshToken, findValidRefreshToken, rotateRefreshToken, revokeRefreshToken } from '../store/refreshTokenStore.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
initStore();
initRefreshStore();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change';
// Allow overriding token lifetime via env JWT_EXPIRY (e.g. '12h', '7d').
const TOKEN_EXPIRY = process.env.JWT_EXPIRY || '2h';

router.post('/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (password.length < 4) return res.status(400).json({ error: 'password too short' });
  const existing = findUserByUsername(username);
  if (existing) return res.status(409).json({ error: 'username taken' });
  const hash = await bcrypt.hash(password, 10);
  const user = createUser({ username, passwordHash: hash });
  console.log('[AUTH] registered', username, user.id);
  const token = jwt.sign({ sub: user.id, username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  const refresh = createRefreshToken(user.id);
  res.status(201).json({ token, refreshToken: refresh.token, refreshExpires: refresh.exp, user: { id: user.id, username } });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const user = findUserByUsername(username);
  if (!user) { console.log('[AUTH] login fail no user', username); return res.status(401).json({ error: 'invalid credentials' }); }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) { console.log('[AUTH] login fail bad password', username); return res.status(401).json({ error: 'invalid credentials' }); }
  console.log('[AUTH] login success', username, user.id);
  const token = jwt.sign({ sub: user.id, username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  const refresh = createRefreshToken(user.id);
  res.json({ token, refreshToken: refresh.token, refreshExpires: refresh.exp, user: { id: user.id, username } });
});

// Validate current token & return user identity
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username } });
});

// Exchange refresh token for new access token (and rotated refresh token)
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
  const rec = findValidRefreshToken(refreshToken);
  if (!rec) return res.status(401).json({ error: 'invalid refresh token' });
  // rotate
  const rotated = rotateRefreshToken(refreshToken);
  const user = findUserById(rec.userId);
  const token = jwt.sign({ sub: rec.userId, username: user?.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ token, refreshToken: rotated.token, refreshExpires: rotated.exp, user: user ? { id: user.id, username: user.username } : undefined });
});

router.post('/logout', (req, res) => {
  const { refreshToken } = req.body || {};
  if (refreshToken) revokeRefreshToken(refreshToken);
  res.json({ ok: true });
});

export default router;
