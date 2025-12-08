import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Radio, MapPin, Shield, Truck, Building2, ChevronRight, Zap, Globe, Lock } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Radio className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">GeoTrack</span>
          </div>
          <Link to="/login">
            <Button variant="hero">
              Accéder à la plateforme
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[0.02]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <Zap className="w-4 h-4" />
              Plateforme de géolocalisation professionnelle
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Suivez votre flotte en
              <span className="gradient-text"> temps réel</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Solution complète de géolocalisation GPS pour les entreprises. 
              Surveillez, optimisez et sécurisez vos opérations de terrain.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link to="/login">
                <Button variant="hero" size="xl">
                  Commencer maintenant
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="xl">
                En savoir plus
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Une solution complète</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gérer et surveiller votre flotte de véhicules
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: 'Suivi en temps réel',
                description: 'Visualisez la position de tous vos véhicules sur une carte interactive avec mises à jour instantanées.',
              },
              {
                icon: Building2,
                title: 'Gestion multi-entreprises',
                description: 'Gérez plusieurs flottes d\'entreprises depuis une seule plateforme centralisée.',
              },
              {
                icon: Shield,
                title: 'Sécurité renforcée',
                description: 'Accès sécurisé avec rôles et permissions personnalisés pour chaque utilisateur.',
              },
              {
                icon: Truck,
                title: 'Historique complet',
                description: 'Consultez l\'historique des déplacements et générez des rapports détaillés.',
              },
              {
                icon: Globe,
                title: 'Couverture nationale',
                description: 'Suivez vos véhicules partout sur le territoire avec une précision optimale.',
              },
              {
                icon: Lock,
                title: 'Accès superviseur',
                description: 'Interface dédiée pour les autorités avec vue d\'ensemble sur tous les appareils.',
              },
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="glass-card p-6 space-y-4 hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="glass-card p-12 rounded-2xl">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { value: '500+', label: 'Véhicules suivis' },
                { value: '50+', label: 'Entreprises clientes' },
                { value: '99.9%', label: 'Disponibilité' },
                { value: '24/7', label: 'Support technique' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-4xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-muted-foreground mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold">Prêt à commencer ?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Contactez-nous pour une démonstration personnalisée de notre plateforme de géolocalisation.
          </p>
          <Link to="/login">
            <Button variant="hero" size="xl">
              Accéder à la plateforme
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="container mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <span>GeoTrack © 2024</span>
          </div>
          <p>Plateforme de géolocalisation professionnelle</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
