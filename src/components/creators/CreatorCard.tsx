import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Shield, ExternalLink } from 'lucide-react';
import { Creator, platformInfo } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';

interface CreatorCardProps {
  creator: Creator;
  index?: number;
}

export const CreatorCard = ({ creator, index = 0 }: CreatorCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link to={`/creator/${creator.slug}`}>
        <div className="relative bg-card rounded-xl overflow-hidden border border-border/50 shadow-card hover:shadow-elevated transition-all duration-300">
          {/* Cover Image */}
          <div className="relative h-32 overflow-hidden">
            <img
              src={creator.coverImage}
              alt={creator.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-3 right-3 flex gap-2">
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
          </div>

          {/* Avatar */}
          <div className="relative px-4 -mt-10">
            <div className="relative inline-block">
              <img
                src={creator.avatar}
                alt={creator.name}
                className="w-20 h-20 rounded-full border-4 border-card object-cover"
              />
              {creator.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Shield className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 pt-2">
            <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {creator.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {creator.category}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-accent fill-accent" />
                <span className="font-semibold text-foreground">{creator.rating}</span>
              </div>
              <span className="text-muted-foreground text-sm">
                ({creator.reviewCount} recensioni)
              </span>
            </div>

            {/* Platforms */}
            <div className="flex flex-wrap gap-2">
              {creator.platforms.map((platform) => {
                const isTipmeon = platform.platform === 'tipmeon';
                return (
                  <a
                    key={platform.platform}
                    href={platform.url || `${platformInfo[platform.platform].baseUrl}${platform.username}`}
                    target="_blank"
                    rel={isTipmeon ? 'noopener noreferrer' : 'noopener noreferrer nofollow'}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 text-xs hover:bg-secondary transition-colors"
                    style={{ borderLeft: `3px solid ${platformInfo[platform.platform].color}` }}
                  >
                    <span className="text-muted-foreground">{platformInfo[platform.platform].name}</span>
                    {platform.verified && (
                      <Shield className="h-3 w-3 text-primary" />
                    )}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
