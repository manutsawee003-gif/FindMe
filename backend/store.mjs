// Firestore stays behind the server. Clients never receive service credentials.
import { cert, initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
export function firestoreStore() {
  if (!getApps().length) {
    let credential = applicationDefault();
    let projectId = process.env.GOOGLE_CLOUD_PROJECT;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        credential = cert(serviceAccount);
        projectId ||= serviceAccount.project_id;
      } catch {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
      }
    }
    initializeApp({ credential, projectId });
  }
  const db = getFirestore();
  return {
    async get(collection, id) { const doc = await db.collection(collection).doc(id).get(); return doc.exists ? doc.data() : null; },
    async set(collection, id, value) { await db.collection(collection).doc(id).set(value); },
    async remove(collection, id) { await db.collection(collection).doc(id).delete(); },
    async list(collection, field, value) { return (await db.collection(collection).where(field, '==', value).get()).docs.map(d => d.data()); },
    async transaction(fn) { return db.runTransaction(async tx => fn({
      get: async (collection, id) => { const doc = await tx.get(db.collection(collection).doc(id)); return doc.exists ? doc.data() : null; },
      set: (collection, id, value) => tx.set(db.collection(collection).doc(id), value),
      remove: (collection, id) => tx.delete(db.collection(collection).doc(id)),
    })); },
  };
}
