import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import config from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const snap = await getDocs(collection(db, 'user_profiles'));
  console.log(`Found ${snap.size} profiles:`);
  snap.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id}, Email: ${data.email}, Role: ${data.role}, AdditionalRoles: ${JSON.stringify(data.additionalRoles)}, TenantId: ${data.tenantId}`);
  });
}

check().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
