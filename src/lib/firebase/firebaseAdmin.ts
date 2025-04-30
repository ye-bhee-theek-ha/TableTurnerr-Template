import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';


const serviceAccount = process.env.FIREBASE_ADMIN_SDK_JSON
  ? JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON)
  : null;

if (!getApps().length) {
  if (!serviceAccount) {
    console.error(
      'Firebase Admin SDK JSON key not found in environment variable FIREBASE_ADMIN_SDK_JSON. Backend features requiring admin privileges will not work.'
    );
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK Initialized.');
    } catch (error) {
      console.error('Firebase Admin SDK Initialization Error:', error);
    }
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;

