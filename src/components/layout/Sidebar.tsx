import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Radio,
  Bell,
  User,
  FileText,
  MessageSquare,
  ShoppingCart,
  Sun,
  Moon,
  Languages,
  Hexagon,
  CreditCard,
  Crown,
  Mail
} from 'lucide-react';
import AynTraceLogo from '@/components/brand/AynTraceLogo';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useI18n();

  const userPlan = (user as any)?.plan || 'starter';

  const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { to: '/map', icon: MapPin, label: t('sidebar.map') },
    { to: '/geofences', icon: Hexagon, label: t('sidebar.geofences') },
    { to: '/devices', icon: Radio, label: t('sidebar.allDevices') },
    { to: '/enterprises', icon: Building2, label: t('sidebar.enterprises') },
    { to: '/users', icon: Users, label: t('sidebar.users') },
    { to: '/alerts', icon: Bell, label: t('sidebar.alerts') },
    { to: '/support', icon: MessageSquare, label: t('sidebar.support') },
    { to: '/admin/orders', icon: ShoppingCart, label: 'Commandes' },
    { to: '/admin/logs', icon: FileText, label: t('sidebar.audit') },
    { to: '/settings', icon: Settings, label: t('sidebar.settings') },
  ];

  const operatorStarterLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { to: '/map', icon: MapPin, label: t('sidebar.map') },
    { to: '/devices', icon: Radio, label: t('sidebar.devices') },
    { to: '/alerts', icon: Bell, label: t('sidebar.alerts') },
    { to: '/support', icon: MessageSquare, label: t('sidebar.support') },
    { to: '/billing', icon: CreditCard, label: lang === 'fr' ? 'Facturation' : 'Billing' },
    { to: '/settings', icon: Settings, label: t('sidebar.settings') },
  ];

  const operatorProLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { to: '/map', icon: MapPin, label: t('sidebar.map') },
    { to: '/geofences', icon: Hexagon, label: t('sidebar.geofences') },
    { to: '/devices', icon: Radio, label: t('sidebar.devices') },
    { to: '/alerts', icon: Bell, label: t('sidebar.alerts') },
    { to: '/support', icon: MessageSquare, label: t('sidebar.support') },
    { to: '/billing', icon: CreditCard, label: lang === 'fr' ? 'Facturation' : 'Billing' },
    { to: '/settings', icon: Settings, label: t('sidebar.settings') },
  ];

  const supervisorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.overview') },
    { to: '/map', icon: MapPin, label: t('sidebar.surveillance') },
    { to: '/geofences', icon: Hexagon, label: t('sidebar.geofences') },
    { to: '/devices', icon: Radio, label: t('sidebar.allDevices') },
    { to: '/enterprises', icon: Building2, label: t('sidebar.enterprises') },
    { to: '/alerts', icon: Bell, label: t('sidebar.alerts') },
    { to: '/support', icon: MessageSquare, label: t('sidebar.support') },
  ];

  const getLinks = () => {
    switch (user?.role) {
      case 'admin':
        return adminLinks;
      case 'operator':
        return (userPlan === 'pro' || userPlan === 'enterprise') ? operatorProLinks : operatorStarterLinks;
      case 'supervisor':
        return supervisorLinks;
      default:
        return [];
    }
  };

  const links = getLinks();

  const planBadge = null; // Removing old basic badge to replace with premium banner

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className={cn("h-16 flex items-center border-b border-sidebar-border", collapsed ? "justify-center" : "justify-between px-4")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sidebar-foreground">GeoTrack</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed ? "h-10 w-10 mx-auto" : "h-8 w-8 shrink-0"
          )}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* User info */}
      {!collapsed && user && (
        <Link
          to="/profile"
          className="block p-4 border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-all duration-300 group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_rgba(0,229,153,0.3)] transition-all duration-300">
              <Shield className="w-5 h-5 text-sidebar-primary group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate group-hover:text-primary transition-colors duration-300">
                {user.name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {user.role === 'admin' ? 'Administrateur' :
                  user.role === 'operator' ? 'Opérateur' : 'Superviseur'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-sidebar-foreground/30 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </Link>
      )}

      {/* Plan Badge */}
      {planBadge}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {links.map((link, index) => {
            const isMap = link.to === '/map';
            const holdsGeofences = links[index + 1]?.to === '/geofences';
            const isActionZoneStart = isMap && holdsGeofences;

            return (
              <div key={link.to} className="relative group/nav z-10">
                {isActionZoneStart && !collapsed && (
                  <div className="absolute left-[33px] top-[40px] w-[2px] h-[24px] bg-gradient-to-b from-sidebar-primary/80 to-sidebar-primary/20 shadow-[0_0_8px_rgba(0,229,153,0.5)] rounded-full -z-10" />
                )}
                <Link
                  to={link.to}
                  className={cn(
                    "sidebar-nav-item",
                    location.pathname === link.to && "active",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <link.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Premium Plan Banners (Only for Operators) */}
        {user?.role === 'operator' && (
          <div className="mt-8 px-4 pb-4">
            {!collapsed ? (
              userPlan === 'starter' ? (
                // Starter -> Upgrade Banner
                <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-orange-500/5 p-4 text-center group transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/20 blur-2xl rounded-full group-hover:bg-amber-500/30 transition-all duration-500" />
                  <Crown className="w-7 h-7 text-amber-500 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse" />
                  <h4 className="text-sm font-bold text-sidebar-foreground mb-0.5">{lang === 'fr' ? 'Passez au Pro' : 'Upgrade to Pro'}</h4>
                  <p className="text-[10px] text-sidebar-foreground/70 mb-3">{lang === 'fr' ? 'Débloquez toutes les options' : 'Unlock all features'}</p>
                  <Link to="/billing">
                    <Button size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold border-0 shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 text-xs h-8">
                      {lang === 'fr' ? 'Gérer' : 'Upgrade'}
                    </Button>
                  </Link>
                </div>
              ) : (
                // Pro -> Premium Identity Banner
                <div className="relative overflow-hidden rounded-xl border border-[#00E599]/30 bg-gradient-to-b from-[#00E599]/10 to-emerald-500/5 p-4 text-center group transition-all hover:border-[#00E599]/50 hover:shadow-lg hover:shadow-[#00E599]/10">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#00E599]/20 blur-2xl rounded-full group-hover:bg-[#00E599]/30 transition-all duration-500" />
                  <Hexagon className="w-7 h-7 text-[#00E599] mx-auto mb-2 drop-shadow-[0_0_8px_rgba(0,229,153,0.5)]" />
                  <h4 className="text-sm font-bold text-sidebar-foreground mb-0.5 bg-gradient-to-r from-[#00E599] to-emerald-500 bg-clip-text text-transparent">{lang === 'fr' ? 'Membre Pro' : 'Pro Member'}</h4>
                  <p className="text-[10px] text-sidebar-foreground/70 mb-3">{lang === 'fr' ? 'Toutes options actives' : 'All features active'}</p>
                  <Link to="/billing">
                    <Button variant="outline" size="sm" className="w-full border-[#00E599]/30 text-[#00E599] hover:bg-[#00E599]/10 text-xs h-8 font-bold transition-all">
                      {lang === 'fr' ? 'Abonnement' : 'Subscription'}
                    </Button>
                  </Link>
                </div>
              )
            ) : (
              // Collapsed Icons
              <Link to="/billing" title={userPlan === 'starter' ? 'Upgrade to Pro' : 'Pro Member'}>
                <div className={cn("mx-auto flex h-10 w-10 mt-4 rounded-xl items-center justify-center border transition-all hover:scale-110",
                  userPlan === 'starter' ? "border-amber-500/40 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "border-[#00E599]/40 bg-[#00E599]/10 shadow-[0_0_15px_rgba(0,229,153,0.2)]")}>
                  {userPlan === 'starter' ? <Crown className="w-5 h-5 text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" /> : <Hexagon className="w-5 h-5 text-[#00E599] drop-shadow-[0_0_5px_rgba(0,229,153,0.5)]" />}
                </div>
              </Link>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer with toggles */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar-background/80 backdrop-blur-md flex flex-col gap-3">
        {/* Language & Theme toggles */}
        {!collapsed ? (
          <div className="flex bg-sidebar-accent/30 rounded-xl p-1 ring-1 ring-border/50 relative">
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-1 justify-center text-xs font-semibold relative z-10", lang === 'fr' ? 'text-sidebar-foreground bg-sidebar-accent shadow-sm' : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50')}
              title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
            >
              <Languages className="w-4 h-4" />
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <button
              onClick={toggleTheme}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-1 justify-center text-xs font-semibold relative z-10", theme === 'dark' ? 'text-sidebar-foreground bg-sidebar-accent shadow-sm' : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50')}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {theme === 'dark' ? 'Dark' : 'Light'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 mb-2 bg-sidebar-accent/30 rounded-xl p-1 ring-1 ring-border/50">
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="w-10 h-10 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all flex items-center justify-center text-xs font-bold"
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <div className="w-6 h-px bg-sidebar-border/50" />
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all flex items-center justify-center"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            "w-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 rounded-xl font-bold border border-destructive/20 group hover:shadow-[0_0_15px_rgba(220,38,38,0.3)]",
            collapsed ? "px-0 justify-center h-12" : "justify-start h-10 px-4"
          )}
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {!collapsed && <span className="ml-3 group-hover:translate-x-1 transition-transform">{t('sidebar.logout')}</span>}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
