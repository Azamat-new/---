// In-memory + JSON-file todo store. Deliberately small.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export function load(file) {
  if (!existsSync(file)) return { items: [] };
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function save(file, state) {
  writeFileSync(file, JSON.stringify(state, null, 2) + '\n');
}

export function add(state, title) {
  const t = String(title ?? '').trim();
  if (!t) throw new Error('title required');
  const id = state.items.length ? Math.max(...state.items.map(i => i.id)) + 1 : 1;
  state.items.push({ id, title: t, done: false });
  return id;
}

export function complete(state, id) {
  const item = state.items.find(i => i.id === Number(id));
  if (!item) throw new Error(`no item ${id}`);
  item.done = true;
  return item;
}

export function list(state, { onlyOpen = false } = {}) {
  return state.items.filter(i => !onlyOpen || !i.done);
}

export function format(items) {
  return items.map(i => `${i.done ? '[x]' : '[ ]'} ${i.id}. ${i.title}`).join('\n');
}
