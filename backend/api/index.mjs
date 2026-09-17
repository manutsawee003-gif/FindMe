import { createServer } from '../server.mjs';
import { memoryStore } from '../memory-store.mjs';

// Reuse the HTTP application's request handler in Vercel's Node.js runtime.
// The module-level store is kept warm by a serverless instance; production
// deployments should set STORE=firestore for durable, multi-instance data.
const server = createServer(memoryStore());

export default function handler(req, res) {
  server.emit('request', req, res);
}
