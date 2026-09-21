import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import config from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(config);
// Try explicitly passing databaseId
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  console.log("Setting doc with explicit DB ID:", config.firestoreDatabaseId);
  await setDoc(doc(db, 'test', 'test-doc'), { time: Date.now() });
  console.log("Success!");
  process.exit(0);
}
test().catch(e => {
  console.error("Failed:", e);
  process.exit(1);
});
