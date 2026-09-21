import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import config from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const profileDocRef = doc(db, 'tenant_public_profiles', 'LcK9krK4cAN6A21OdUod');
  const profileSnap = await getDoc(profileDocRef);
  console.log(JSON.stringify(profileSnap.data(), null, 2));
  process.exit(0);
}
check();
