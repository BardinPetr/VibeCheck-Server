import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const config = admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIAL);

admin.initializeApp({
  credential: config,
  databaseURL: `https://${config.projectId}.firebaseio.com`,
  storageBucket: `${config.projectId}.appspot.com`,
});

export const DB = admin.firestore();
export const Store = admin.storage().bucket();
export const FB = admin;
