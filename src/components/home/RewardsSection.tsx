import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Star, Shield, Users, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CREATOR_BONUS = 1.0;
const REVIEW_REWARD = 0.2;

export const RewardsSection = () => {
  const [creatorsCount, setCreatorsCount] = useState(10);
  const [reviewsCount, setReviewsCount] = useState(50);

  const creatorsEarnings = creatorsCount * CREATOR_BONUS;
  const reviewsEarnings = reviewsCount * REVIEW_REWARD;
  const totalEarnings = creatorsEarnings + reviewsEarnings;

  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-accent font-medium"
              >
                Programma Rewards
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4"
              >
                Guadagna Contribuendo
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground mb-6"
              >
                Aiuta a far crescere la community e vieni ricompensato. 
                Aggiungi nuovi creator, scrivi recensioni e accumula crediti.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="space-y-4 mb-8"
              >
                {[
                  { icon: Users, text: '+€1.00 per ogni nuovo creator verificato', color: 'text-green-500' },
                  { icon: Star, text: '+€0.20 per ogni recensione approvata', color: 'text-accent' },
                  { icon: Shield, text: 'Sistema anti-frode avanzato', color: 'text-primary' },
                  { icon: DollarSign, text: 'Pagamenti veloci e sicuri', color: 'text-green-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-secondary ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <Button variant="gold" size="lg">
                  Inizia a Guadagnare
                </Button>
              </motion.div>
            </div>

            {/* Calculator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-accent/20 to-primary/20 rounded-3xl p-8 border border-border/50">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-accent rounded-2xl rotate-12 flex items-center justify-center shadow-elevated">
                  <Calculator className="h-10 w-10 text-accent-foreground" />
                </div>
                
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                      Calcola i tuoi guadagni
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Scopri quanto potresti guadagnare
                    </p>
                  </div>

                  {/* Creator Input */}
                  <div className="space-y-2">
                    <Label htmlFor="creators" className="text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      Creator aggiunti
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="creators"
                        type="number"
                        min={0}
                        max={1000}
                        value={creatorsCount}
                        onChange={(e) => setCreatorsCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="bg-card border-border/50"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        × €{CREATOR_BONUS.toFixed(2)} = <span className="font-semibold text-green-500">€{creatorsEarnings.toFixed(2)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Reviews Input */}
                  <div className="space-y-2">
                    <Label htmlFor="reviews" className="text-foreground flex items-center gap-2">
                      <Star className="h-4 w-4 text-accent" />
                      Recensioni scritte
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="reviews"
                        type="number"
                        min={0}
                        max={10000}
                        value={reviewsCount}
                        onChange={(e) => setReviewsCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="bg-card border-border/50"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        × €{REVIEW_REWARD.toFixed(2)} = <span className="font-semibold text-accent">€{reviewsEarnings.toFixed(2)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="p-4 bg-card rounded-xl border border-border/50 mt-6">
                    <div className="text-sm text-muted-foreground mb-1">Guadagno potenziale totale</div>
                    <motion.div 
                      key={totalEarnings}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="font-display text-4xl font-bold text-foreground"
                    >
                      €{totalEarnings.toFixed(2)}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
