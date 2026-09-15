import fs from 'node:fs';
const FILE = new URL('./.findme-local-store.json', import.meta.url);
export function memoryStore() {
  const collections = new Map(Object.entries(load()).map(([name, values]) => [name, new Map(Object.entries(values))]));
  const bucket = name => { if (!collections.has(name)) collections.set(name, new Map()); return collections.get(name); };
  const persist = () => { try { const output = {}; for (const [name, values] of collections) output[name] = Object.fromEntries(values); fs.writeFileSync(FILE, JSON.stringify(output), { mode: 0o600 }); } catch { /* ephemeral fallback when the host disallows local persistence */ } };
  return {
    async get(collection, id) { return bucket(collection).get(id) || null; },
    async set(collection, id, value) { bucket(collection).set(id, value); persist(); },
    async remove(collection, id) { bucket(collection).delete(id); persist(); },
    async list(collection, field, value) { return [...bucket(collection).values()].filter(row => row[field] === value); },
    async transaction(fn) { return fn({ get: (c, id) => this.get(c, id), set: (c, id, value) => this.set(c, id, value), remove: (c, id) => this.remove(c, id) }); },
  };
}
function load() { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; } }
