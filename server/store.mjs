import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
export const storage = resolve(process.env.EDUCATION_STORAGE || '.education-storage');
export function openStore(path = resolve(storage, 'education.sqlite')) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path); db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  db.exec(readFileSync(new URL('./migrations/001-education.sql', import.meta.url), 'utf8'));
  return db;
}
export function asset(db,id) { const r=db.prepare('SELECT data FROM assets WHERE id=?').get(id); return r && JSON.parse(r.data); }
export function content(db,id,version) { const r=db.prepare('SELECT * FROM content WHERE id=? AND version=?').get(id,version); return r && {...JSON.parse(r.data),status:r.status}; }
export function listContent(db) { return db.prepare('SELECT * FROM content ORDER BY id,version DESC').all().map(r=>({...JSON.parse(r.data),status:r.status})); }
export function saveContent(db,c) { db.prepare('INSERT INTO content VALUES(?,?,?,?,?) ON CONFLICT(id,version) DO UPDATE SET status=excluded.status,data=excluded.data').run(c.id,c.version,c.kind,c.status,JSON.stringify(c)); }
export function audit(db,actor,action,target) { db.prepare('INSERT INTO audit_log VALUES(?,?,?,?,?)').run(crypto.randomUUID(),actor,action,target,new Date().toISOString()); }
