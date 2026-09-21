import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import config from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  console.log("Checking tenants...");
  const tenantsSnap = await getDocs(collection(db, 'tenants'));
  let smasTenant: any = null;
  tenantsSnap.forEach(d => {
    console.log("Tenant:", d.id, d.data());
    if (d.data().domainPrefix === 'smas-diponegoro' || d.id === 'smas-diponegoro') {
      smasTenant = { id: d.id, ...d.data() };
    }
  });

  console.log("\nChecking tenant_public_profiles...");
  const profilesSnap = await getDocs(collection(db, 'tenant_public_profiles'));
  console.log("Found profiles count:", profilesSnap.size);
  profilesSnap.forEach(d => {
    console.log("Profile:", d.id, d.data().schoolName, d.data().domainMappings);
  });

  if (smasTenant) {
    console.log("\nFound smasTenant ID:", smasTenant.id);
    const profileDocRef = doc(db, 'tenant_public_profiles', smasTenant.id);
    const profileSnap = await getDoc(profileDocRef);
    if (!profileSnap.exists()) {
      console.log("tenant_public_profiles does NOT exist for smas-diponegoro! Creating it...");
      const newProfile = {
        id: smasTenant.id,
        tenantId: smasTenant.id,
        schoolName: smasTenant.name || 'SMAS Islam Diponegoro',
        officialName: smasTenant.name || 'SMAS Islam Diponegoro',
        shortName: 'SMAS Diponegoro',
        primaryColor: '#1e40af',
        secondaryColor: '#047857',
        accentColor: '#f59e0b',
        heroTitle: 'Selamat Datang di SMAS Islam Diponegoro',
        heroSubtitle: 'Mewujudkan Generasi Berakhlak Mulia, Unggul, dan Berprestasi.',
        address: 'Jl. Raya Diponegoro, Wagir, Malang, Jawa Timur',
        phone: '081234567890',
        email: smasTenant.email || 'admin@smas-diponegoro.sch.id',
        socialLinks: {},
        domainMappings: {
          subdomain: 'smas-diponegoro',
          status: 'ACTIVE'
        },
        seoConfig: {
          title: 'SMAS Islam Diponegoro - Portal Resmi',
          description: 'Website resmi SMAS Islam Diponegoro',
          keywords: 'smas islam diponegoro, sekolah malang, portal sekolah'
        },
        published: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(profileDocRef, newProfile);
      console.log("Created tenant_public_profiles successfully!");
    } else {
      console.log("Profile already exists. Updating domainMappings if needed...");
      await setDoc(profileDocRef, {
        domainMappings: {
          subdomain: 'smas-diponegoro',
          status: 'ACTIVE'
        },
        published: true,
        updatedAt: Date.now()
      }, { merge: true });
      console.log("Updated domainMappings successfully!");
    }
  }

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
