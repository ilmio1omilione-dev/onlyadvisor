import { Star, ThumbsUp, Flag } from 'lucide-react';
import { Review, platformInfo } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-accent fill-accent' : 'text-muted'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={review.userAvatar}
            alt={review.userName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{review.userName}</span>
              <Badge variant="outline" className="text-xs">
                {platformInfo[review.platform].name}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDate(review.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
      </div>

      {/* Content */}
      <h4 className="font-display font-semibold text-lg text-foreground mb-2">
        {review.title}
      </h4>
      <p className="text-muted-foreground mb-4">{review.content}</p>

      {/* Pros & Cons */}
      {(review.pros.length > 0 || review.cons.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {review.pros.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-green-500">Pro</span>
              <ul className="space-y-1">
                {review.pros.map((pro, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review.cons.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-red-500">Contro</span>
              <ul className="space-y-1">
                {review.cons.map((con, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <ThumbsUp className="h-4 w-4 mr-2" />
          Utile ({review.helpful})
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Flag className="h-4 w-4 mr-2" />
          Segnala
        </Button>
      </div>
    </div>
  );
};
