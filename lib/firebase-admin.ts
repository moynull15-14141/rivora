import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

function getAdminApp(): App | null {
  if (!process.env.FIREBASE_ADMIN_SDK_JSON) return null;
  if (getApps().length > 0) return getApps()[0];
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON);
    return initializeApp({ credential: cert(serviceAccount) });
  } catch {
    return null;
  }
}

export function getAdminMessaging(): Messaging | null {
  const app = getAdminApp();
  if (!app) return null;
  try {
    return getMessaging(app);
  } catch {
    return null;
  }
}
