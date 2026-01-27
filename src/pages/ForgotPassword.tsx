import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.object({
  email: z.string().email('Email non valida'),
});

const ForgotPasswordPage = () => {
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const result = emailSchema.safeParse({ email });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: 'Errore',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setSent(true);
      }
    } catch (err) {
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore imprevisto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-elevated">
            {sent ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Controlla la tua email
                </h1>
                <p className="text-muted-foreground mb-6">
                  Ti abbiamo inviato un link per reimpostare la password a{' '}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <Link to="/auth">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Torna al login
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                    Password dimenticata?
                  </h1>
                  <p className="text-muted-foreground">
                    Inserisci la tua email e ti invieremo un link per reimpostarla
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tua@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Invio in corso...' : 'Invia link di reset'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link 
                    to="/auth" 
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Torna al login
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;
