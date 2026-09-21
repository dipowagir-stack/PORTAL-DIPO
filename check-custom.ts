import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import config from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const qCustom = query(
    collection(db, 'tenant_public_profiles'), 
    where('domainMappings.customDomain', '==', 'dipogodigital.ai.studio')
  );
  const snapCustom = await getDocs(qCustom);
  console.log("Custom domain matched:", snapCustom.size);
  process.exit(0);
}
check();
