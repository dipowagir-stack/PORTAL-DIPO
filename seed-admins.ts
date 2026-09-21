import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import config from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function seed() {
  await setDoc(doc(db, 'platform_invitations', 'romeoelins.2003@gmail.com'), {
    email: 'romeoelins.2003@gmail.com',
    role: 'platform_admin',
    createdAt: new Date().toISOString()
  });
  
  await setDoc(doc(db, 'platform_invitations', 'baiahmad200796@gmail.com'), {
    email: 'baiahmad200796@gmail.com',
    role: 'platform_engineer',
    createdAt: new Date().toISOString()
  });
  
  const { collection, getDocs, query, where, updateDoc } = await import('firebase/firestore');
  
  const q1 = query(collection(db, 'users'), where('email', '==', 'romeoelins.2003@gmail.com'));
  const snap1 = await getDocs(q1);
  snap1.forEach(async d => {
    await updateDoc(d.ref, { role: 'platform_admin' });
  });

  const q2 = query(collection(db, 'users'), where('email', '==', 'baiahmad200796@gmail.com'));
  const snap2 = await getDocs(q2);
  snap2.forEach(async d => {
    await updateDoc(d.ref, { role: 'platform_engineer' });
  });

  console.log("Seeding complete!");
  process.exit(0);
}
seed().catch(console.error);
