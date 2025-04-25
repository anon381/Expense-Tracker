// Auth routes: register & login issuing JWT tokens (demo-grade only).
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername, initStore } from '../store/userStore.js';

const router = Router();
initStore();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change';
const TOKEN_EXPIRY = '2h';

router.post('/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (password.length < 4) return res.status(400).json({ error: 'password too short' });
  const existing = findUserByUsername(username);
  if (existing) return res.status(409).json({ error: 'username taken' });
  const hash = await bcrypt.hash(password, 10);
  const user = createUser({ username, passwordHash: hash });
  const token = jwt.sign({ sub: user.id, username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.status(201).json({ token, user: { id: user.id, username } });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const user = findUserByUsername(username);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ sub: user.id, username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ token, user: { id: user.id, username } });
});

export default router;
