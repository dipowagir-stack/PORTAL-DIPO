import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import config from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);
const profileCollection = 'tenant_public_profiles';

async function test(domain: string) {
  const subdomain = domain.split('.')[0];
  console.log("Testing subdomain:", subdomain);
  const qSub = query(
    collection(db, profileCollection),
    where('domainMappings.subdomain', '==', subdomain)
  );
  const snapSub = await getDocs(qSub);
  if (!snapSub.empty) {
    console.log("FOUND via subdomain:", snapSub.docs[0].id);
    return;
  }
  
  const qTenants = query(
    collection(db, 'tenants'),
    where('domainPrefix', '==', subdomain)
  );
  const snapTenants = await getDocs(qTenants);
  if (!snapTenants.empty) {
    console.log("FOUND via tenants collection fallback:", snapTenants.docs[0].id);
    return;
  }
  console.log("NOT FOUND");
}

test('smas-diponegoro').then(() => process.exit(0));
