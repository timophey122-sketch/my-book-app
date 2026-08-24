import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDcEM_1pEdV2JwQu5doTMTfFdPi3zlw-Uo',
  authDomain: 'my-book-tracker-family.firebaseapp.com',
  projectId: 'my-book-tracker-family',
  storageBucket: 'my-book-tracker-family.firebasestorage.app',
  messagingSenderId: '1082409487344',
  appId: '1:1082409487344:android:240f7ed230376d38442b35',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  const authApi = FirebaseAuth as typeof FirebaseAuth & { getReactNativePersistence(storage: typeof AsyncStorage): FirebaseAuth.Persistence };
  auth = authApi.initializeAuth(firebaseApp, { persistence: authApi.getReactNativePersistence(AsyncStorage) });
} catch {
  auth = FirebaseAuth.getAuth(firebaseApp);
}

export const firebaseAuth = auth;
export const firebaseDb = getFirestore(firebaseApp);
export const isFirebaseConfigured = true;
