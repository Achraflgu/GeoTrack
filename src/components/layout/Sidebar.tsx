import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard, 
  MapPin, 
  Truck, 
  Building2, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Radio,
  Bell,
  User
} from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/map', icon: MapPin, label: 'Carte temps réel' },
    { to: '/devices', icon: Truck, label: 'Véhicules' },
    { to: '/enterprises', icon: Building2, label: 'Entreprises' },
    { to: '/users', icon: Users, label: 'Utilisateurs' },
    { to: '/alerts', icon: Bell, label: 'Alertes' },
    { to: '/settings', icon: Settings, label: 'Paramètres' },
    { to: '/profile', icon: User, label: 'Mon Profil' },
  ];

  const operatorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/map', icon: MapPin, label: 'Carte temps réel' },
    { to: '/devices', icon: Truck, label: 'Ma flotte' },
    { to: '/alerts', icon: Bell, label: 'Alertes' },
    { to: '/profile', icon: User, label: 'Mon Profil' },
  ];

  const supervisorLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Vue d\'ensemble' },
    { to: '/map', icon: MapPin, label: 'Surveillance' },
    { to: '/devices', icon: Truck, label: 'Tous les véhicules' },
    { to: '/enterprises', icon: Building2, label: 'Entreprises' },
    { to: '/alerts', icon: Bell, label: 'Alertes' },
    { to: '/profile', icon: User, label: 'Mon Profil' },
  ];

  const getLinks = () => {
    switch (user?.role) {
      case 'admin':
        return adminLinks;
      case 'operator':
        return operatorLinks;
      case 'supervisor':
        return supervisorLinks;
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Radio className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sidebar-foreground">GeoTrack</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Radio className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-sidebar-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {user.role === 'admin' ? 'Administrateur' : 
                 user.role === 'operator' ? 'Opérateur' : 'Superviseur'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {links.map((link) => (
            <Link
              key={link.to}
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
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed ? "px-2" : "justify-start"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Déconnexion</span>}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
