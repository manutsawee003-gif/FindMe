import http from 'node:http';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { firestoreStore } from './store.mjs';
import { memoryStore } from './memory-store.mjs';
import { domain, token, hash, fail, publicUser, text } from './domain.mjs';

function isAllowedOrigin(origin, config) {
  if (!origin) return true;
  const configured = (config.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (configured.includes('*') || configured.includes(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
    return true;
  }
  return true;
}

function isAllowedRedirect(uri, config) {
  if (!uri) return false;
  const configured = (config.APP_REDIRECT_URLS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (configured.includes(uri)) return true;
  if (uri.startsWith('findme://')) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?\/auth\/callback$/.test(uri)) {
    return true;
  }
  return false;
}

function firebaseAuth(config) {
  if (!getApps().length) {
    // Vercel has no Application Default Credentials. Store the Firebase
    // service-account JSON as the FIREBASE_SERVICE_ACCOUNT_JSON secret there;
    // local development can continue using GOOGLE_APPLICATION_CREDENTIALS.
    let credential = applicationDefault();
    if (config.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        credential = cert(JSON.parse(config.FIREBASE_SERVICE_ACCOUNT_JSON));
      } catch {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
      }
    }
    initializeApp({ credential, projectId: config.GOOGLE_CLOUD_PROJECT });
  }
  return getAuth();
}

export function createServer(db, config = process.env) {
  const app = domain(db);
  const limits = new Map();
  
  const json = (res, value, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
  };
  
  const redirect = (res, url) => {
    res.writeHead(302, { Location: url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
    res.end();
  };

  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const origin = req.headers.origin;
    
    if (origin && isAllowedOrigin(origin, config)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else if (origin) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    try {
      const url = new URL(req.url, 'http://localhost');
      
      // Health check
      if (url.pathname === '/health') {
        return json(res, {
          ok: true,
          service: 'FindMe API',
          version: '1.2.0',
          database: config.STORE || 'memory',
          timestamp: Date.now()
        });
      }

      if (url.pathname === '/public/emergencies' && req.method === 'GET') {
        return json(res, await app.publicEmergencies());
      }

      const now = Date.now();
      for (const [key, value] of limits) {
        if (value.until < now) limits.delete(key);
      }
      
      const ip = req.socket.remoteAddress;
      const entry = limits.get(ip) || { count: 0, until: now + 60000 };
      entry.count++;
      limits.set(ip, entry);
      
      if (entry.count > 300) {
        fail(429, 'Too many requests. Please wait a minute.');
      }

      let body = {};
      if (req.method === 'POST') {
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 32000) fail(413, 'Request is too large.');
        }
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          fail(400, 'Invalid JSON body.');
        }
      }

      // A FindMe account is intentionally lightweight: a display name creates
      // a device-held session. No LINE or third-party login is required.
      if (url.pathname === '/auth/guest' && req.method === 'POST') {
        const displayName = text(body.name, 60);
        const uid = token();
        const session = token();
        await db.transaction(async tx => {
          tx.set('users', uid, { id: uid, displayName, photoURL: '', createdAt: now, updatedAt: now });
          tx.set('sessions', hash(session), { uid, expiresAt: now + 30 * 86400000 });
        });
        return json(res, { token: session, user: publicUser(await db.get('users', uid)) });
      }

      if (url.pathname.startsWith('/auth/line') || url.pathname === '/auth/exchange') {
        fail(410, 'Third-party login has been removed. Enter your name to continue.');
      }

      // LINE OAuth Start
      if (url.pathname === '/auth/line/start' && req.method === 'POST') {
        if (!config.LINE_CHANNEL_SECRET || !config.LINE_REDIRECT_URI) {
          fail(503, 'LINE Login is not configured on the server yet.');
        }
        if (!isAllowedRedirect(body.redirectUri, config) || !/^[A-Za-z0-9_-]{43}$/.test(body.challenge || '')) {
          fail(400, 'Invalid login request or redirect URI.');
        }
        const state = token(), nonce = token(), verifier = token();
        await db.set('loginAttempts', hash(state), {
          nonce,
          verifier,
          redirectUri: body.redirectUri,
          challenge: body.challenge,
          expiresAt: now + 600000
        });
        const query = new URLSearchParams({
          response_type: 'code',
          client_id: config.LINE_CHANNEL_ID,
          redirect_uri: config.LINE_REDIRECT_URI,
          state,
          nonce,
          scope: 'openid profile',
          code_challenge: createHash('sha256').update(verifier).digest('base64url'),
          code_challenge_method: 'S256',
          ui_locales: 'th,en'
        });
        return json(res, { url: `https://access.line.me/oauth2/v2.1/authorize?${query}` });
      }

      // LINE OAuth Callback
      if (url.pathname === '/auth/line/callback' && req.method === 'GET') {
        const state = url.searchParams.get('state');
        if (!state) fail(400, 'Missing login state.');
        
        const attempt = await db.transaction(async tx => {
          const a = await tx.get('loginAttempts', hash(state));
          if (!a || a.expiresAt < now) fail(400, 'Login expired. Please try again.');
          tx.remove('loginAttempts', hash(state));
          return a;
        });

        const target = new URL(attempt.redirectUri);
        if (url.searchParams.has('error')) {
          target.searchParams.set('error', url.searchParams.get('error_description') || 'Login cancelled. Please try again.');
          return redirect(res, target.toString());
        }

        const lineTokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
          method: 'POST',
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: url.searchParams.get('code') || '',
            redirect_uri: config.LINE_REDIRECT_URI,
            client_id: config.LINE_CHANNEL_ID,
            client_secret: config.LINE_CHANNEL_SECRET,
            code_verifier: attempt.verifier
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (!lineTokenResponse.ok) {
          const errData = await lineTokenResponse.json().catch(() => ({}));
          console.error('LINE Token Error:', errData);
          fail(401, 'LINE could not complete login: ' + (errData.error_description || 'Invalid authorization code'));
        }

        const lineTokens = await lineTokenResponse.json();
        const verified = await fetch('https://api.line.me/oauth2/v2.1/verify', {
          method: 'POST',
          body: new URLSearchParams({
            id_token: lineTokens.id_token,
            client_id: config.LINE_CHANNEL_ID,
            nonce: attempt.nonce
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (!verified.ok) fail(401, 'LINE identity verification failed.');
        const identity = await verified.json();
        if (!identity.sub || identity.aud !== config.LINE_CHANNEL_ID || identity.nonce !== attempt.nonce || identity.exp * 1000 <= now) {
          fail(401, 'Invalid LINE identity.');
        }

        const uid = hash(`${config.LINE_CHANNEL_ID}:${identity.sub}`);
        await db.transaction(async tx => {
          const old = await tx.get('users', uid);
          tx.set('users', uid, {
            ...old,
            id: uid,
            displayName: identity.name || 'LINE Member',
            photoURL: identity.picture || '',
            updatedAt: now,
            createdAt: old?.createdAt || now
          });
        });

        const ticket = token();
        await db.set('loginTickets', hash(ticket), {
          uid,
          challenge: attempt.challenge,
          expiresAt: now + 60000
        });
        target.searchParams.set('ticket', ticket);
        return redirect(res, target.toString());
      }

      // PKCE Ticket Exchange
      if (url.pathname === '/auth/exchange' && req.method === 'POST') {
        if (typeof body.ticket !== 'string' || typeof body.verifier !== 'string') {
          fail(400, 'Invalid login response.');
        }
        const session = token();
        const uid = await db.transaction(async tx => {
          const ticket = await tx.get('loginTickets', hash(body.ticket));
          if (!ticket || ticket.expiresAt < now || ticket.challenge !== createHash('sha256').update(body.verifier).digest('base64url')) {
            fail(401, 'Login expired. Please try again.');
          }
          tx.remove('loginTickets', hash(body.ticket));
          tx.set('sessions', hash(session), { uid: ticket.uid, expiresAt: now + 30 * 86400000 });
          return ticket.uid;
        });
        return json(res, { token: session, user: publicUser(await db.get('users', uid)) });
      }

      // Authenticated endpoints use the opaque FindMe session issued above.
      const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
      if (!bearer) fail(401, 'Please sign in to continue.');
      const savedSession = await db.get('sessions', hash(bearer));
      if (!savedSession || savedSession.expiresAt < now) {
        if (savedSession) await db.remove('sessions', hash(bearer));
        fail(401, 'Your sign-in session has expired. Please sign in again.');
      }
      const uid = savedSession.uid;

      if (url.pathname === '/auth/logout' && req.method === 'POST') {
        await app.updateLocation(uid, { isSharing: false });
        await db.remove('sessions', hash(bearer));
        return json(res, { ok: true });
      }

      if (url.pathname === '/snapshot' && req.method === 'GET') {
        return json(res, await app.snapshot(uid));
      }
      if (url.pathname === '/family' && req.method === 'POST') {
        return json(res, await app.createFamily(uid, body.name));
      }
      if (url.pathname === '/family/invite' && req.method === 'POST') {
        return json(res, await app.invite(uid));
      }
      if (url.pathname === '/family/preview' && req.method === 'POST') {
        return json(res, await app.preview(body.code));
      }
      if (url.pathname === '/family/join' && req.method === 'POST') {
        return json(res, await app.join(uid, body.code));
      }
      if (url.pathname === '/family/leave' && req.method === 'POST') {
        return json(res, await app.leaveFamily(uid));
      }
      if (url.pathname === '/location' && req.method === 'POST') {
        return json(res, await app.updateLocation(uid, body));
      }
      if (url.pathname === '/sos' && req.method === 'POST') {
        return json(res, await app.sos(uid, body));
      }
      if (url.pathname === '/sos/close' && req.method === 'POST') {
        return json(res, await app.closeSos(uid, body.status));
      }

      fail(404, 'Not found.');
    } catch (error) {
      if (!error.status) console.error('Request failed:', error.message || error);
      json(res, { error: error.status ? error.message : 'The server could not complete the request. Please try again.' }, error.status || 500);
    }
  });
}

// Vercel discovers top-level .mjs files as serverless functions. Supplying a
// default handler also lets the same HTTP application run there directly.
let serverlessInstance;
export default function serverlessHandler(req, res) {
  if (req.url.startsWith('/api/')) req.url = req.url.slice(4);
  if (!serverlessInstance) {
    const isMemory = (process.env.STORE || 'memory') === 'memory';
    serverlessInstance = createServer(isMemory ? memoryStore() : firestoreStore());
  }
  serverlessInstance.emit('request', req, res);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const isMemory = (process.env.STORE || 'memory') === 'memory';
  const db = isMemory ? (await import('./memory-store.mjs')).memoryStore() : firestoreStore();
  const port = Number(process.env.PORT || 8787);
  createServer(db).listen(port, '0.0.0.0', () => {
    console.log(`🚀 FindMe API server running on http://localhost:${port} [STORE: ${isMemory ? 'memory' : 'firestore'}]`);
  });
}
