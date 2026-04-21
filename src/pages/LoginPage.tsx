import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Radio, Eye, EyeOff, Loader2, ArrowLeft, MapPin, Satellite, Car, Dog, Baby, Wifi, Bike, Shield, Navigation } from 'lucide-react';
import EmailVerificationModal from '@/components/modals/EmailVerificationModal';
import FloatingIcons from '@/components/FloatingIcons';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [modalMode, setModalMode] = useState<'setup' | 'reset'>('setup');
  const [pendingEmail, setPendingEmail] = useState('');
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [view, setView] = useState<'login' | 'forgot_password'>('login');
  const [forgotEmail, setForgotPasswordEmail] = useState('');
  const { login, completeVerification, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.needsVerification) {
          // Show verification modal
          setPendingEmail(result.email || email);
          setNeedsPasswordSetup(!!result.needsPasswordSetup);
          setEmailVerified(!!result.emailVerified);
          setModalMode('setup');
          setShowVerificationModal(true);

          if (result.needsVerification && !result.emailVerified) {
            toast.info('Vérification requise', {
              description: 'Un code de vérification a été envoyé à votre email'
            });
          } else if (result.needsPasswordSetup) {
            toast.info('Configuration requise', {
              description: 'Veuillez changer votre mot de passe temporaire'
            });
          }
        } else {
          toast.success('Connexion réussie');
          navigate('/dashboard');
        }
      } else {
        toast.error('Email ou mot de passe incorrect');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    setShowVerificationModal(false);
    if (modalMode === 'reset') {
      setView('login');
      return;
    }
    completeVerification();
    toast.success('Email vérifié! Connexion réussie');
    navigate('/dashboard');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: forgotEmail });
      
      // Open modal only if successful
      setPendingEmail(forgotEmail);
      setModalMode('reset');
      setEmailVerified(false);
      setShowVerificationModal(true);
      toast.success('Code envoyé!', {
        description: `Vérifiez votre boîte mail: ${forgotEmail}`
      });
    } catch (error: any) {
      toast.error('Erreur', { description: error.message || 'Email introuvable' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0A0D14] to-[#121620] flex-col justify-between p-12 relative overflow-hidden">
        {/* Floating GPS icons background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { Icon: MapPin, size: 28, x: '10%', y: '15%', delay: '0s', dur: '7s', op: 0.15 },
            { Icon: Satellite, size: 22, x: '80%', y: '10%', delay: '1.2s', dur: '9s', op: 0.12 },
            { Icon: Car, size: 24, x: '75%', y: '40%', delay: '0.5s', dur: '6s', op: 0.10 },
            { Icon: Dog, size: 18, x: '15%', y: '50%', delay: '2s', dur: '8s', op: 0.13 },
            { Icon: Baby, size: 16, x: '85%', y: '65%', delay: '3s', dur: '7.5s', op: 0.10 },
            { Icon: Shield, size: 20, x: '25%', y: '75%', delay: '1.5s', dur: '6.5s', op: 0.12 },
            { Icon: Navigation, size: 18, x: '60%', y: '25%', delay: '4s', dur: '8.5s', op: 0.10 },
            { Icon: Wifi, size: 22, x: '40%', y: '85%', delay: '0.8s', dur: '7s', op: 0.13 },
            { Icon: Bike, size: 20, x: '90%', y: '85%', delay: '2.5s', dur: '9s', op: 0.10 },
          ].map((item, i) => (
            <div key={i} className="absolute text-[#00E599] drop-shadow-[0_0_10px_rgba(0,229,153,0.3)]" style={{ left: item.x, top: item.y, opacity: item.op * 2, animation: `geoFloat${i % 4} ${item.dur} ease-in-out ${item.delay} infinite` }}>
              <item.Icon size={item.size} />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#00E599]/20 backdrop-blur-sm flex items-center justify-center">
              <Radio className="w-6 h-6 text-[#00E599]" />
            </div>
            <span className="text-2xl font-bold text-white">GeoTrack</span>
          </div>
        </div>

        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10" />

        <Link to="/" className="relative z-10 block group hover:opacity-90 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#00E599]/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#00E599]/30 transition-colors">
              <Radio className="w-6 h-6 text-[#00E599]" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">GeoTrack</span>
          </div>
        </Link>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Plateforme de<br />
            Géolocalisation<br />
            <span className="text-[#00E599]">Professionnelle</span>
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Véhicules, personnes, animaux, objets — suivez tout en temps réel avec notre solution GPS avancée.
          </p>

          {/* Use-case badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['🚗 Véhicules', '👤 Personnes', '🐕 Animaux', '👶 Enfants', '🎒 Objets'].map((badge, i) => (
              <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/70">
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div>
            <p className="text-3xl font-bold text-white">500+</p>
            <p className="text-white/50 text-sm">Appareils suivis</p>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div>
            <p className="text-3xl font-bold text-white">50+</p>
            <p className="text-white/50 text-sm">Entreprises</p>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div>
            <p className="text-3xl font-bold text-white">99.9%</p>
            <p className="text-white/50 text-sm">Disponibilité</p>
          </div>
        </div>

        {/* Keyframes for this page */}
        <style>{`
          @keyframes geoFloat0 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 25% { transform: translateY(-18px) rotate(5deg); } 50% { transform: translateY(-8px) rotate(-3deg); } 75% { transform: translateY(-22px) rotate(7deg); } }
          @keyframes geoFloat1 { 0%, 100% { transform: translateY(0px) translateX(0px); } 33% { transform: translateY(-14px) translateX(8px); } 66% { transform: translateY(-24px) translateX(-6px); } }
          @keyframes geoFloat2 { 0%, 100% { transform: translateY(0px) scale(1); } 25% { transform: translateY(-16px) scale(1.15); } 50% { transform: translateY(-6px) scale(0.9); } 75% { transform: translateY(-20px) scale(1.08); } }
          @keyframes geoFloat3 { 0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); } 20% { transform: translateY(-12px) translateX(-10px) rotate(-8deg); } 40% { transform: translateY(-20px) translateX(5px) rotate(4deg); } 60% { transform: translateY(-8px) translateX(12px) rotate(-3deg); } 80% { transform: translateY(-16px) translateX(-6px) rotate(6deg); } }
        `}</style>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -left-2 lg:-left-12 lg:-top-2 lg:flex text-muted-foreground hover:text-foreground hidden"
              onClick={() => {
                if (view === 'forgot_password') { setView('login'); return; }
                navigate('/');
              }}
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="lg:hidden flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground -ml-2"
                onClick={() => {
                  if (view === 'forgot_password') { setView('login'); return; }
                  navigate('/');
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Radio className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">GeoTrack</span>
              </div>

              {/* Empty placeholder for flex alignment */}
              <div className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-bold text-foreground">
              {view === 'login' ? 'Connexion' : 'Mot de passe oublié'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {view === 'login' ? 'Accédez à votre espace de suivi' : 'Recevez un code de sécurité à 6 chiffres pour réinitialiser votre mot de passe'}
            </p>
          </div>

          {view === 'login' ? (
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <button type="button" onClick={() => setView('forgot_password')} className="text-xs text-primary hover:underline font-medium">Mot de passe oublié ?</button>
              </div>
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
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email enregistré</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Envoyer le code'
                )}
              </Button>
            </form>
          )}


        </div>
      </div>

      {/* Email Verification / Password Reset Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        email={pendingEmail}
        onVerified={handleVerificationComplete}
        initialStep={emailVerified ? 'password' : 'verify'}
        mode={modalMode}
        autoSendCode={modalMode === 'setup'} // Do not auto-send for reset since we already sent it
      />
    </div>
  );
};

export default LoginPage;
