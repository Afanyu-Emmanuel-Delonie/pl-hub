"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredConfig = [config.apiKey, config.authDomain, config.projectId, config.appId];
if (requiredConfig.some((value) => !value)) {
  throw new Error("Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* values to .env.local.");
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(config);
export const auth = getAuth(firebaseApp);

// Persist reads to IndexedDB so a refreshed tab, a flaky connection, or a
// student reopening the same quiz/assignment link is served from the local
// cache instead of re-reading the document from Firestore every time. This
// is the single biggest lever against read volume when many students hit
// the same handful of documents.
//
// persistentSingleTabManager (rather than the multi-tab variant): each tab
// keeps its own isolated cache instead of several tabs electing one
// "primary" tab to coordinate cache writes/garbage collection. The typical
// user here (a student on one quiz link, a TA on one dashboard tab) never
// needed cross-tab sharing, and the multi-tab manager logs a harmless but
// alarming-looking "Failed to obtain primary lease for action 'Collect
// garbage'" console error from every non-primary tab — this avoids that
// class of noise entirely while keeping the actual caching benefit.
function initDb() {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
    });
  } catch {
    // Already initialized (e.g. re-executed by Fast Refresh in dev, or a
    // browser that can't do IndexedDB persistence) — fall back to the
    // in-memory default rather than crash the app.
    return getFirestore(firebaseApp);
  }
}

export const db = initDb();

let analyticsPromise: Promise<Analytics | null> | undefined;

/** Analytics is browser-only and must never run during server rendering. */
export function getFirebaseAnalytics() {
  if (typeof window === "undefined") return Promise.resolve(null);
  analyticsPromise ??= isSupported().then((supported) =>
    supported && config.measurementId ? getAnalytics(firebaseApp) : null
  );
  return analyticsPromise;
}
