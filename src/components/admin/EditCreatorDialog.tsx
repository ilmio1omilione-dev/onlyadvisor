import { useState } from 'react';
import { Loader2, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { categories } from '@/lib/mockData';
import { CreatorImageUpload } from '@/components/creators/CreatorImageUpload';

interface Creator {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  category: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
}

interface EditCreatorDialogProps {
  creator: Creator;
  onSuccess: () => void;
}

export const EditCreatorDialog = ({ creator, onSuccess }: EditCreatorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(creator.name);
  const [bio, setBio] = useState(creator.bio || '');
  const [category, setCategory] = useState(creator.category || '');
  const [avatarUrl, setAvatarUrl] = useState(creator.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(creator.cover_image_url || '');
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('creators')
        .update({
          name,
          bio: bio || null,
          category: category || null,
          avatar_url: avatarUrl || null,
          cover_image_url: coverUrl || null,
        })
        .eq('id', creator.id);

      if (error) throw error;

      toast({
        title: 'Creator aggiornato',
        description: 'Le modifiche sono state salvate con successo',
      });

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating creator:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile aggiornare il creator',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Modifica Creator</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Image Uploads */}
          <div className="space-y-4">
            <Label>Immagini</Label>
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
                  <p>Foto profilo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
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
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Salva Modifiche
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
