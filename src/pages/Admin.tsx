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
  AlertCircle,
  Loader2,
  Euro,
  Settings,
  Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EditCreatorDialog } from '@/components/admin/EditCreatorDialog';

interface Creator {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  status: string;
  category: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
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

interface SettingsData {
  min_payout_amount: string;
  creator_bonus: string;
  review_reward: string;
}

const AdminPage = () => {
  const { t } = useTranslation();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [settings, setSettings] = useState<SettingsData>({
    min_payout_amount: '10.00',
    creator_bonus: '1.00',
    review_reward: '0.20'
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [primaryCreatorId, setPrimaryCreatorId] = useState('');
  const [secondaryCreatorId, setSecondaryCreatorId] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
      toast({
        title: t('common.error'),
        description: 'Access denied',
        variant: 'destructive',
      });
    }
  }, [user, isAdmin, authLoading, navigate, toast, t]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return;

      try {
        const { data: creatorsData } = await supabase
          .from('creators')
          .select('*')
          .order('created_at', { ascending: false });
        if (creatorsData) setCreators(creatorsData);

        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });
        if (reviewsData) setReviews(reviewsData);

        const { data: payoutsData } = await supabase
          .from('payout_requests')
          .select('*')
          .order('created_at', { ascending: false });
        if (payoutsData) setPayouts(payoutsData);

        const { data: settingsData } = await supabase
          .from('settings')
          .select('key, value');
        
        if (settingsData) {
          const settingsObj: Record<string, string> = {};
          settingsData.forEach((s: { key: string; value: unknown }) => {
            settingsObj[s.key] = String(s.value).replace(/"/g, '');
          });
          setSettings({
            min_payout_amount: settingsObj.min_payout_amount || '10.00',
            creator_bonus: settingsObj.creator_bonus || '1.00',
            review_reward: settingsObj.review_reward || '0.20'
          });
        }
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
      // Use secure RPC functions with audit logging
      if (status === 'active') {
        const { error } = await supabase.rpc('admin_approve_creator', {
          p_creator_id: creatorId
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('admin_reject_creator', {
          p_creator_id: creatorId
        });
        if (error) throw error;
      }

      setCreators(creators.map(c => c.id === creatorId ? { ...c, status } : c));
      toast({
        title: status === 'active' ? t('admin.approve') : t('admin.reject'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
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
      // Use secure RPC functions with audit logging
      if (status === 'approved') {
        const { error } = await supabase.rpc('admin_approve_review', {
          p_review_id: reviewId
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('admin_reject_review', {
          p_review_id: reviewId
        });
        if (error) throw error;
      }

      setReviews(reviews.map(r => r.id === reviewId ? { ...r, status } : r));
      toast({
        title: status === 'approved' ? t('admin.approve') : t('admin.reject'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
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
        title: t('common.error'),
        description: 'Select two different creators',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading('merge');
    try {
      await supabase
        .from('platform_links')
        .update({ creator_id: primaryCreatorId })
        .eq('creator_id', secondaryCreatorId);

      await supabase
        .from('reviews')
        .update({ creator_id: primaryCreatorId })
        .eq('creator_id', secondaryCreatorId);

      await supabase
        .from('creators')
        .update({ 
          status: 'merged',
          merged_into_id: primaryCreatorId 
        })
        .eq('id', secondaryCreatorId);

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
            description: 'Correction for merged duplicate creator'
          });
      }

      toast({
        title: t('admin.mergeSuccess'),
        description: t('admin.mergeSuccessDesc'),
      });
      
      setMergeDialogOpen(false);
      setPrimaryCreatorId('');
      setSecondaryCreatorId('');
      
      const { data } = await supabase.from('creators').select('*').order('created_at', { ascending: false });
      if (data) setCreators(data);
    } catch (error: any) {
      toast({
        title: t('common.error'),
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
      // Use secure RPC function with audit logging
      const { error } = await supabase.rpc('admin_process_payout', {
        p_payout_id: payoutId,
        p_status: status
      });

      if (error) throw error;

      setPayouts(payouts.map(p => p.id === payoutId ? { ...p, status } : p));
      toast({
        title: status === 'paid' ? t('admin.markPaid') : status === 'approved' ? t('admin.approve') : t('admin.reject'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCreator = async (creatorId: string) => {
    setActionLoading(`delete-${creatorId}`);
    try {
      // Delete related platform_links first
      await supabase.from('platform_links').delete().eq('creator_id', creatorId);
      
      // Delete related reviews
      await supabase.from('reviews').delete().eq('creator_id', creatorId);
      
      // Delete the creator
      const { error } = await supabase.from('creators').delete().eq('id', creatorId);
      if (error) throw error;

      setCreators(creators.filter(c => c.id !== creatorId));
      toast({
        title: 'Creator eliminato',
        description: 'Il creator è stato eliminato con successo',
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const saveSettings = async () => {
    setActionLoading('settings');
    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from('settings')
          .update({ value: value, updated_at: new Date().toISOString(), updated_by: user?.id })
          .eq('key', key);
      }
      
      toast({
        title: t('admin.settingsSaved'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
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
        return <Badge variant="secondary">{t('profile.pending')}</Badge>;
      case 'active':
      case 'approved':
        return <Badge variant="verified">{t('profile.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('profile.rejected')}</Badge>;
      case 'merged':
        return <Badge variant="outline">{t('admin.merged')}</Badge>;
      case 'paid':
        return <Badge variant="gold">{t('profile.paid')}</Badge>;
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
                {t('admin.title')}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {t('admin.subtitle')}
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">{t('admin.pendingCreators')}</span>
              </div>
              <p className="font-display text-2xl font-bold mt-2">{pendingCreators.length}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-accent" />
                <span className="text-muted-foreground">{t('admin.pendingReviews')}</span>
              </div>
              <p className="font-display text-2xl font-bold mt-2">{pendingReviews.length}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-green-400" />
                <span className="text-muted-foreground">{t('admin.pendingPayouts')}</span>
              </div>
              <p className="font-display text-2xl font-bold mt-2">{pendingPayouts.length}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Euro className="h-5 w-5 text-yellow-400" />
                <span className="text-muted-foreground">{t('admin.totalToPay')}</span>
              </div>
              <p className="font-display text-2xl font-bold mt-2">
                €{pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Merge Dialog */}
          <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('admin.mergeTitle')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  {t('admin.mergeDescription')}
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('admin.primaryCreator')}</label>
                  <Select value={primaryCreatorId} onValueChange={setPrimaryCreatorId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.primaryCreator')} />
                    </SelectTrigger>
                    <SelectContent>
                      {creators.filter(c => c.status !== 'merged').map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('admin.secondaryCreator')}</label>
                  <Select value={secondaryCreatorId} onValueChange={setSecondaryCreatorId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.secondaryCreator')} />
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
                    {t('admin.mergeWarning')}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
                  {t('common.cancel')}
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
                  {t('admin.merge')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Tabs */}
          <Tabs defaultValue="creators">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <TabsList className="bg-card border border-border/50 p-1 rounded-xl">
                <TabsTrigger value="creators" className="rounded-lg">
                  <Users className="mr-2 h-4 w-4" />
                  {t('admin.creators')} ({pendingCreators.length})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-lg">
                  <FileText className="mr-2 h-4 w-4" />
                  {t('admin.reviews')} ({pendingReviews.length})
                </TabsTrigger>
                <TabsTrigger value="payouts" className="rounded-lg">
                  <Wallet className="mr-2 h-4 w-4" />
                  {t('admin.payouts')} ({pendingPayouts.length})
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-lg">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('admin.settings')}
                </TabsTrigger>
              </TabsList>
              
              <Button variant="outline" onClick={() => setMergeDialogOpen(true)}>
                <Merge className="mr-2 h-4 w-4" />
                {t('admin.mergeDuplicates')}
              </Button>
            </div>

            {/* Creators Tab */}
            <TabsContent value="creators">
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.name')}</TableHead>
                      <TableHead>{t('admin.category')}</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      <TableHead>{t('admin.date')}</TableHead>
                      <TableHead className="text-right">{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creators.map((creator) => (
                      <TableRow key={creator.id}>
                        <TableCell className="font-medium">{creator.name}</TableCell>
                        <TableCell>{creator.category || '-'}</TableCell>
                        <TableCell>{getStatusBadge(creator.status)}</TableCell>
                        <TableCell>{new Date(creator.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <EditCreatorDialog 
                              creator={creator} 
                              onSuccess={async () => {
                                const { data } = await supabase.from('creators').select('*').order('created_at', { ascending: false });
                                if (data) setCreators(data);
                              }} 
                            />
                            {creator.status === 'pending' && (
                              <>
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
                              </>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={actionLoading === `delete-${creator.id}`}
                                >
                                  {actionLoading === `delete-${creator.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Elimina Creator</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler eliminare <strong>{creator.name}</strong>? 
                                    Questa azione eliminerà anche tutte le recensioni e i link associati. 
                                    L'operazione non può essere annullata.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCreator(creator.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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
                      <TableHead>Title</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      <TableHead>{t('admin.date')}</TableHead>
                      <TableHead className="text-right">{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">{review.title}</TableCell>
                        <TableCell>{review.rating}/5</TableCell>
                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                        <TableCell>{new Date(review.created_at).toLocaleDateString()}</TableCell>
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
                      <TableHead>{t('admin.user')}</TableHead>
                      <TableHead>{t('admin.amount')}</TableHead>
                      <TableHead>{t('admin.method')}</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      <TableHead>{t('admin.date')}</TableHead>
                      <TableHead className="text-right">{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">{payout.user_id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-bold">€{Number(payout.amount).toFixed(2)}</TableCell>
                        <TableCell>{payout.payment_method || '-'}</TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell>{new Date(payout.created_at).toLocaleDateString()}</TableCell>
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
                                  {t('admin.markPaid')}
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

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="bg-card border border-border/50 rounded-xl p-6 max-w-md">
                <h3 className="font-display text-xl font-bold mb-6">{t('admin.settings')}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPayout">{t('admin.minPayoutAmount')} (€)</Label>
                    <Input
                      id="minPayout"
                      type="number"
                      step="0.01"
                      value={settings.min_payout_amount}
                      onChange={(e) => setSettings({ ...settings, min_payout_amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creatorBonus">{t('admin.creatorBonusAmount')} (€)</Label>
                    <Input
                      id="creatorBonus"
                      type="number"
                      step="0.01"
                      value={settings.creator_bonus}
                      onChange={(e) => setSettings({ ...settings, creator_bonus: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reviewReward">{t('admin.reviewRewardAmount')} (€)</Label>
                    <Input
                      id="reviewReward"
                      type="number"
                      step="0.01"
                      value={settings.review_reward}
                      onChange={(e) => setSettings({ ...settings, review_reward: e.target.value })}
                    />
                  </div>
                  <Button 
                    onClick={saveSettings}
                    disabled={actionLoading === 'settings'}
                    className="w-full"
                  >
                    {actionLoading === 'settings' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {t('admin.saveSettings')}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPage;
