import admin from 'firebase-admin';

const config = admin.credential.applicationDefault();
admin.initializeApp({
  credential: config,
  databaseURL: `https://${config.projectId}.firebaseio.com`,
});

export const DB = admin.firestore();
export const FB = admin;
