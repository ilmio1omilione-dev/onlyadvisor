import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Euro, AlertCircle, Loader2, Check } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useTranslation } from 'react-i18next';

interface PayoutRequestFormProps {
  availableBalance: number;
  minPayoutAmount: number;
  onSuccess?: () => void;
}

export const PayoutRequestForm = ({ 
  availableBalance, 
  minPayoutAmount,
  onSuccess 
}: PayoutRequestFormProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [amount, setAmount] = useState(availableBalance.toString());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const canRequestPayout = availableBalance >= minPayoutAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!user) return;

    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrors({ amount: 'Importo non valido' });
      return;
    }

    if (numAmount > availableBalance) {
      setErrors({ amount: t('profile.insufficientBalance') });
      return;
    }

    if (numAmount < minPayoutAmount) {
      setErrors({ amount: t('profile.minPayout', { amount: minPayoutAmount.toFixed(2) }) });
      return;
    }

    if (!paymentMethod.trim()) {
      setErrors({ paymentMethod: 'Metodo di pagamento richiesto' });
      return;
    }

    if (!paymentDetails.trim()) {
      setErrors({ paymentDetails: 'Dettagli pagamento richiesti' });
      return;
    }

    setLoading(true);

    try {
      // Use atomic RPC function to prevent race conditions
      const { data, error: rpcError } = await supabase.rpc('request_payout', {
        p_amount: numAmount,
        p_payment_method: paymentMethod,
        p_payment_details: { details: paymentDetails }
      });

      if (rpcError) {
        // Handle specific error messages
        if (rpcError.message.includes('Insufficient balance')) {
          setErrors({ amount: t('profile.insufficientBalance') });
          return;
        }
        throw rpcError;
      }

      toast({
        title: t('profile.payoutRequested'),
        description: t('profile.payoutRequestedDesc'),
      });

      await refreshProfile();
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error requesting payout:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="hero" 
          size="lg" 
          disabled={!canRequestPayout}
          className="w-full"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {t('profile.requestPayout')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Euro className="h-6 w-6 text-accent" />
            {t('profile.requestPayout')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t('profile.payoutAmount')}</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={minPayoutAmount}
                max={availableBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('profile.minPayout', { amount: minPayoutAmount.toFixed(2) })} • 
              Disponibile: €{availableBalance.toFixed(2)}
            </p>
            {errors.amount && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">{t('profile.payoutMethod')}</Label>
            <Input
              id="paymentMethod"
              placeholder={t('profile.payoutMethodPlaceholder')}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            {errors.paymentMethod && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.paymentMethod}
              </p>
            )}
          </div>

          {/* Payment Details */}
          <div className="space-y-2">
            <Label htmlFor="paymentDetails">{t('profile.payoutDetails')}</Label>
            <Input
              id="paymentDetails"
              placeholder={t('profile.payoutDetailsPlaceholder')}
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
            />
            {errors.paymentDetails && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.paymentDetails}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            variant="hero" 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {t('profile.requestPayout')}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
