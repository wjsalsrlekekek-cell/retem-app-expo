import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBOgeUYyl0-RSCz5IDFSky4RUWvgYMzOuM',
  authDomain: 'retem-v1.firebaseapp.com',
  projectId: 'retem-v1',
  storageBucket: 'retem-v1.firebasestorage.app',
  messagingSenderId: '224658302998',
  appId: '1:224658302998:web:e7ddbc5d3d6561dd026d37',
  measurementId: 'G-GKQCK8F2SR',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
