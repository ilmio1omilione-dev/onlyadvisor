import { motion } from 'framer-motion';
import { DollarSign, Star, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const RewardsSection = () => {
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

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-accent/20 to-primary/20 rounded-3xl p-8 border border-border/50">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-accent rounded-2xl rotate-12 flex items-center justify-center shadow-elevated">
                  <DollarSign className="h-10 w-10 text-accent-foreground" />
                </div>
                
                <div className="space-y-6">
                  <div className="p-4 bg-card rounded-xl border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Il tuo saldo</div>
                    <div className="font-display text-3xl font-bold text-foreground">€47.80</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Creator aggiunti</span>
                      <span className="font-semibold text-foreground">23</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Recensioni scritte</span>
                      <span className="font-semibold text-foreground">89</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">In attesa di verifica</span>
                      <span className="font-semibold text-accent">€5.40</span>
                    </div>
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
