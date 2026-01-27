import { useState, useRef } from 'react';
import { Camera, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Creator image upload component for avatar and cover images

interface CreatorImageUploadProps {
  type: 'avatar' | 'cover';
  currentImageUrl?: string | null;
  onUploadComplete: (url: string) => void;
  className?: string;
}

export const CreatorImageUpload = ({
  type,
  currentImageUrl,
  onUploadComplete,
  className,
}: CreatorImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Errore',
        description: 'Seleziona un file immagine valido',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Errore',
        description: "L'immagine non può superare 5MB",
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pending/${Date.now()}-${type}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('creator-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('creator-images')
        .getPublicUrl(fileName);

      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);

      toast({
        title: 'Successo',
        description: 'Immagine caricata con successo',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Errore upload',
        description: error.message || 'Errore durante il caricamento',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (type === 'avatar') {
    return (
      <div className={cn('relative', className)}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={cn(
            'relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-border cursor-pointer transition-all hover:border-primary',
            uploading && 'pointer-events-none opacity-50'
          )}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {previewUrl && !uploading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Cover image
  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          'relative w-full h-32 rounded-xl overflow-hidden border-2 border-dashed border-border cursor-pointer transition-all hover:border-primary',
          uploading && 'pointer-events-none opacity-50'
        )}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Cover Preview"
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-2 rounded-xl">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Clicca per caricare copertina</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      {previewUrl && !uploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
