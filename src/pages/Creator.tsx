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
  Edit
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getCreatorBySlug, 
  getReviewsByCreatorId, 
  platformInfo 
} from '@/lib/mockData';

const CreatorPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const creator = getCreatorBySlug(slug || '');
  const reviews = creator ? getReviewsByCreatorId(creator.id) : [];

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

  return (
    <Layout>
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={creator.coverImage}
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
                src={creator.avatar}
                alt={creator.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-card shadow-lg"
              />
              {creator.isVerified && (
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
                {creator.isPremium && (
                  <Badge variant="gold" className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Premium
                  </Badge>
                )}
                {creator.isVerified && (
                  <Badge variant="verified" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Verificato
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {creator.country}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {creator.languages.join(', ').toUpperCase()}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Su OnlyAdvisor da {new Date(creator.createdAt).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(creator.rating)}</div>
                  <span className="font-display text-2xl font-bold text-foreground">
                    {creator.rating}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  basato su {creator.reviewCount} recensioni
                </span>
              </div>

              <p className="text-muted-foreground mb-6">{creator.bio}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {creator.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="shrink-0">
              <Button variant="hero" size="lg">
                <Edit className="mr-2 h-4 w-4" />
                Scrivi Recensione
              </Button>
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
              Piattaforme ({creator.platforms.length})
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
                    <ReviewCard review={review} />
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
                <Button variant="hero">
                  <Edit className="mr-2 h-4 w-4" />
                  Scrivi la Prima Recensione
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="platforms">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creator.platforms.map((platform) => (
                <motion.a
                  key={platform.platform}
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
                      style={{ backgroundColor: platformInfo[platform.platform].color }}
                    >
                      {platformInfo[platform.platform].name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {platformInfo[platform.platform].name}
                        </span>
                        {platform.verified && (
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
