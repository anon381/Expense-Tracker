import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = join(__dirname, '..', 'data', 'users.json');

let users = [];
let initialized = false;
let writePending = false;

function loadFromDisk() {
  if (!existsSync(DATA_FILE)) {
    users = [];
    persist();
    return;
  }
  try {
    const raw = readFileSync(DATA_FILE, 'utf8');
  users = JSON.parse(raw);
  if (!Array.isArray(users)) users = [];
  users = users.filter(u => !u?._comment);
  } catch (e) {
    console.error('Failed to read users.json, starting empty', e);
    users = [];
  }
}

function persist() {
  if (writePending) return;
  writePending = true;
  setTimeout(() => {
    try {
      writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write users.json', e);
    } finally {
      writePending = false;
    }
  }, 20);
}

export function initStore() {
  if (initialized) return;
  loadFromDisk();
  initialized = true;
}

export function createUser({ username, passwordHash }) {
  const user = { id: randomUUID(), username, passwordHash, createdAt: new Date().toISOString() };
  users.push(user);
  persist();
  return user;
}

export function findUserByUsername(username) {
  return users.find(u => u.username === username);
}

export function resetAll() { users = []; persist(); }

export function findUserById(id) {
  return users.find(u => u.id === id) || null;
}
