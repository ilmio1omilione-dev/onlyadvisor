import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, X, AlertCircle, Loader2, Check } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { platformConfigs, PlatformType } from '@/lib/platformUtils';

interface AddReviewFormProps {
  creatorId: string;
  creatorName: string;
  availablePlatforms: PlatformType[];
  onSuccess?: () => void;
}

const reviewSchema = z.object({
  rating: z.number().min(1, 'Seleziona una valutazione').max(5),
  title: z.string().min(5, 'Titolo troppo corto (min 5 caratteri)').max(100, 'Titolo troppo lungo'),
  content: z.string().min(20, 'Recensione troppo corta (min 20 caratteri)').max(2000, 'Recensione troppo lunga'),
  platform: z.string().min(1, 'Seleziona una piattaforma'),
});

export const AddReviewForm = ({ creatorId, creatorName, availablePlatforms, onSuccess }: AddReviewFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<string>('');
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();

  const addPro = () => {
    if (newPro.trim() && pros.length < 5) {
      setPros([...pros, newPro.trim()]);
      setNewPro('');
    }
  };

  const addCon = () => {
    if (newCon.trim() && cons.length < 5) {
      setCons([...cons, newCon.trim()]);
      setNewCon('');
    }
  };

  const removePro = (index: number) => setPros(pros.filter((_, i) => i !== index));
  const removeCon = (index: number) => setCons(cons.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!user) {
      toast({
        title: 'Accesso richiesto',
        description: 'Devi effettuare il login per scrivere una recensione',
        variant: 'destructive',
      });
      return;
    }

    // Validate form
    const result = reviewSchema.safeParse({ rating, title, content, platform });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Create review
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          creator_id: creatorId,
          user_id: user.id,
          rating,
          title,
          content,
          platform: platform as PlatformType,
          pros,
          cons,
          status: 'pending',
          language: navigator.language.split('-')[0] || 'en'
        })
        .select()
        .single();

      if (reviewError) {
        if (reviewError.message.includes('duplicate') || reviewError.code === '23505') {
          toast({
            title: 'Recensione già esistente',
            description: 'Hai già recensito questo creator',
            variant: 'destructive',
          });
        } else {
          throw reviewError;
        }
        return;
      }

      // Create pending reward transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount: 0.20,
          transaction_type: 'review_reward',
          status: 'pending',
          reference_id: review.id,
          reference_type: 'review',
          description: `Reward per recensione: ${creatorName}`
        });

      toast({
        title: 'Recensione inviata!',
        description: 'La tua recensione è in attesa di approvazione. Riceverai +0.20€ dopo la verifica.',
      });

      // Reset form
      setRating(0);
      setTitle('');
      setContent('');
      setPlatform('');
      setPros([]);
      setCons([]);
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding review:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile inviare la recensione',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="lg">
          <Star className="mr-2 h-4 w-4" />
          Scrivi Recensione
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Recensisci {creatorName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Valutazione *</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-accent fill-accent'
                        : 'text-muted-foreground'
                    }`}
                  />
                </motion.button>
              ))}
              <span className="ml-2 text-lg font-semibold">
                {rating > 0 ? rating : '-'}/5
              </span>
            </div>
            {errors.rating && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.rating}
              </p>
            )}
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label>Piattaforma utilizzata *</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Su quale piattaforma?" />
              </SelectTrigger>
              <SelectContent>
                {availablePlatforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    {platformConfigs[p].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.platform && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.platform}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              placeholder="Riassumi la tua esperienza..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">La tua recensione *</Label>
            <Textarea
              id="content"
              placeholder="Racconta la tua esperienza con questo creator..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{content.length}/2000</p>
            {errors.content && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.content}
              </p>
            )}
          </div>

          {/* Pros */}
          <div className="space-y-2">
            <Label>Pro (opzionale)</Label>
            {pros.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {pros.map((pro, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
                  >
                    <span>+ {pro}</span>
                    <button type="button" onClick={() => removePro(index)}>
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
            {pros.length < 5 && (
              <div className="flex gap-2">
                <Input
                  placeholder="Aggiungi un pro..."
                  value={newPro}
                  onChange={(e) => setNewPro(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPro())}
                />
                <Button type="button" variant="outline" size="icon" onClick={addPro}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Cons */}
          <div className="space-y-2">
            <Label>Contro (opzionale)</Label>
            {cons.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {cons.map((con, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm"
                  >
                    <span>- {con}</span>
                    <button type="button" onClick={() => removeCon(index)}>
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
            {cons.length < 5 && (
              <div className="flex gap-2">
                <Input
                  placeholder="Aggiungi un contro..."
                  value={newCon}
                  onChange={(e) => setNewCon(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCon())}
                />
                <Button type="button" variant="outline" size="icon" onClick={addCon}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Reward Info */}
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
            <p className="text-sm text-center">
              <span className="font-semibold text-accent">🎁 +0.20€</span>
              <span className="text-muted-foreground"> quando la recensione viene approvata</span>
            </p>
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            variant="hero" 
            className="w-full" 
            size="lg"
            disabled={loading || !user}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Invio in corso...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Invia Recensione
              </>
            )}
          </Button>
          
          {!user && (
            <p className="text-sm text-center text-muted-foreground">
              Devi effettuare il login per scrivere una recensione
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
