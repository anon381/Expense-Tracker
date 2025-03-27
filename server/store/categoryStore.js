// Category store: seeds default categories and persists to JSON.
// Behavior summary:
//  * Seeds defaults when file absent or empty.
//  * Filters out any objects containing _comment to allow inline docs.
//  * Exposes basic CRUD-style helpers (list/add/delete/get) used by transactions.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = join(__dirname, '..', 'data', 'categories.json');

let categories = [];
let initialized = false;
let writePending = false;

const DEFAULTS = [
  { name: 'Food', type: 'expense', color: '#ff7f50' },
  { name: 'Rent', type: 'expense', color: '#ffa500' },
  { name: 'Transport', type: 'expense', color: '#1e90ff' },
  { name: 'Entertainment', type: 'expense', color: '#8a2be2' },
  { name: 'Salary', type: 'income', color: '#2e8b57' }
];

function load() {
  if (!existsSync(DATA_FILE)) { categories = DEFAULTS.map(c => ({ id: randomUUID(), ...c })); persist(); return; }
  try {
  categories = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
    if (!Array.isArray(categories)) throw new Error('bad');
  categories = categories.filter(c => !c?._comment);
    if (categories.length === 0) { // seed if empty
      categories = DEFAULTS.map(c => ({ id: randomUUID(), ...c }));
      persist();
    }
  } catch {
    categories = DEFAULTS.map(c => ({ id: randomUUID(), ...c }));
    persist();
  }
}

function persist() {
  if (writePending) return;
  writePending = true;
  setTimeout(()=>{ try { writeFileSync(DATA_FILE, JSON.stringify(categories, null, 2),'utf8'); } catch(e){ console.error('cat write fail', e);} finally { writePending=false;} }, 25);
}

export function initCategoryStore(){ if(!initialized){ load(); initialized=true; } }
export function listCategories(){ return categories.slice(); }
export function addCategory(data){ const cat = { id: randomUUID(), ...data }; categories.push(cat); persist(); return cat; }
export function deleteCategory(id){ const before=categories.length; categories=categories.filter(c=>c.id!==id); if(before!==categories.length) persist(); return before!==categories.length; }
export function getCategoryById(id){ return categories.find(c=>c.id===id) || null; }
