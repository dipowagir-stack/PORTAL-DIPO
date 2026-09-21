import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import config from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function seed() {
  const tenantsRef = collection(db, 'tenants');
  const q = query(tenantsRef, where('domainPrefix', '==', 'smas-diponegoro'));
  const snap = await getDocs(q);

  if (snap.empty) {
    const newTenantRef = doc(tenantsRef);
    await setDoc(newTenantRef, {
      name: 'SMAS Islam Diponegoro',
      domainPrefix: 'smas-diponegoro',
      email: 'admin@smas-diponegoro.sch.id',
      status: 'ACTIVE',
      currentVersion: '1.0.0',
      releaseChannel: 'STABLE',
      entitlements: ['academic', 'student', 'teacher', 'admin', 'finance', 'admission'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    await setDoc(doc(collection(db, 'tenant_subscriptions')), {
      tenantId: newTenantRef.id,
      planId: 'premium',
      status: 'ACTIVE',
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + 31536000000 // 1 year
    });

    console.log("Tenant SMAS Islam Diponegoro seeded with ID:", newTenantRef.id);
  } else {
    console.log("Tenant SMAS Islam Diponegoro already exists.");
  }

  process.exit(0);
}
seed().catch(console.error);
