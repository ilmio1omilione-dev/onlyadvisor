import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Wallet, 
  Star, 
  FileText, 
  ArrowUpRight,
  Clock,
  Check,
  X,
  Euro
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  description: string | null;
  created_at: string;
}

interface UserReview {
  id: string;
  rating: number;
  title: string;
  status: string;
  created_at: string;
  creator_id: string;
}

const ProfilePage = () => {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        // Fetch transactions
        const { data: txData } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (txData) setTransactions(txData);

        // Fetch reviews
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('id, rating, title, status, created_at, creator_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (reviewData) setReviews(reviewData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Logout effettuato',
      description: 'A presto!',
    });
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />In attesa</Badge>;
      case 'approved':
        return <Badge variant="verified" className="gap-1"><Check className="h-3 w-3" />Approvato</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />Rifiutato</Badge>;
      case 'paid':
        return <Badge variant="gold" className="gap-1"><Euro className="h-3 w-3" />Pagato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'creator_bonus': return 'Bonus Creator';
      case 'review_reward': return 'Reward Recensione';
      case 'payout': return 'Prelievo';
      case 'adjustment': return 'Aggiustamento';
      case 'correction': return 'Correzione';
      default: return type;
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/50 rounded-2xl p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              
              <div className="flex-1">
                <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                  {profile.username}
                </h1>
                <p className="text-muted-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Membro dal {new Date(profile.created_at).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              <Button variant="outline" onClick={handleSignOut}>
                Logout
              </Button>
            </div>
          </motion.div>

          {/* Wallet Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-accent" />
                </div>
                <span className="text-muted-foreground">Saldo Disponibile</span>
              </div>
              <p className="font-display text-3xl font-bold text-accent">
                €{profile.available_balance.toFixed(2)}
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <span className="text-muted-foreground">In Attesa</span>
              </div>
              <p className="font-display text-3xl font-bold text-primary">
                €{profile.pending_balance.toFixed(2)}
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Star className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-muted-foreground">Recensioni</span>
              </div>
              <p className="font-display text-3xl font-bold text-foreground">
                {reviews.length}
              </p>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="transactions" className="mb-20">
            <TabsList className="w-full justify-start bg-card border border-border/50 p-1 rounded-xl mb-6">
              <TabsTrigger value="transactions" className="rounded-lg">
                <Wallet className="mr-2 h-4 w-4" />
                Transazioni
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg">
                <FileText className="mr-2 h-4 w-4" />
                Le Mie Recensioni
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transactions">
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          tx.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          <ArrowUpRight className={`h-5 w-5 ${
                            tx.amount > 0 ? 'text-green-400' : 'text-red-400 rotate-180'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {getTransactionTypeLabel(tx.transaction_type)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {tx.description || new Date(tx.created_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(tx.status)}
                        <span className={`font-display text-lg font-bold ${
                          tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}€
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card border border-border/50 rounded-xl">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    Nessuna transazione
                  </h3>
                  <p className="text-muted-foreground">
                    Inizia ad aggiungere creator e scrivere recensioni per guadagnare!
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews">
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-accent fill-accent' : 'text-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{review.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(review.status)}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card border border-border/50 rounded-xl">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    Nessuna recensione
                  </h3>
                  <p className="text-muted-foreground">
                    Non hai ancora scritto recensioni. Inizia ora!
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
