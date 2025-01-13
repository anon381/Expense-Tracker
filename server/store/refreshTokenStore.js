import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const dataDir = path.join(process.cwd(), 'server', 'data');
const filePath = path.join(dataDir, 'refreshTokens.json');

function ensureDir() { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); }

export function initRefreshStore(){
  ensureDir();
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({ tokens: [] }, null, 2));
}

function read(){
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch { return { tokens: [] }; }
}
function write(db){ fs.writeFileSync(filePath, JSON.stringify(db, null, 2)); }

const days = parseInt(process.env.REFRESH_TOKEN_DAYS || '7', 10);
const REFRESH_TTL_MS = days * 24 * 60 * 60 * 1000;

export function createRefreshToken(userId){
  const db = read();
  const token = crypto.randomUUID();
  const exp = Date.now() + REFRESH_TTL_MS;
  db.tokens.push({ token, userId, exp });
  write(db);
  return { token, exp };
}

export function rotateRefreshToken(oldToken){
  const db = read();
  const rec = db.tokens.find(t => t.token === oldToken);
  if (!rec) return null;
  // remove old
  db.tokens = db.tokens.filter(t => t.token !== oldToken);
  // create new
  const token = crypto.randomUUID();
  const exp = Date.now() + REFRESH_TTL_MS;
  db.tokens.push({ token, userId: rec.userId, exp });
  write(db);
  return { token, userId: rec.userId, exp };
}

export function findValidRefreshToken(token){
  const db = read();
  const rec = db.tokens.find(t => t.token === token);
  if (!rec) return null;
  if (rec.exp < Date.now()) {
    // expire cleanup
    db.tokens = db.tokens.filter(t => t.token !== token);
    write(db);
    return null;
  }
  return rec;
}

export function revokeRefreshToken(token){
  const db = read();
  const before = db.tokens.length;
  db.tokens = db.tokens.filter(t => t.token !== token);
  if (db.tokens.length !== before) write(db);
}

export function cleanupExpired(){
  const db = read();
  const now = Date.now();
  const before = db.tokens.length;
  db.tokens = db.tokens.filter(t => t.exp > now);
  if (db.tokens.length !== before) write(db);
}
