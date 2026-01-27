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
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayoutRequestForm } from '@/components/profile/PayoutRequestForm';
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
  const { t, i18n } = useTranslation();
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [minPayoutAmount, setMinPayoutAmount] = useState(10);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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

      // Fetch min payout setting
      const { data: settingData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'min_payout_amount')
        .single();

      if (settingData) {
        setMinPayoutAmount(parseFloat(settingData.value as string));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Logout',
      description: t('nav.logout'),
    });
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{t('profile.pending')}</Badge>;
      case 'approved':
        return <Badge variant="verified" className="gap-1"><Check className="h-3 w-3" />{t('profile.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />{t('profile.rejected')}</Badge>;
      case 'paid':
        return <Badge variant="gold" className="gap-1"><Euro className="h-3 w-3" />{t('profile.paid')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'creator_bonus': return t('profile.creatorBonus');
      case 'review_reward': return t('profile.reviewReward');
      case 'payout': return t('profile.payout');
      case 'adjustment': return t('profile.adjustment');
      case 'correction': return t('profile.correction');
      default: return type;
    }
  };

  const formatDate = (dateStr: string) => {
    const locale = i18n.language === 'it' ? 'it-IT' : i18n.language === 'es' ? 'es-ES' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
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
                  {t('profile.memberSince', { date: formatDate(profile.created_at) })}
                </p>
              </div>

              <Button variant="outline" onClick={handleSignOut}>
                {t('nav.logout')}
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
                <span className="text-muted-foreground">{t('profile.availableBalance')}</span>
              </div>
              <p className="font-display text-3xl font-bold text-accent">
                €{Number(profile.available_balance).toFixed(2)}
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <span className="text-muted-foreground">{t('profile.pendingBalance')}</span>
              </div>
              <p className="font-display text-3xl font-bold text-primary">
                €{Number(profile.pending_balance).toFixed(2)}
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Star className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-muted-foreground">{t('profile.reviewsCount')}</span>
              </div>
              <p className="font-display text-3xl font-bold text-foreground">
                {reviews.length}
              </p>
            </div>
          </motion.div>

          {/* Payout Request */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <PayoutRequestForm 
              availableBalance={Number(profile.available_balance)}
              minPayoutAmount={minPayoutAmount}
              onSuccess={fetchUserData}
            />
            <p className="text-sm text-muted-foreground text-center mt-2">
              {t('profile.minPayout', { amount: minPayoutAmount.toFixed(2) })}
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="transactions" className="mb-20">
            <TabsList className="w-full justify-start bg-card border border-border/50 p-1 rounded-xl mb-6">
              <TabsTrigger value="transactions" className="rounded-lg">
                <Wallet className="mr-2 h-4 w-4" />
                {t('profile.transactions')}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg">
                <FileText className="mr-2 h-4 w-4" />
                {t('profile.myReviews')}
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
                            {tx.description || new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(tx.status)}
                        <span className={`font-display text-lg font-bold ${
                          tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}€
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card border border-border/50 rounded-xl">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    {t('profile.noTransactions')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('profile.noTransactionsHint')}
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
                            {new Date(review.created_at).toLocaleDateString()}
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
                    {t('profile.noReviews')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('profile.noReviewsHint')}
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
