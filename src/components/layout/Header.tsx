import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Menu, X, Globe, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="font-display text-2xl font-bold"
            >
              <span className="text-gradient-primary">Only</span>
              <span className="text-foreground">Advisor</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/creators" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Scopri Creator
            </Link>
            <Link 
              to="/categories" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Categorie
            </Link>
            <Link 
              to="/top-rated" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Top Rated
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cerca creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Globe className="h-5 w-5" />
            </Button>
            <Button variant="outline">
              <User className="h-4 w-4 mr-2" />
              Accedi
            </Button>
            <Button variant="hero">
              Aggiungi Creator
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-border/50"
          >
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cerca creator..."
                  className="pl-10 bg-secondary/50"
                />
              </div>
              <nav className="flex flex-col gap-2">
                <Link 
                  to="/creators" 
                  className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                >
                  Scopri Creator
                </Link>
                <Link 
                  to="/categories" 
                  className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                >
                  Categorie
                </Link>
                <Link 
                  to="/top-rated" 
                  className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                >
                  Top Rated
                </Link>
              </nav>
              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                <Button variant="outline" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Accedi
                </Button>
                <Button variant="hero" className="w-full">
                  Aggiungi Creator
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};
