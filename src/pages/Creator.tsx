import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, 
  Shield, 
  ExternalLink, 
  MapPin, 
  Globe, 
  Calendar,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { AddReviewForm } from '@/components/reviews/AddReviewForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { platformConfigs, PlatformType } from '@/lib/platformUtils';
import { SEOHead, CreatorJsonLd, ReviewJsonLd, BreadcrumbJsonLd } from '@/components/seo';

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
}

interface PlatformLink {
  id: string;
  platform: PlatformType;
  username: string;
  url: string;
  is_verified: boolean;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  platform: PlatformType;
  language: string;
  helpful_count: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

const CreatorPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [platforms, setPlatforms] = useState<PlatformLink[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreatorData = async () => {
    if (!slug) return;

    try {
      // Fetch creator
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (creatorError || !creatorData) {
        setLoading(false);
        return;
      }

      setCreator(creatorData as Creator);

      // Fetch platform links
      const { data: linksData } = await supabase
        .from('platform_links')
        .select('*')
        .eq('creator_id', creatorData.id);

      if (linksData) {
        setPlatforms(linksData as PlatformLink[]);
      }

      // Fetch reviews separately
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('creator_id', creatorData.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (reviewsData) {
        // Fetch profiles for each review
        const reviewsWithProfiles = await Promise.all(
          reviewsData.map(async (review) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('user_id', review.user_id)
              .maybeSingle();
            
            return {
              ...review,
              profiles: profileData || { username: 'Utente', avatar_url: null }
            };
          })
        );
        setReviews(reviewsWithProfiles as Review[]);
      }
    } catch (error) {
      console.error('Error fetching creator:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatorData();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!creator) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold text-foreground mb-4">
              Creator non trovato
            </h1>
            <Link to="/creators">
              <Button variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Torna ai Creator
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < Math.floor(rating) ? 'text-accent fill-accent' : 'text-muted'
        }`}
      />
    ));
  };

  const defaultCover = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop';
  const defaultAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop';

  return (
    <Layout>
      <SEOHead 
        title={`${creator.name} - Recensioni e Profilo`}
        description={creator.bio || `Leggi le recensioni di ${creator.name}. Rating ${Number(creator.rating).toFixed(1)}/5 basato su ${creator.review_count} recensioni verificate.`}
        canonicalUrl={`/creator/${creator.slug}`}
        ogImage={creator.avatar_url || undefined}
        ogType="profile"
        keywords={[creator.name, creator.category || '', 'recensioni', 'onlyfans', 'fansly'].filter(Boolean)}
      />
      <CreatorJsonLd 
        name={creator.name}
        slug={creator.slug}
        description={creator.bio || undefined}
        image={creator.avatar_url || undefined}
        rating={Number(creator.rating)}
        reviewCount={creator.review_count}
        country={creator.country || undefined}
      />
      {reviews.length > 0 && (
        <ReviewJsonLd 
          reviews={reviews.map(r => ({
            id: r.id,
            authorName: r.profiles?.username || 'Utente',
            rating: r.rating,
            title: r.title,
            content: r.content,
            datePublished: r.created_at,
          }))}
          itemName={creator.name}
          itemSlug={creator.slug}
          aggregateRating={Number(creator.rating)}
          reviewCount={creator.review_count}
        />
      )}
      <BreadcrumbJsonLd 
        items={[
          { name: 'Home', url: '/' },
          { name: 'Creator', url: '/creators' },
          { name: creator.name, url: `/creator/${creator.slug}` },
        ]}
      />
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={creator.cover_image_url || defaultCover}
          alt={creator.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-elevated mb-8"
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={creator.avatar_url || defaultAvatar}
                alt={creator.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-card shadow-lg"
              />
              {creator.is_verified && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  {creator.name}
                </h1>
                {creator.is_premium && (
                  <Badge variant="gold" className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Premium
                  </Badge>
                )}
                {creator.is_verified && (
                  <Badge variant="verified" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Verificato
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                {creator.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {creator.country}
                  </span>
                )}
                {creator.languages && creator.languages.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {creator.languages.join(', ').toUpperCase()}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Su OnlyAdvisor da {new Date(creator.created_at).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(Number(creator.rating))}</div>
                  <span className="font-display text-2xl font-bold text-foreground">
                    {Number(creator.rating).toFixed(1)}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  basato su {creator.review_count} recensioni
                </span>
              </div>

              {creator.bio && (
                <p className="text-muted-foreground mb-6">{creator.bio}</p>
              )}

              {/* Tags */}
              {creator.tags && creator.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {creator.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action */}
            <div className="shrink-0">
              <AddReviewForm 
                creatorId={creator.id}
                creatorName={creator.name}
                availablePlatforms={platforms.map(p => p.platform)}
                onSuccess={fetchCreatorData}
              />
            </div>
          </div>
        </motion.div>

        {/* Content Tabs */}
        <Tabs defaultValue="reviews" className="mb-20">
          <TabsList className="w-full justify-start bg-card border border-border/50 p-1 rounded-xl mb-6">
            <TabsTrigger value="reviews" className="rounded-lg">
              Recensioni ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="platforms" className="rounded-lg">
              Piattaforme ({platforms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews">
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ReviewCard 
                      review={{
                        id: review.id,
                        creatorId: creator.id,
                        userId: review.user_id,
                        userName: review.profiles?.username || 'Utente',
                        userAvatar: review.profiles?.avatar_url || '',
                        rating: review.rating,
                        title: review.title,
                        content: review.content,
                        pros: review.pros || [],
                        cons: review.cons || [],
                        language: review.language,
                        createdAt: review.created_at,
                        helpful: review.helpful_count,
                        platform: review.platform
                      }} 
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card border border-border/50 rounded-xl">
                <div className="text-6xl mb-4">✍️</div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                  Nessuna recensione ancora
                </h3>
                <p className="text-muted-foreground mb-6">
                  Sii il primo a recensire {creator.name}!
                </p>
                <AddReviewForm 
                  creatorId={creator.id}
                  creatorName={creator.name}
                  availablePlatforms={platforms.map(p => p.platform)}
                  onSuccess={fetchCreatorData}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="platforms">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <motion.a
                  key={platform.id}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-6 bg-card border border-border/50 rounded-xl hover:border-primary/50 hover:shadow-glow transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: platformConfigs[platform.platform].color }}
                    >
                      {platformConfigs[platform.platform].icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {platformConfigs[platform.platform].name}
                        </span>
                        {platform.is_verified && (
                          <Shield className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        @{platform.username}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </motion.a>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CreatorPage;
