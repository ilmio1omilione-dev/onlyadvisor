import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreatorCard } from '@/components/creators/CreatorCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { PlatformType } from '@/lib/platformUtils';

interface DBCreator {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  category: string | null;
  country: string | null;
  languages: string[];
  tags: string[];
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_premium: boolean;
  created_at: string;
  platform_links?: { platform: PlatformType; username: string; url: string; is_verified: boolean }[];
}

export const FeaturedCreators = () => {
  const [creators, setCreators] = useState<DBCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const { data, error } = await supabase
          .from('creators')
          .select(`*, platform_links (platform, username, url, is_verified)`)
          .eq('status', 'active')
          .order('rating', { ascending: false })
          .limit(6);

        if (error) throw error;
        if (data) setCreators(data as DBCreator[]);
      } catch (error) {
        console.error('Error fetching featured creators:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCreators();
  }, []);

  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-primary font-medium"
            >
              I Migliori del Momento
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2"
            >
              Creator in Evidenza
            </motion.h2>
          </div>
          <Link to="/creators">
            <Button variant="ghost" className="hidden md:flex">
              Vedi Tutti
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : creators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator, index) => (
              <CreatorCard
                key={creator.id}
                creator={{
                  id: creator.id,
                  name: creator.name,
                  slug: creator.slug,
                  avatar: creator.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
                  coverImage: creator.cover_image_url || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop',
                  bio: creator.bio || '',
                  category: creator.category || '',
                  country: creator.country || '',
                  languages: creator.languages || [],
                  platforms: creator.platform_links?.map(p => ({
                    platform: p.platform,
                    username: p.username,
                    url: p.url,
                    verified: p.is_verified ?? false
                  })) || [],
                  rating: Number(creator.rating),
                  reviewCount: creator.review_count,
                  isVerified: creator.is_verified,
                  isPremium: creator.is_premium,
                  createdAt: creator.created_at,
                  tags: creator.tags || []
                }}
                index={index}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">Nessun creator disponibile al momento.</p>
        )}

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Link to="/creators">
            <Button variant="outline">
              Vedi Tutti i Creator
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
