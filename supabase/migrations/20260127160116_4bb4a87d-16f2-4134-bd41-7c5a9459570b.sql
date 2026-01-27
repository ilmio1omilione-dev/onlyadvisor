-- Create storage buckets for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-images', 'creator-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for creator-images bucket
CREATE POLICY "Creator images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'creator-images');

CREATE POLICY "Authenticated users can upload creator images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'creator-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update creator images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'creator-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete creator images"
ON storage.objects FOR DELETE
USING (bucket_id = 'creator-images' AND public.has_role(auth.uid(), 'admin'));

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notification policies
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Function to create notification on review status change
CREATE OR REPLACE FUNCTION public.notify_review_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'review_approved'
        WHEN NEW.status = 'rejected' THEN 'review_rejected'
        ELSE 'review_updated'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Recensione Approvata!'
        WHEN NEW.status = 'rejected' THEN 'Recensione Rifiutata'
        ELSE 'Stato Recensione Aggiornato'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'La tua recensione è stata approvata e pubblicata. Grazie per il tuo contributo!'
        WHEN NEW.status = 'rejected' THEN 'La tua recensione non è stata approvata. Contattaci per maggiori informazioni.'
        ELSE 'Lo stato della tua recensione è stato aggiornato.'
      END,
      NEW.id,
      'review'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create notification on payout status change
CREATE OR REPLACE FUNCTION public.notify_payout_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'payout_approved'
        WHEN NEW.status = 'paid' THEN 'payout_paid'
        WHEN NEW.status = 'rejected' THEN 'payout_rejected'
        ELSE 'payout_updated'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Payout Approvato!'
        WHEN NEW.status = 'paid' THEN 'Payout Pagato!'
        WHEN NEW.status = 'rejected' THEN 'Payout Rifiutato'
        ELSE 'Stato Payout Aggiornato'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'La tua richiesta di payout è stata approvata.'
        WHEN NEW.status = 'paid' THEN 'Il tuo payout di €' || NEW.amount || ' è stato processato!'
        WHEN NEW.status = 'rejected' THEN 'La tua richiesta di payout non è stata approvata. ' || COALESCE(NEW.admin_notes, '')
        ELSE 'Lo stato della tua richiesta di payout è stato aggiornato.'
      END,
      NEW.id,
      'payout'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER on_review_status_change
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_review_status_change();

CREATE TRIGGER on_payout_status_change
  AFTER UPDATE ON public.payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_payout_status_change();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;