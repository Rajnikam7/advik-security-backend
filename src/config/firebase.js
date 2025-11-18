import admin from "firebase-admin";

// Check if Firebase credentials are properly configured
const hasValidFirebaseConfig = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  return (
    projectId &&
    privateKey &&
    clientEmail &&
    projectId !== "your-firebase-project-id" &&
    !privateKey.includes("your-private-key-here") &&
    !clientEmail.includes("your-project")
  );
};

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    if (!hasValidFirebaseConfig()) {
      console.warn("⚠️  Firebase credentials not configured - running in DEV mode without Firebase");
      console.warn("⚠️  Firebase authentication endpoints will not work");
      return;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      console.log("✓ Firebase Admin initialized successfully");
    }
  } catch (err) {
    console.error("❌ Firebase initialization error:", err.message);
    console.warn("⚠️  Continuing without Firebase - only test endpoints will work");
  }
};

export { admin, initializeFirebase };
