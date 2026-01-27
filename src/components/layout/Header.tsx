import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Menu, X, User, Shield, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { AddCreatorForm } from '@/components/creators/AddCreatorForm';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export const Header = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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
              {t('nav.discoverCreators')}
            </Link>
            <Link 
              to="/creators?category=Fitness%20%26%20Lifestyle" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.categories')}
            </Link>
            <Link 
              to="/creators?sort=rating" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.topRated')}
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('common.search') + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                    navigate(`/creators?search=${encodeURIComponent(searchQuery)}`);
                  }
                }}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            
            {user ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <User className="h-4 w-4" />
                      {profile?.username || 'Account'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="h-4 w-4 mr-2" />
                      {t('nav.profile')}
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="h-4 w-4 mr-2" />
                        {t('nav.adminDashboard')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AddCreatorForm />
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/auth')}>
                  <User className="h-4 w-4 mr-2" />
                  {t('nav.login')}
                </Button>
                <AddCreatorForm />
              </>
            )}
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
                  placeholder={t('common.search') + '...'}
                  className="pl-10 bg-secondary/50"
                />
              </div>
              <nav className="flex flex-col gap-2">
                <Link 
                  to="/creators" 
                  className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.discoverCreators')}
                </Link>
                <Link 
                  to="/creators?category=Fitness%20%26%20Lifestyle" 
                  className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.categories')}
                </Link>
                <Link 
                  to="/creators?sort=rating" 
                  className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.topRated')}
                </Link>
                {user && (
                  <>
                    <Link 
                      to="/profile" 
                      className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('nav.profile')}
                    </Link>
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t('nav.adminDashboard')}
                      </Link>
                    )}
                  </>
                )}
              </nav>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <LanguageSwitcher />
                {user ? (
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.logout')}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => { navigate('/auth'); setIsMenuOpen(false); }}>
                    <User className="h-4 w-4 mr-2" />
                    {t('nav.login')}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};
