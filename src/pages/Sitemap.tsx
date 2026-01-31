import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SitemapCreator {
  slug: string;
  updated_at: string;
}

const BASE_URL = 'https://onlyadvisor.lovable.app';

const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/creators', priority: '0.9', changefreq: 'daily' },
  { url: '/auth', priority: '0.3', changefreq: 'monthly' },
];

const Sitemap = () => {
  const [creators, setCreators] = useState<SitemapCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreators = async () => {
      const { data } = await supabase
        .from('public_creators')
        .select('slug, updated_at');
      
      if (data) {
        setCreators(data.filter(c => c.slug) as SitemapCreator[]);
      }
      setLoading(false);
    };
    fetchCreators();
  }, []);

  if (loading) {
    return <div>Generating sitemap...</div>;
  }

  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${creators.map(creator => `  <url>
    <loc>${BASE_URL}/creator/${creator.slug}</loc>
    <lastmod>${creator.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

  return (
    <pre style={{ 
      fontFamily: 'monospace', 
      whiteSpace: 'pre-wrap', 
      padding: '20px',
      background: '#f5f5f5',
      fontSize: '12px'
    }}>
      {xml}
    </pre>
  );
};

export default Sitemap;
