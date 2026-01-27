import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="font-display text-2xl font-bold">
              <span className="text-gradient-primary">Only</span>
              <span className="text-foreground">Advisor</span>
            </div>
            <p className="text-muted-foreground text-sm">
              La piattaforma di recensioni per content creator più affidabile. 
              Trova i migliori creator e condividi la tua esperienza.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-foreground">Esplora</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/creators" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Tutti i Creator
              </Link>
              <Link to="/categories" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Categorie
              </Link>
              <Link to="/top-rated" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Top Rated
              </Link>
              <Link to="/new" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Nuovi Arrivi
              </Link>
            </nav>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-foreground">Community</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/add-creator" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Aggiungi Creator
              </Link>
              <Link to="/write-review" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Scrivi Recensione
              </Link>
              <Link to="/rewards" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Programma Rewards
              </Link>
              <Link to="/guidelines" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Linee Guida
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-foreground">Legale</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Termini di Servizio
              </Link>
              <Link to="/cookies" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Cookie Policy
              </Link>
              <Link to="/dmca" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                DMCA
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 OnlyAdvisor. Tutti i diritti riservati.
          </p>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            Fatto con <Heart className="h-4 w-4 text-primary fill-primary" /> per la community
          </p>
        </div>
      </div>
    </footer>
  );
};
