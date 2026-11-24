import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAT7gfzKrRgEAIdQdAqsRi0GFUVOClkv_E",
  authDomain: "ecommerce-demo-751f7.firebaseapp.com",
  projectId: "ecommerce-demo-751f7",
  storageBucket: "ecommerce-demo-751f7.firebasestorage.app",
  messagingSenderId: "673767938148",
  appId: "1:673767938148:web:f9088441755e7262196771",
  measurementId: "G-DCYCF8CXCL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
