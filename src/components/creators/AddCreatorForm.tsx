import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, ExternalLink, AlertCircle, Check, Loader2, Image, Camera } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { 
  platformConfigs, 
  PlatformType, 
  generateProfileUrl, 
  normalizeUsername,
  validateUsername,
  generateSlug 
} from '@/lib/platformUtils';
import { categories } from '@/lib/mockData';
import { CreatorImageUpload } from './CreatorImageUpload';

interface PlatformLink {
  platform: PlatformType;
  username: string;
  url: string;
}

const creatorSchema = z.object({
  name: z.string().min(2, 'Nome deve avere almeno 2 caratteri').max(100, 'Nome troppo lungo'),
  bio: z.string().max(500, 'Bio troppo lunga (max 500 caratteri)').optional(),
  category: z.string().min(1, 'Seleziona una categoria'),
  country: z.string().max(2, 'Codice paese deve essere di 2 lettere').optional(),
});

export const AddCreatorForm = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [platforms, setPlatforms] = useState<PlatformLink[]>([]);
  
  const [currentPlatform, setCurrentPlatform] = useState<PlatformType | ''>('');
  const [currentUsername, setCurrentUsername] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();

  const addPlatformLink = () => {
    if (!currentPlatform || !currentUsername) return;
    
    const validation = validateUsername(currentUsername);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, platformUsername: validation.error! }));
      return;
    }
    
    const normalized = normalizeUsername(currentUsername);
    const url = generateProfileUrl(currentPlatform, normalized);
    
    // Check for duplicates
    if (platforms.some(p => p.platform === currentPlatform)) {
      setErrors(prev => ({ ...prev, platformUsername: 'Piattaforma già aggiunta' }));
      return;
    }
    
    setPlatforms([...platforms, { platform: currentPlatform, username: normalized, url }]);
    setCurrentPlatform('');
    setCurrentUsername('');
    setErrors(prev => {
      const { platformUsername, ...rest } = prev;
      return rest;
    });
  };

  const removePlatformLink = (index: number) => {
    setPlatforms(platforms.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!user) {
      toast({
        title: 'Accesso richiesto',
        description: 'Devi effettuare il login per aggiungere un creator',
        variant: 'destructive',
      });
      return;
    }

    // Validate form
    const result = creatorSchema.safeParse({ name, bio, category, country });
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

    if (!avatarUrl || !coverUrl) {
      setErrors({ images: 'Carica sia la foto profilo che la copertina' });
      return;
    }

    if (platforms.length === 0) {
      setErrors({ platforms: 'Aggiungi almeno un link piattaforma' });
      return;
    }

    setLoading(true);

    try {
      const slug = generateSlug(name);
      
      // Create creator
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .insert({
          name,
          slug,
          bio: bio || null,
          category,
          country: country || null,
          avatar_url: avatarUrl || null,
          cover_image_url: coverUrl || null,
          added_by_user_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (creatorError) {
        if (creatorError.message.includes('duplicate')) {
          toast({
            title: 'Creator già esistente',
            description: 'Un creator con questo nome esiste già',
            variant: 'destructive',
          });
        } else {
          throw creatorError;
        }
        return;
      }

      // Add platform links
      const platformLinksData = platforms.map(p => ({
        creator_id: creator.id,
        platform: p.platform,
        username: p.username,
        url: p.url,
      }));

      const { error: linksError } = await supabase
        .from('platform_links')
        .insert(platformLinksData);

      if (linksError) {
        // Rollback creator if links fail
        await supabase.from('creators').delete().eq('id', creator.id);
        throw linksError;
      }

      // Create pending reward transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount: 1.00,
          transaction_type: 'creator_bonus',
          status: 'pending',
          reference_id: creator.id,
          reference_type: 'creator',
          description: `Bonus per aggiunta creator: ${name}`
        });

      toast({
        title: 'Creator aggiunto!',
        description: 'Il creator è in attesa di approvazione. Riceverai +1.00€ dopo la verifica.',
      });

      // Reset form
      setName('');
      setBio('');
      setCategory('');
      setCountry('');
      setAvatarUrl('');
      setCoverUrl('');
      setPlatforms([]);
      setOpen(false);
    } catch (error: any) {
      console.error('Error adding creator:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile aggiungere il creator',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = currentPlatform && currentUsername 
    ? generateProfileUrl(currentPlatform, normalizeUsername(currentUsername))
    : '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero">
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Creator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Aggiungi Nuovo Creator</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Image Uploads */}
          <div className="space-y-4">
            <Label>Immagini Creator *</Label>
            <div className="flex flex-col gap-4">
              <CreatorImageUpload
                type="cover"
                currentImageUrl={coverUrl}
                onUploadComplete={setCoverUrl}
              />
              <div className="flex items-center gap-4">
                <CreatorImageUpload
                  type="avatar"
                  currentImageUrl={avatarUrl}
                  onUploadComplete={setAvatarUrl}
                />
                <div className="text-sm text-muted-foreground">
                  <p>Carica foto profilo</p>
                  <p className="text-xs">Max 5MB, formato immagine</p>
                </div>
              </div>
            </div>
            {(!avatarUrl || !coverUrl) && (
              <p className="text-xs text-muted-foreground">
                Entrambe le immagini sono richieste per aggiungere un creator
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Creator *</Label>
            <Input
              id="name"
              placeholder="Es: Luna Starlight"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.category}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (opzionale)</Label>
            <Textarea
              id="bio"
              placeholder="Breve descrizione del creator..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{bio.length}/500</p>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">Paese (opzionale)</Label>
            <Input
              id="country"
              placeholder="IT, US, UK..."
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
            />
          </div>

          {/* Platform Links */}
          <div className="space-y-4">
            <Label>Link Piattaforme *</Label>
            
            {/* Added platforms */}
            {platforms.length > 0 && (
              <div className="space-y-2">
                {platforms.map((p, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: platformConfigs[p.platform].color }}
                    >
                      {platformConfigs[p.platform].icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{platformConfigs[p.platform].name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePlatformLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Add new platform */}
            <div className="space-y-3 p-4 border border-dashed border-border rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <Select 
                  value={currentPlatform} 
                  onValueChange={(val) => setCurrentPlatform(val as PlatformType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Piattaforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(platformConfigs).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Username"
                  value={currentUsername}
                  onChange={(e) => setCurrentUsername(e.target.value)}
                />
              </div>
              
              {/* URL Preview */}
              {previewUrl && (
                <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded text-sm">
                  <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate">{previewUrl}</span>
                </div>
              )}
              
              {errors.platformUsername && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.platformUsername}
                </p>
              )}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPlatformLink}
                disabled={!currentPlatform || !currentUsername}
                className="w-full"
              >
                <Plus className="mr-2 h-3 w-3" />
                Aggiungi Link
              </Button>
            </div>

            {errors.platforms && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.platforms}
              </p>
            )}
          </div>

          {/* Reward Info */}
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
            <p className="text-sm text-center">
              <span className="font-semibold text-accent">🎁 +1.00€</span>
              <span className="text-muted-foreground"> quando il creator viene approvato</span>
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
                Invia Creator
              </>
            )}
          </Button>
          
          {!user && (
            <p className="text-sm text-center text-muted-foreground">
              Devi effettuare il login per aggiungere un creator
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
