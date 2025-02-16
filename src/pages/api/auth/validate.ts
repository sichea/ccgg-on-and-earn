import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

// Firebase Admin 초기화
const firebaseAdmin = initializeApp({
  credential: cert(serviceAccount as any)
}, 'admin');

const adminAuth = getAuth(firebaseAdmin);
const adminDb = getFirestore(firebaseAdmin);

export { adminAuth, adminDb };