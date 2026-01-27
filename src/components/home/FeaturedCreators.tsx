import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreatorCard } from '@/components/creators/CreatorCard';
import { mockCreators } from '@/lib/mockData';
import { Button } from '@/components/ui/button';

export const FeaturedCreators = () => {
  const featuredCreators = mockCreators.slice(0, 6);

  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-primary font-medium"
            >
              I Migliori del Momento
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2"
            >
              Creator in Evidenza
            </motion.h2>
          </div>
          <Link to="/creators">
            <Button variant="ghost" className="hidden md:flex">
              Vedi Tutti
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCreators.map((creator, index) => (
            <CreatorCard key={creator.id} creator={creator} index={index} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Link to="/creators">
            <Button variant="outline">
              Vedi Tutti i Creator
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
