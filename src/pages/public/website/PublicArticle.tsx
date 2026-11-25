import React, { useEffect, useState } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { TenantPublicProfile, CmsContent } from '../../../domains/website/types';
import { websiteService } from '../../../domains/website/services/WebsiteService';

export default function PublicArticle({ profile, type }: { profile: TenantPublicProfile, type?: CmsContent }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { basePath } = useOutletContext<{ basePath: string }>();
  const [content, setContent] = useState<CmsContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    websiteService.getPublicContentBySlug(profile.tenantId, slug).then(res => {
      if (res.isSuccess) {
        setContent(res.getValue());
        if (res.getValue().title) {
          document.title = `${res.getValue().title} - ${profile.schoolName}`;
        }
      } else {
        setContent(null);
      }
      setLoading(false);
    });
  }, [profile.tenantId, slug, profile.schoolName]);

  // Mengubah baris baru (Enter) menjadi tag HTML rapi jika konten berupa teks biasa
  const formatContent = (raw: string) => {
    if (!raw) return '';
    // Jika sudah mengandung tag blok HTML (<p>, <div>, <h3>, <ul>, <ol>), tampilkan apa adanya
    if (/<(p|div|h[1-6]|ul|ol|table|blockquote)\b/i.test(raw)) {
      return raw;
    }
    // Jika berupa teks biasa, ubah enter ganda menjadi paragraf dan enter tunggal menjadi baris baru
    return raw
      .split(/\n\s*\n/)
      .map(paragraph => `<p class="mb-4 leading-relaxed">${paragraph.trim().replace(/\n/g, '<br />')}</p>`)
      .join('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 rounded-full border-t-blue-600" style={{ borderTopColor: profile.primaryColor }}></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Halaman Tidak Ditemukan</h2>
          <p className="text-gray-500 mb-6">Konten yang Anda cari tidak tersedia atau belum dipublikasikan.</p>
          <button onClick={() => navigate(basePath || '/')} className="px-6 py-2 rounded-md font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: profile.primaryColor }}>
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <article className="bg-gray-50 min-h-screen pb-24">
      {/* Article Header */}
      <div className="bg-gray-900 text-white pt-16 pb-24 relative overflow-hidden">
        {content.featuredImage && (
          <div className="absolute inset-0">
            <img src={content.featuredImage} alt={content.title} className="w-full h-full object-cover opacity-25 blur-sm scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
          </div>
        )}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-5 bg-white/20 backdrop-blur-sm">
            {content.type === 'ARTICLE' ? 'BERITA' : content.type === 'PAGE' ? 'HALAMAN' : content.type}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-5">
            {content.title}
          </h1>
          {content.publishedAt && (
            <p className="text-gray-300 font-medium text-sm md:text-base">
              Dipublikasikan pada {new Date(content.publishedAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {/* Article Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {content.featuredImage && (
            <div className="w-full bg-gray-50 border-b border-gray-100 flex justify-center p-4 sm:p-6">
              <img src={content.featuredImage} alt={content.title} className="w-full max-w-md h-auto rounded-xl shadow-sm" />
            </div>
          )}
          <div className="p-6 sm:p-8 md:p-12 prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-img:rounded-xl">
            <div dangerouslySetInnerHTML={{ __html: formatContent(content.content) }} />
          </div>
        </div>
      </div>
    </article>
  );
}
