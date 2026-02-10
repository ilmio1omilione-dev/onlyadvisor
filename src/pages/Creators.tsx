import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Grid, List, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { CreatorCard } from '@/components/creators/CreatorCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/lib/mockData';
import { platformConfigs, PlatformType } from '@/lib/platformUtils';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead, BreadcrumbJsonLd } from '@/components/seo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Creator {
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

const CreatorsPage = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';
  
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const { data, error } = await supabase
          .from('creators')
          .select(`
            *,
            platform_links (platform, username, url, is_verified)
          `)
          .eq('status', 'active')
          .order('rating', { ascending: false });

        if (error) throw error;
        if (data) setCreators(data as Creator[]);
      } catch (error) {
        console.error('Error fetching creators:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  const filteredCreators = useMemo(() => {
    let result = [...creators];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.bio && c.bio.toLowerCase().includes(query)) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(query)))
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Platform filter
    if (selectedPlatform) {
      result = result.filter((c) =>
        c.platform_links?.some((p) => p.platform === selectedPlatform)
      );
    }

    // Sort
    if (sortBy === 'rating') {
      result.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (sortBy === 'reviews') {
      result.sort((a, b) => b.review_count - a.review_count);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [creators, searchQuery, selectedCategory, selectedPlatform, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedPlatform('');
    setSortBy('rating');
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedPlatform;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead 
        title="Scopri i Creator - OnlyAdvisor"
        description="Esplora la nostra collezione di content creator verificati. Trova i migliori creator per categoria, piattaforma e valutazione."
        canonicalUrl="/creators"
        keywords={['creator', 'onlyfans', 'fansly', 'recensioni', 'top rated']}
      />
      <BreadcrumbJsonLd 
        items={[
          { name: 'Home', url: '/' },
          { name: 'Creator', url: '/creators' },
        ]}
      />
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl font-bold text-foreground mb-2"
            >
              Scopri i Creator
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground"
            >
              Esplora la nostra collezione di {creators.length}+ creator verificati
            </motion.p>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border/50 rounded-xl p-4 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cerca per nome o tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/50"
                />
              </div>

              {/* Category */}
              <Select value={selectedCategory || "all"} onValueChange={(val) => setSelectedCategory(val === "all" ? "" : val)}>
                <SelectTrigger className="w-full lg:w-48 bg-secondary/50">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Platform */}
              <Select value={selectedPlatform || "all"} onValueChange={(val) => setSelectedPlatform(val === "all" ? "" : val)}>
                <SelectTrigger className="w-full lg:w-40 bg-secondary/50">
                  <SelectValue placeholder="Piattaforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  {Object.entries(platformConfigs).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-40 bg-secondary/50">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Valutazione</SelectItem>
                  <SelectItem value="reviews">N° Recensioni</SelectItem>
                  <SelectItem value="newest">Più Recenti</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="hidden lg:flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                <span className="text-sm text-muted-foreground">Filtri attivi:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    "{searchQuery}"
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="secondary">{selectedCategory}</Badge>
                )}
                {selectedPlatform && (
                  <Badge variant="secondary">
                    {platformConfigs[selectedPlatform as PlatformType]?.name}
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Cancella tutto
                </Button>
              </div>
            )}
          </motion.div>

          {/* Results */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {filteredCreators.length} creator trovati
            </p>
          </div>

          {filteredCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators.map((creator, index) => (
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
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                Nessun creator trovato
              </h3>
              <p className="text-muted-foreground mb-6">
                Prova a modificare i filtri di ricerca
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Resetta Filtri
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreatorsPage;
