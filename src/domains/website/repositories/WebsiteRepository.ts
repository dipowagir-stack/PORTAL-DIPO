import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Result, ok, fail } from '../../../foundation/core/Result';
import { TenantPublicProfile, CmsContent, ContentStatus } from '../types';

export class WebsiteRepository {
  private profileCollection = 'tenant_public_profiles';
  private contentCollection = 'tenant_cms_contents';

  async getTenantProfileByTenantId(tenantId: string): Promise<Result<TenantPublicProfile>> {
    try {
      const docRef = doc(db, this.profileCollection, tenantId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return ok(docSnap.data() as TenantPublicProfile);
      }
      return fail('Profile not found');
    } catch (error: any) {
      return fail(error.message);
    }
  }

  async getTenantProfileByDomain(domain: string): Promise<Result<TenantPublicProfile>> {
    try {
      // First try custom domain
      const qCustom = query(
        collection(db, this.profileCollection), 
        where('domainMappings.customDomain', '==', domain),
        where('domainMappings.status', '==', 'ACTIVE')
      );
      const snapCustom = await getDocs(qCustom);
      if (!snapCustom.empty) {
        return ok(snapCustom.docs[0].data() as TenantPublicProfile);
      }

      // Then try subdomain (assuming domain is something like 'tenant.eduos.com')
      // To simplify, we check the subdomain field
      const subdomain = domain.split('.')[0];
      const qSub = query(
        collection(db, this.profileCollection),
        where('domainMappings.subdomain', '==', subdomain)
      );
      const snapSub = await getDocs(qSub);
      if (!snapSub.empty) {
        return ok(snapSub.docs[0].data() as TenantPublicProfile);
      }
      
      // Fallback: try direct tenantId lookup if no domain mapping matched
      const docRef = doc(db, this.profileCollection, domain);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return ok(docSnap.data() as TenantPublicProfile);
      }

      // Secondary Fallback: look up in 'tenants' collection directly
      const qTenants = query(
        collection(db, 'tenants'),
        where('domainPrefix', '==', subdomain)
      );
      const snapTenants = await getDocs(qTenants);
      let tenantDoc = snapTenants.empty ? null : snapTenants.docs[0];
      
      if (!tenantDoc) {
        const directTenantSnap = await getDoc(doc(db, 'tenants', domain));
        if (directTenantSnap.exists()) {
          tenantDoc = directTenantSnap;
        }
      }

      if (tenantDoc) {
        const tData = tenantDoc.data();
        const fallbackProfile: TenantPublicProfile = {
          id: tenantDoc.id,
          tenantId: tenantDoc.id,
          schoolName: tData.name || 'Portal Sekolah',
          officialName: tData.name || 'Portal Sekolah',
          shortName: tData.name || subdomain,
          primaryColor: '#1e40af',
          secondaryColor: '#047857',
          accentColor: '#f59e0b',
          heroTitle: `Selamat Datang di ${tData.name || 'Portal Sekolah'}`,
          heroSubtitle: 'Mewujudkan Generasi Berakhlak Mulia, Unggul, dan Berprestasi.',
          principalWelcome: 'Assalamu\'alaikum Warahmatullahi Wabarakatuh. Selamat datang di portal resmi sekolah kami. Kami berkomitmen untuk terus berinovasi dalam memberikan layanan pendidikan terbaik yang berkarakter, berakhlak mulia, dan berdaya saing global.',
          principalName: 'Kepala Sekolah',
          address: tData.address || 'Alamat sekolah',
          phone: tData.phone || '-',
          email: tData.email || 'admin@sekolah.sch.id',
          socialLinks: {},
          domainMappings: {
            subdomain: tData.domainPrefix || subdomain,
            status: 'ACTIVE'
          },
          seoConfig: {
            title: `${tData.name || 'Portal Sekolah'} - Website Resmi`,
            description: `Portal informasi resmi ${tData.name || 'sekolah'}`,
            keywords: 'sekolah, portal siswa, pendaftaran'
          },
          published: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        // Cache/persist profile asynchronously so subsequent calls find it directly
        setDoc(doc(db, this.profileCollection, tenantDoc.id), fallbackProfile).catch(console.error);

        return ok(fallbackProfile);
      }

      return fail('Domain not mapped to any active tenant');
    } catch (error: any) {
      return fail(error.message);
    }
  }

  async saveTenantProfile(profile: TenantPublicProfile): Promise<Result<void>> {
    try {
      const docRef = doc(db, this.profileCollection, profile.tenantId);
      await setDoc(docRef, profile, { merge: true });
      return ok(undefined);
    } catch (error: any) {
      return fail(error.message);
    }
  }

  async getContents(tenantId: string, options?: { type?: string, status?: ContentStatus, publicOnly?: boolean }): Promise<Result<CmsContent[]>> {
    try {
      let conditions = [where('tenantId', '==', tenantId)];
      if (options?.type) {
        conditions.push(where('type', '==', options.type));
      }
      if (options?.publicOnly) {
        conditions.push(where('status', '==', 'PUBLISHED'));
      } else if (options?.status) {
        conditions.push(where('status', '==', options.status));
      }

      const q = query(collection(db, this.contentCollection), ...conditions);
      const snap = await getDocs(q);
      const contents = snap.docs.map(d => ({ id: d.id, ...d.data() } as CmsContent));
      return ok(contents);
    } catch (error: any) {
      return fail(error.message);
    }
  }

  async getContentBySlug(tenantId: string, slug: string, publicOnly: boolean = false): Promise<Result<CmsContent>> {
    try {
      const conditions = [
        where('tenantId', '==', tenantId),
        where('slug', '==', slug)
      ];
      if (publicOnly) {
        conditions.push(where('status', '==', 'PUBLISHED'));
      }
      const q = query(collection(db, this.contentCollection), ...conditions);
      const snap = await getDocs(q);
      if (snap.empty) return fail('Content not found');
      return ok({ id: snap.docs[0].id, ...snap.docs[0].data() } as CmsContent);
    } catch (error: any) {
      return fail(error.message);
    }
  }

  async saveContent(content: CmsContent): Promise<Result<void>> {
    try {
      const docRef = doc(db, this.contentCollection, content.id);
      await setDoc(docRef, content, { merge: true });
      return ok(undefined);
    } catch (error: any) {
      return fail(error.message);
    }
  }

  async deleteContent(id: string): Promise<Result<void>> {
    try {
      await deleteDoc(doc(db, this.contentCollection, id));
      return ok(undefined);
    } catch (error: any) {
      return fail(error.message);
    }
  }
}
