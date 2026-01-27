import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categories } from '@/lib/mockData';

const categoryIcons: Record<string, string> = {
  'Fitness & Lifestyle': '💪',
  'Cosplay & Gaming': '🎮',
  'Modeling': '📸',
  'Dance & Performance': '💃',
  'Art & Photography': '🎨',
  'ASMR & Audio': '🎧',
  'Couples': '💑',
  'Alternative & Tattoo': '🖤',
};

export const CategoriesSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-medium"
          >
            Esplora per Categoria
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2"
          >
            Trova il Tuo Tipo Preferito
          </motion.h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03 }}
            >
              <Link
                to={`/creators?category=${encodeURIComponent(category)}`}
                className="group block p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-glow transition-all duration-300"
              >
                <div className="text-4xl mb-4">{categoryIcons[category]}</div>
                <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                  {category}
                </h3>
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  Esplora
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
