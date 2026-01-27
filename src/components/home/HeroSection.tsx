import { motion } from 'framer-motion';
import { Search, Star, Users, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-8"
          >
            <Star className="h-4 w-4 text-accent fill-accent" />
            <span className="text-sm text-muted-foreground">
              La piattaforma #1 per recensioni di content creator
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="text-foreground">Scopri i Migliori</span>
            <br />
            <span className="text-gradient-primary">Content Creator</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Leggi recensioni autentiche, confronta creator e trova esattamente quello che cerchi.
            La community più affidabile per le tue scelte.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto mb-10"
          >
            <div className="relative flex gap-2 p-2 bg-card border border-border rounded-2xl shadow-elevated">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cerca per nome, categoria o piattaforma..."
                  className="pl-12 h-12 bg-transparent border-0 focus-visible:ring-0 text-base"
                />
              </div>
              <Button variant="hero" size="lg">
                Cerca
              </Button>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mb-16"
          >
            <span className="text-muted-foreground">Popolari:</span>
            {['Fitness', 'Cosplay', 'Modeling', 'ASMR', 'Couples'].map((tag) => (
              <Link
                key={tag}
                to={`/creators?category=${tag}`}
                className="px-3 py-1 rounded-full bg-secondary/50 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                {tag}
              </Link>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { icon: Users, value: '10K+', label: 'Creator Verificati' },
              { icon: Star, value: '50K+', label: 'Recensioni' },
              { icon: TrendingUp, value: '1M+', label: 'Visite Mensili' },
              { icon: Award, value: '99%', label: 'Utenti Soddisfatti' },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-card/50 border border-border/50"
              >
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
