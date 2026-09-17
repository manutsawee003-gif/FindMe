import { createServer } from '../server.mjs';
import { memoryStore } from '../memory-store.mjs';

const server = createServer(memoryStore());

export default function handler(req, res) {
  // The public API is rewritten through /api; preserve the original route for
  // the framework-agnostic HTTP server.
  if (req.url.startsWith('/api/')) req.url = req.url.slice(4);
  server.emit('request', req, res);
}
