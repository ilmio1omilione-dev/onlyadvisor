import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  FileText, 
  Wallet,
  Check,
  X,
  Merge,
  Eye,
  AlertCircle,
  Loader2,
  Euro
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Creator {
  id: string;
  name: string;
  slug: string;
  status: string;
  category: string | null;
  created_at: string;
  added_by_user_id: string | null;
}

interface Review {
  id: string;
  title: string;
  rating: number;
  status: string;
  created_at: string;
  creator_id: string;
  user_id: string;
}

interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  admin_notes: string | null;
  created_at: string;
}

const AdminPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Merge dialog state
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [primaryCreatorId, setPrimaryCreatorId] = useState('');
  const [secondaryCreatorId, setSecondaryCreatorId] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
      toast({
        title: 'Accesso negato',
        description: 'Non hai i permessi per accedere a questa pagina',
        variant: 'destructive',
      });
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return;

      try {
        // Fetch pending creators
        const { data: creatorsData } = await supabase
          .from('creators')
          .select('*')
          .order('created_at', { ascending: false });
        if (creatorsData) setCreators(creatorsData);

        // Fetch pending reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });
        if (reviewsData) setReviews(reviewsData);

        // Fetch payout requests
        const { data: payoutsData } = await supabase
          .from('payout_requests')
          .select('*')
          .order('created_at', { ascending: false });
        if (payoutsData) setPayouts(payoutsData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const updateCreatorStatus = async (creatorId: string, status: 'active' | 'rejected') => {
    setActionLoading(creatorId);
    try {
      const { error } = await supabase
        .from('creators')
        .update({ status })
        .eq('id', creatorId);

      if (error) throw error;

      // If approved, update the reward transaction status
      if (status === 'active') {
        await supabase
          .from('wallet_transactions')
          .update({ status: 'approved' })
          .eq('reference_id', creatorId)
          .eq('reference_type', 'creator')
          .eq('transaction_type', 'creator_bonus');

        // Update user's pending and available balance
        const creator = creators.find(c => c.id === creatorId);
        if (creator?.added_by_user_id) {
          // Fetch current balances and update
          const { data: profileData } = await supabase
            .from('profiles')
            .select('pending_balance, available_balance')
            .eq('user_id', creator.added_by_user_id)
            .single();
          
          if (profileData) {
            await supabase
              .from('profiles')
              .update({ 
                pending_balance: Math.max(0, Number(profileData.pending_balance) - 1.00),
                available_balance: Number(profileData.available_balance) + 1.00
              })
              .eq('user_id', creator.added_by_user_id);
          }
        }
      }

      setCreators(creators.map(c => c.id === creatorId ? { ...c, status } : c));
      toast({
        title: status === 'active' ? 'Creator approvato' : 'Creator rifiutato',
        description: status === 'active' ? 'Il bonus è stato accreditato' : 'Il creator è stato rifiutato',
      });
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    setActionLoading(reviewId);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status })
        .eq('id', reviewId);

      if (error) throw error;

      // If approved, update the reward transaction status
      if (status === 'approved') {
        await supabase
          .from('wallet_transactions')
          .update({ status: 'approved' })
          .eq('reference_id', reviewId)
          .eq('reference_type', 'review')
          .eq('transaction_type', 'review_reward');
      }

      setReviews(reviews.map(r => r.id === reviewId ? { ...r, status } : r));
      toast({
        title: status === 'approved' ? 'Recensione approvata' : 'Recensione rifiutata',
      });
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMergeCreators = async () => {
    if (!primaryCreatorId || !secondaryCreatorId || primaryCreatorId === secondaryCreatorId) {
      toast({
        title: 'Errore',
        description: 'Seleziona due creator diversi da unire',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading('merge');
    try {
      // Move platform links from secondary to primary
      await supabase
        .from('platform_links')
        .update({ creator_id: primaryCreatorId })
        .eq('creator_id', secondaryCreatorId);

      // Move reviews from secondary to primary
      await supabase
        .from('reviews')
        .update({ creator_id: primaryCreatorId })
        .eq('creator_id', secondaryCreatorId);

      // Mark secondary as merged
      await supabase
        .from('creators')
        .update({ 
          status: 'merged',
          merged_into_id: primaryCreatorId 
        })
        .eq('id', secondaryCreatorId);

      // Create correction transaction (-0.80€)
      const secondaryCreator = creators.find(c => c.id === secondaryCreatorId);
      if (secondaryCreator?.added_by_user_id) {
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: secondaryCreator.added_by_user_id,
            amount: -0.80,
            transaction_type: 'correction',
            status: 'approved',
            reference_id: secondaryCreatorId,
            reference_type: 'creator',
            description: 'Correzione per merge creator duplicato'
          });
      }

      toast({
        title: 'Merge completato',
        description: 'I creator sono stati uniti con successo',
      });
      
      setMergeDialogOpen(false);
      setPrimaryCreatorId('');
      setSecondaryCreatorId('');
      
      // Refresh data
      const { data } = await supabase.from('creators').select('*').order('created_at', { ascending: false });
      if (data) setCreators(data);
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const updatePayoutStatus = async (payoutId: string, status: 'approved' | 'rejected' | 'paid') => {
    setActionLoading(payoutId);
    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({ 
          status,
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', payoutId);

      if (error) throw error;

      setPayouts(payouts.map(p => p.id === payoutId ? { ...p, status } : p));
      toast({
        title: `Payout ${status === 'paid' ? 'pagato' : status === 'approved' ? 'approvato' : 'rifiutato'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">In attesa</Badge>;
      case 'active':
      case 'approved':
        return <Badge variant="verified">Approvato</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rifiutato</Badge>;
      case 'merged':
        return <Badge variant="outline">Unito</Badge>;
      case 'paid':
        return <Badge variant="gold">Pagato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  if (!isAdmin) return null;

  const pendingCreators = creators.filter(c => c.status === 'pending');
  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const pendingPayouts = payouts.filter(p => p.status === 'pending');

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl font-bold text-foreground">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground">
              Gestisci creator, recensioni e pagamenti
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">Creator in attesa</span>
              </div>
              <p className="font-display text-2xl font-bold mt-2">{pendingCreators.length}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-accent" />
                <span className="text-muted-foreground">Recensioni in attesa</span>
              </div>
              <p className="font-display text-2xl font-bold mt-2">{pendingReviews.length}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-green-400" />
                <span className="text-muted-foreground">Payout in attesa</span>
              </div>
              <p className="font-display text-2xl font-bold mt-2">{pendingPayouts.length}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Euro className="h-5 w-5 text-yellow-400" />
                <span className="text-muted-foreground">Totale da pagare</span>
              </div>
              <p className="font-display text-2xl font-bold mt-2">
                €{pendingPayouts.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Merge Dialog */}
          <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Unisci Creator Duplicati</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Seleziona il creator primario (che sopravvive) e quello secondario (che verrà marcato come unito).
                  I link e le recensioni del secondario verranno spostati al primario.
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Creator Primario</label>
                  <Select value={primaryCreatorId} onValueChange={setPrimaryCreatorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona creator primario" />
                    </SelectTrigger>
                    <SelectContent>
                      {creators.filter(c => c.status !== 'merged').map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Creator Secondario (da unire)</label>
                  <Select value={secondaryCreatorId} onValueChange={setSecondaryCreatorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona creator da unire" />
                    </SelectTrigger>
                    <SelectContent>
                      {creators.filter(c => c.status !== 'merged' && c.id !== primaryCreatorId).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    L'utente che ha aggiunto il creator secondario riceverà una correzione di -0.80€
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
                  Annulla
                </Button>
                <Button 
                  onClick={handleMergeCreators}
                  disabled={actionLoading === 'merge'}
                >
                  {actionLoading === 'merge' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Merge className="h-4 w-4 mr-2" />
                  )}
                  Unisci Creator
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Tabs */}
          <Tabs defaultValue="creators">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-card border border-border/50 p-1 rounded-xl">
                <TabsTrigger value="creators" className="rounded-lg">
                  <Users className="mr-2 h-4 w-4" />
                  Creator ({pendingCreators.length})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-lg">
                  <FileText className="mr-2 h-4 w-4" />
                  Recensioni ({pendingReviews.length})
                </TabsTrigger>
                <TabsTrigger value="payouts" className="rounded-lg">
                  <Wallet className="mr-2 h-4 w-4" />
                  Payout ({pendingPayouts.length})
                </TabsTrigger>
              </TabsList>
              
              <Button variant="outline" onClick={() => setMergeDialogOpen(true)}>
                <Merge className="mr-2 h-4 w-4" />
                Unisci Duplicati
              </Button>
            </div>

            {/* Creators Tab */}
            <TabsContent value="creators">
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creators.map((creator) => (
                      <TableRow key={creator.id}>
                        <TableCell className="font-medium">{creator.name}</TableCell>
                        <TableCell>{creator.category || '-'}</TableCell>
                        <TableCell>{getStatusBadge(creator.status)}</TableCell>
                        <TableCell>{new Date(creator.created_at).toLocaleDateString('it-IT')}</TableCell>
                        <TableCell className="text-right">
                          {creator.status === 'pending' && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateCreatorStatus(creator.id, 'active')}
                                disabled={actionLoading === creator.id}
                              >
                                {actionLoading === creator.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-400" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateCreatorStatus(creator.id, 'rejected')}
                                disabled={actionLoading === creator.id}
                              >
                                <X className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titolo</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">{review.title}</TableCell>
                        <TableCell>{review.rating}/5</TableCell>
                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                        <TableCell>{new Date(review.created_at).toLocaleDateString('it-IT')}</TableCell>
                        <TableCell className="text-right">
                          {review.status === 'pending' && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateReviewStatus(review.id, 'approved')}
                                disabled={actionLoading === review.id}
                              >
                                {actionLoading === review.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-400" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateReviewStatus(review.id, 'rejected')}
                                disabled={actionLoading === review.id}
                              >
                                <X className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Payouts Tab */}
            <TabsContent value="payouts">
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utente</TableHead>
                      <TableHead>Importo</TableHead>
                      <TableHead>Metodo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">{payout.user_id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-bold">€{payout.amount.toFixed(2)}</TableCell>
                        <TableCell>{payout.payment_method || '-'}</TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell>{new Date(payout.created_at).toLocaleDateString('it-IT')}</TableCell>
                        <TableCell className="text-right">
                          {payout.status === 'pending' && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updatePayoutStatus(payout.id, 'approved')}
                                disabled={actionLoading === payout.id}
                              >
                                <Check className="h-4 w-4 text-green-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updatePayoutStatus(payout.id, 'rejected')}
                                disabled={actionLoading === payout.id}
                              >
                                <X className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                          )}
                          {payout.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updatePayoutStatus(payout.id, 'paid')}
                              disabled={actionLoading === payout.id}
                            >
                              {actionLoading === payout.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Euro className="h-4 w-4 mr-1" />
                                  Segna pagato
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPage;
