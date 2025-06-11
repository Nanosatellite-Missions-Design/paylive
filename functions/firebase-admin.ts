import admin from "firebase-admin";

if (!admin.apps.length) {
  let serviceAccount;
  try {
    serviceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    };
  } catch (error) {
    throw new Error("Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminAuth = admin.auth();
