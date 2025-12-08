import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Radio, Eye, EyeOff, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Connexion réussie');
        navigate('/dashboard');
      } else {
        toast.error('Email ou mot de passe incorrect');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 to-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <Radio className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">GeoTrack</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            Plateforme de<br />
            Géolocalisation<br />
            Professionnelle
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Surveillez votre flotte en temps réel, optimisez vos opérations et sécurisez vos véhicules avec notre solution GPS avancée.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div>
            <p className="text-3xl font-bold text-primary-foreground">500+</p>
            <p className="text-primary-foreground/70 text-sm">Véhicules suivis</p>
          </div>
          <div className="w-px h-12 bg-primary-foreground/30" />
          <div>
            <p className="text-3xl font-bold text-primary-foreground">50+</p>
            <p className="text-primary-foreground/70 text-sm">Entreprises</p>
          </div>
          <div className="w-px h-12 bg-primary-foreground/30" />
          <div>
            <p className="text-3xl font-bold text-primary-foreground">99.9%</p>
            <p className="text-primary-foreground/70 text-sm">Disponibilité</p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Radio className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">GeoTrack</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Connexion</h2>
            <p className="text-muted-foreground mt-2">
              Accédez à votre espace de suivi
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Comptes de démonstration :
            </p>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between p-2 bg-secondary/50 rounded-lg">
                <span>Admin:</span>
                <span className="font-mono">admin@geotrack.dz / demo123</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary/50 rounded-lg">
                <span>Opérateur:</span>
                <span className="font-mono">operator@translogistics.dz / demo123</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary/50 rounded-lg">
                <span>Superviseur:</span>
                <span className="font-mono">supervisor@gn.dz / demo123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
