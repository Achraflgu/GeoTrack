import { ReactNode } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Radio, ChevronRight, X, BookOpen, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIChatWidget from '@/components/dashboard/AIChatWidget';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isDemoUser = user?.email === 'demo@geotrack.tn';
  const isInIframe = window.self !== window.top;

  const handleExitDemo = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Banner */}
      {isDemoUser && !isInIframe && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-orange-500 z-[60] flex items-center justify-between px-4 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600/50 flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm">Mode Démonstration Interactive</div>
              <div className="text-xs text-orange-100 hidden sm:block">Données fictives • Lecture seule • <Lock className="w-3 h-3 inline" /> Actions restreintes</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20 border-white/20 font-semibold rounded-full px-4 text-xs h-8 gap-1.5"
              onClick={() => {
                logout();
                navigate('/guide');
              }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guide
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700 border-none font-bold rounded-full px-4 text-xs h-8"
              onClick={() => {
                logout();
                window.dispatchEvent(new CustomEvent('open-join-popup'));
              }}
            >
              Rejoindre Nous
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
            <button
              onClick={handleExitDemo}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-orange-600 transition-colors ml-2"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      <div className={cn("transition-all duration-300", (isDemoUser && !isInIframe) ? "pt-14" : "")}>
        <Sidebar />
        <main className="ml-16 md:ml-64 min-h-screen transition-all duration-300">
          {children}
        </main>
        <AIChatWidget />
      </div>
    </div>
  );
};

export default DashboardLayout;
