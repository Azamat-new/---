#!/usr/bin/env node
// Usage: todo add "text" | todo list [--open] | todo done <id>
import { load, save, add, complete, list, format } from './store.js';

const FILE = process.env.TODO_FILE || 'todo.json';

export function run(argv) {
  const [cmd, ...rest] = argv;
  const state = load(FILE);
  switch (cmd) {
    case 'add': {
      const id = add(state, rest.join(' '));
      save(FILE, state);
      return `added ${id}`;
    }
    case 'done': {
      const item = complete(state, rest[0]);
      save(FILE, state);
      return `done ${item.id}`;
    }
    case 'list': {
      const onlyOpen = rest.includes('--open');
      return format(list(state, { onlyOpen }));
    }
    default:
      throw new Error('usage: todo add <text> | todo list [--open] | todo done <id>');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const out = run(process.argv.slice(2));
    if (out) process.stdout.write(out + '\n');
  } catch (e) {
    process.stderr.write(e.message + '\n');
    process.exit(1);
  }
}
