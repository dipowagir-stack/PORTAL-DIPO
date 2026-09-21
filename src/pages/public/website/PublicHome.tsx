import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { TenantPublicProfile, CmsContent } from '../../../domains/website/types';
import { websiteService } from '../../../domains/website/services/WebsiteService';
import { ArrowRight, BookOpen, Calendar, Info, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function PublicHome() {
  const { profile, basePath, isPpdbActive } = useOutletContext<{ profile: TenantPublicProfile, basePath: string, isPpdbActive: boolean }>();
  const [news, setNews] = useState<CmsContent[]>([]);
  const [programs, setPrograms] = useState<CmsContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [newsRes, progRes] = await Promise.all([
        websiteService.getPublicContents(profile.tenantId, 'ARTICLE'),
        websiteService.getPublicContents(profile.tenantId, 'PROGRAM')
      ]);

      if (newsRes.isSuccess) setNews(newsRes.getValue().slice(0, 3));
      if (progRes.isSuccess) setPrograms(progRes.getValue().slice(0, 4));

      setLoading(false);
    };
    fetchData();
  }, [profile.tenantId]);

  return (
    <div className="bg-white selection:bg-gray-200">
      {/* HERO SECTION */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden flex items-center min-h-[75vh] md:min-h-[700px] border-b border-gray-100">
        {/* Subtle Architectural Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] z-0"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full opacity-20 blur-[100px]" style={{ backgroundColor: profile.primaryColor }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {profile.heroImage ? (
            // SPLIT LAYOUT (If image exists)
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl bg-white/50 backdrop-blur-sm p-6 -ml-6 rounded-2xl"
              >
                <div className="inline-flex items-center space-x-3 mb-8">
                  <span className="w-10 h-[2px]" style={{ backgroundColor: profile.primaryColor }}></span>
                  <span className="text-sm font-bold tracking-widest uppercase text-gray-500">
                    {profile.schoolName}
                  </span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] font-extrabold text-gray-900 mb-6 leading-[1.05] tracking-tight">
                  {profile.heroTitle}
                </h1>
                
                <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-xl">
                  {profile.heroSubtitle}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {isPpdbActive && (
                    <Link 
                      to={`${basePath}/ppdb`} 
                      className="inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all hover:opacity-90 shadow-lg"
                      style={{ backgroundColor: profile.primaryColor, shadowColor: profile.primaryColor }}
                    >
                      Informasi Pendaftaran
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  )}
                  <Link 
                    to={`${basePath}/halaman/profil`} 
                    className="inline-flex items-center justify-center px-8 py-4 font-semibold text-gray-900 border-2 border-gray-200 hover:border-gray-900 transition-colors bg-white"
                  >
                    Profil Sekolah
                  </Link>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative lg:ml-auto w-full max-w-lg lg:max-w-none mx-auto"
              >
                <div className="aspect-[4/5] w-full relative overflow-hidden bg-gray-100 shadow-2xl rounded-sm">
                  <img 
                    src={profile.heroImage} 
                    alt={profile.schoolName} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div 
                  className="absolute -bottom-6 -left-6 w-32 h-32 hidden md:block -z-10" 
                  style={{ backgroundColor: profile.primaryColor, opacity: 0.1 }}
                />
              </motion.div>
            </div>
          ) : (
            // CENTERED LAYOUT (If NO image exists)
            <div className="max-w-4xl mx-auto text-center flex flex-col items-center py-10">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white border border-gray-200 mb-8 shadow-sm">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: profile.primaryColor }}></span>
                  <span className="text-xs font-bold tracking-widest uppercase text-gray-600">
                    {profile.schoolName}
                  </span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold text-gray-900 mb-8 leading-[1.05] tracking-tight text-balance">
                  {profile.heroTitle}
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl text-balance">
                  {profile.heroSubtitle}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
                  {isPpdbActive && (
                    <Link 
                      to={`${basePath}/ppdb`} 
                      className="inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all hover:opacity-90 shadow-xl"
                      style={{ backgroundColor: profile.primaryColor }}
                    >
                      Informasi Pendaftaran
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  )}
                  <Link 
                    to={`${basePath}/halaman/profil`} 
                    className="inline-flex items-center justify-center px-8 py-4 font-semibold text-gray-900 border-2 border-gray-200 bg-white hover:border-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Profil Sekolah
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* PRINCIPAL WELCOME - Institutional Statement */}
      <section className="py-20 md:py-28 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 shadow-sm"
              style={{ backgroundColor: `${profile.primaryColor}15`, color: profile.primaryColor }}>
              Sambutan Kepala Sekolah
            </div>
            <span 
              className="block text-6xl md:text-8xl font-serif leading-none opacity-20 mb-2 select-none"
              style={{ color: profile.primaryColor }}
            >
              “
            </span>
            <blockquote className="text-xl md:text-3xl font-medium text-gray-900 leading-relaxed md:leading-relaxed mb-8 max-w-3xl mx-auto">
              {profile.principalWelcome || "Assalamu'alaikum Warahmatullahi Wabarakatuh. Selamat datang di portal resmi SMAS Islam Diponegoro. Kami senantiasa berkomitmen mendampingi peserta didik menjadi pribadi yang berakhlak mulia, unggul dalam prestasi akademik maupun non-akademik, serta berwawasan global yang berakar pada nilai-nilai keislaman."}
            </blockquote>
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="w-16 h-1 rounded-full mb-3" style={{ backgroundColor: profile.primaryColor }}></div>
              <h4 className="text-base md:text-lg font-bold text-gray-900">
                {profile.principalName || "Drs. H. M. Wahid, M.Pd."}
              </h4>
              <span className="text-xs md:text-sm font-semibold tracking-wider uppercase text-gray-500">
                Kepala Sekolah {profile.schoolName || "SMAS Islam Diponegoro"}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROGRAMS SECTION - Clean Grid */}
      {!loading && programs.length > 0 && (
        <section className="py-24 md:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="max-w-2xl mb-16 md:mb-24"
            >
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Program Unggulan</h2>
              <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
                Membangun fondasi masa depan melalui pendekatan pendidikan yang komprehensif dan berkarakter.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {programs.map((prog, idx) => (
                <motion.div 
                  key={prog.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Link 
                    to={`${basePath}/halaman/${prog.slug}`} 
                    className="group block h-full border border-gray-200 p-8 md:p-10 hover:border-gray-900 transition-colors duration-300 bg-white"
                  >
                    <div className="mb-8">
                      <BookOpen className="w-8 h-8 text-gray-400 group-hover:text-gray-900 transition-colors" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">{prog.title}</h3>
                    <p className="text-gray-600 text-base leading-relaxed mb-10">
                      {prog.summary || prog.content.substring(0, 120)}...
                    </p>
                    <div className="flex items-center text-sm font-bold uppercase tracking-wider text-gray-900">
                      <span>Pelajari</span>
                      <ArrowUpRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LATEST NEWS - Editorial Cards */}
      <section className="py-24 md:py-32 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="max-w-2xl"
            >
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Kabar Terbaru</h2>
              <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
                Berita terkini, liputan kegiatan, dan pengumuman resmi.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Link 
                to={`${basePath}/berita/index`}
                className="inline-flex items-center font-bold text-gray-900 hover:opacity-70 transition-opacity border-b-2 border-gray-900 pb-1"
              >
                Lihat Semua Berita <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </motion.div>
          </div>
          
          {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-gray-300 rounded-full border-t-gray-900"></div></div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {news.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Link 
                    to={`${basePath}/berita/${item.slug}`} 
                    className="group block"
                  >
                    <div className="aspect-[4/3] bg-gray-200 overflow-hidden mb-6 relative">
                      {item.featuredImage ? (
                        <img 
                          src={item.featuredImage} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Info className="w-8 h-8 text-gray-400 opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                      <Calendar className="w-3.5 h-3.5 mr-2" /> 
                      {new Date(item.publishedAt || item.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 leading-snug group-hover:underline decoration-2 underline-offset-4">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2 text-base leading-relaxed">
                      {item.summary || item.content.substring(0, 100)}...
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white border border-gray-200">
              <p className="text-gray-500 font-medium">Belum ada informasi terbaru saat ini.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
