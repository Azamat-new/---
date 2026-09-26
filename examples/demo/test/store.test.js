import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add, complete, list, format } from '../src/store.js';

test('add assigns incrementing ids', () => {
  const s = { items: [] };
  assert.equal(add(s, 'a'), 1);
  assert.equal(add(s, 'b'), 2);
});

test('add rejects empty title', () => {
  assert.throws(() => add({ items: [] }, '   '), /title required/);
});

test('complete marks done and list --open hides it', () => {
  const s = { items: [] };
  add(s, 'a'); add(s, 'b');
  complete(s, 1);
  assert.deepEqual(list(s, { onlyOpen: true }).map(i => i.id), [2]);
});

test('format renders checkboxes', () => {
  assert.equal(format([{ id: 1, title: 'x', done: true }]), '[x] 1. x');
});
