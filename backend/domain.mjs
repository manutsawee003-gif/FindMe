import { randomBytes, createHash } from 'node:crypto';
export const token = () => randomBytes(32).toString('base64url');
export const hash = value => createHash('sha256').update(value).digest('hex');
export function fail(status, message) { throw Object.assign(new Error(message), { status }); }
export function text(value, max = 500) { if (typeof value !== 'string' || !value.trim() || value.length > max) fail(400, 'Please enter a valid value.'); return value.trim(); }
export function location(value) {
  if (!value || !Number.isFinite(value.latitude) || Math.abs(value.latitude) > 90 || !Number.isFinite(value.longitude) || Math.abs(value.longitude) > 180 || (value.accuracy != null && (!Number.isFinite(value.accuracy) || value.accuracy < 0))) fail(400, 'A valid GPS location is required.');
  return { latitude: value.latitude, longitude: value.longitude, accuracy: value.accuracy ?? null, updatedAt: Date.now() };
}
export const publicUser = u => ({ id: u.id, displayName: u.displayName, photoURL: u.photoURL || '', familyId: u.familyId || '' });
export function domain(db) {
  return {
    async publicEmergencies() {
      const rows = await db.list('activeEmergencies', 'status', 'pending');
      return rows.map(e => ({ id: e.id, type: e.type, location: e.location, createdAt: e.createdAt, people: e.people }));
    },
    async snapshot(uid) {
      const user = await db.get('users', uid); if (!user) fail(401, 'Please sign in again.');
      const family = user.familyId ? await db.get('families', user.familyId) : null;
      const rows = family ? await db.list('users', 'familyId', family.id) : [];
      const members = await Promise.all(rows.map(async u => { const emergency = await db.get('activeEmergencies', u.id); return { ...publicUser(u), status: emergency ? 'emergency' : 'safe', isSharing: !!u.isSharing, location: emergency?.location || (u.isSharing ? u.location : null), emergency }; }));
      return { user: publicUser(user), family, members, emergency: await db.get('activeEmergencies', uid) };
    },
    async createFamily(uid, name) {
      name = text(name, 60); const id = token();
      return db.transaction(async tx => { const u = await tx.get('users', uid); if (u.familyId) fail(409, 'You already belong to a family.'); const family = { id, name, ownerId: uid, createdAt: Date.now() }; tx.set('families', id, family); tx.set('users', uid, { ...u, familyId: id }); return family; });
    },
    async invite(uid) {
      const u = await db.get('users', uid); if (!u.familyId) fail(400, 'Create or join a family first.');
      const code = randomBytes(12).toString('hex').toUpperCase();
      await db.set('invites', hash(code), { familyId: u.familyId, expiresAt: Date.now() + 86400000, remaining: 10 });
      return { code, expiresAt: Date.now() + 86400000 };
    },
    async preview(code) { const invite = await db.get('invites', hash(text(code, 64).toUpperCase())); if (!invite || invite.expiresAt < Date.now() || invite.remaining < 1) fail(404, 'This invitation is invalid or expired.'); const family = await db.get('families', invite.familyId); return { name: family.name }; },
    async join(uid, code) {
      const key = hash(text(code, 64).toUpperCase());
      return db.transaction(async tx => { const invite = await tx.get('invites', key); const user = await tx.get('users', uid); if (!invite || invite.expiresAt < Date.now() || invite.remaining < 1) fail(404, 'This invitation is invalid or expired.'); if (user.familyId === invite.familyId) return {}; if (user.familyId) fail(409, 'You already belong to another family.'); tx.set('users', uid, { ...user, familyId: invite.familyId }); tx.set('invites', key, { ...invite, remaining: invite.remaining - 1 }); return {}; });
    },
    async leaveFamily(uid) {
      return db.transaction(async tx => {
        const user = await tx.get('users', uid);
        if (!user?.familyId) fail(400, 'You are not currently in a family.');
        const family = await tx.get('families', user.familyId);
        if (family?.ownerId === uid) fail(409, 'The family owner cannot leave the family yet.');
        tx.set('users', uid, { ...user, familyId: '' });
        return {};
      });
    },
    async updateLocation(uid, body) {
      const position = body.isSharing ? location(body.location) : null;
      if (typeof body.isSharing !== 'boolean') fail(400, 'Invalid sharing state.');
      await db.transaction(async tx => { const user = await tx.get('users', uid); tx.set('users', uid, { ...user, isSharing: body.isSharing, location: position }); }); return {};
    },
    async sos(uid, body) {
      if (!['Flood', 'Accident', 'Trapped', 'Medical', 'Fire', 'Other'].includes(body.type)) fail(400, 'Choose an emergency type.');
      if (!Number.isInteger(body.people) || body.people < 1 || body.people > 1000) fail(400, 'Number of people must be between 1 and 1000.');
      const position = location(body.location); const message = body.message ? text(body.message, 1000) : '';
      return db.transaction(async tx => { const existing = await tx.get('activeEmergencies', uid); if (existing) return existing; const emergency = { id: token(), userId: uid, type: body.type, people: body.people, message, location: position, status: 'pending', createdAt: Date.now() }; tx.set('activeEmergencies', uid, emergency); tx.set('emergencyRequests', emergency.id, emergency); return emergency; });
    },
    async closeSos(uid, status) {
      if (!['cancelled', 'resolved'].includes(status)) fail(400, 'Invalid status.');
      await db.transaction(async tx => { const e = await tx.get('activeEmergencies', uid); if (!e) return; tx.set('emergencyRequests', e.id, { ...e, status, updatedAt: Date.now() }); tx.remove('activeEmergencies', uid); }); return {};
    },
  };
}
