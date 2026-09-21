import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import config from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const snap = await getDocs(collection(db, 'tenants'));
  console.log(`=== TENANTS (${snap.size}) ===`);
  snap.forEach(d => {
    console.log(JSON.stringify({ id: d.id, ...d.data() }, null, 2));
  });
  
  const snapProf = await getDocs(collection(db, 'tenant_public_profiles'));
  console.log(`=== TENANT PUBLIC PROFILES (${snapProf.size}) ===`);
  snapProf.forEach(d => {
    console.log(JSON.stringify({ id: d.id, ...d.data() }, null, 2));
  });
}

check().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
