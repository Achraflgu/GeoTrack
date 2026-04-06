import DashboardLayout from '@/components/layout/DashboardLayout';
import MapView from '@/components/map/MapView';
import { useAppStore, useAuthStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Radio,
  Wifi,
  WifiOff,
  Navigation,
  AlertTriangle,
  Building2,
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  History,
  Eye,
  Zap,
  Battery
} from 'lucide-react';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils-geo';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { statsApi } from '@/lib/api';

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { devices, enterprises, alerts, selectedDevice, setSelectedDevice, getFilteredDevices, searchQuery, setSearchQuery } = useAppStore();

  const [dbStats, setDbStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch real stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const enterpriseId = user?.role === 'operator' ? user?.enterpriseId : undefined;
        const data = await statsApi.getDashboardStats(enterpriseId);
        setDbStats(data.stats);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get operator's enterprise details
  const myEnterprise = user?.role === 'operator' && user?.enterpriseId
    ? enterprises.find(e => e.id === user.enterpriseId)
    : null;

  // Role-specific device filtering
  const roleDevices = user?.role === 'operator' && user?.enterpriseId
    ? devices.filter(d => d.enterpriseId === user.enterpriseId)
    : devices;

  const roleEnterprises = user?.role === 'operator' && user?.enterpriseId
    ? enterprises.filter(e => e.id === user.enterpriseId)
    : enterprises;

  const filteredDevices = user?.role === 'operator' && user?.enterpriseId
    ? getFilteredDevices().filter(d => d.enterpriseId === user.enterpriseId)
    : getFilteredDevices();

  // Fallback to local calculation if API stats not yet loaded
  const localStats = {
    total: roleDevices.length,
    online: roleDevices.filter(d => d.status === 'online' || d.status === 'moving').length,
    moving: roleDevices.filter(d => d.status === 'moving').length,
    offline: roleDevices.filter(d => d.status === 'offline').length,
  };

  // Get recent alerts (role-specific)
  const roleAlerts = user?.role === 'operator' && user?.enterpriseId
    ? alerts.filter(a => roleDevices.some(d => d.id === a.deviceId))
    : alerts;
  const recentAlerts = roleAlerts.slice(0, 5);

  // Calculate unread alerts count
  const unreadAlertsCount = roleAlerts.filter(a => !a.read).length;

  // Use API stats for other values, but always use local unread count for alerts
  const displayStats = {
    ...localStats,
    ...(dbStats || {}),
    alerts: unreadAlertsCount // Always use local unread count
  };

  // Get devices with alerts
  const alertDevices = roleDevices.filter(d => d.status === 'alert');

  // Get moving devices
  const movingDevices = roleDevices.filter(d => d.status === 'moving').slice(0, 5);

  // Role-specific title and description
  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'supervisor':
        return 'Surveillance Nationale';
      case 'operator':
        return 'Mon Tableau de bord';
      default:
        return 'Tableau de bord';
    }
  };

  const getDashboardDescription = () => {
    switch (user?.role) {
      case 'supervisor':
        return `Supervision de ${enterprises.length} entreprises • ${devices.length} appareils`;
      case 'operator':
        const myDevices = devices.filter(d => d.enterpriseId === user?.enterpriseId);
        return `${user?.enterpriseName} • ${myDevices.length} appareils`;
      default:
        return `Bienvenue, ${user?.name}`;
    }
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{getDashboardTitle()}</h1>
                {user?.role === 'supervisor' && (
                  <Badge variant="outline" className="text-warning border-warning/30">Lecture seule</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {getDashboardDescription()} • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-0"
              />
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className="glass-card border-0 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/devices')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Radio className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{displayStats.total}</p>
                      <p className="text-sm text-muted-foreground">Total Appareils</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <Wifi className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-success">{displayStats.online}</p>
                      <p className="text-sm text-muted-foreground">En ligne</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-primary">{displayStats.moving}</p>
                      <p className="text-sm text-muted-foreground">En mouvement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <WifiOff className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{displayStats.offline}</p>
                      <p className="text-sm text-muted-foreground">Hors ligne</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/alerts')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-destructive">{displayStats.alerts}</p>
                      <p className="text-sm text-muted-foreground">Alertes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Grid - Different layout for operators */}
            {user?.role === 'operator' ? (
              /* Operator Layout - Like Enterprise Detail Page */
              <>
                {/* Enterprise Info + Quick Actions */}
                {myEnterprise && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="glass-card border-0">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building2 className="w-5 h-5" />
                          Mon Entreprise
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{myEnterprise.contactEmail}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{myEnterprise.phone}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{myEnterprise.address}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Inscrit le {new Date(myEnterprise.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Résumé des appareils */}
                    <Card className="glass-card border-0">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Radio className="w-5 h-5" />
                          Résumé des appareils
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-medium">{roleDevices.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">En ligne</span>
                          <span className="font-medium text-success">{displayStats.online}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hors ligne</span>
                          <span className="font-medium">{displayStats.offline}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Alertes</span>
                          <span className="font-medium text-destructive">{displayStats.alerts}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Map Preview + Devices List - Same row */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Map Preview */}
                  <Card className="glass-card border-0 lg:col-span-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Aperçu de la carte
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => navigate('/map')}>
                          Voir la carte complète
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px] rounded-xl overflow-hidden">
                        <MapView
                          devices={filteredDevices}
                          selectedDevice={selectedDevice}
                          onDeviceSelect={(device) => {
                            setSelectedDevice(device);
                          }}
                          className="h-full"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Devices List - Sidebar style */}
                  <Card className="glass-card border-0">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Radio className="w-5 h-5" />
                          Mes Appareils
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/devices')}>
                          Voir tout
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[320px]">
                        <div className="space-y-2">
                          {roleDevices.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                              Aucun appareil assigné
                            </p>
                          ) : (
                            roleDevices.map((device) => (
                              <div
                                key={device.id}
                                className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors border border-border/30"
                                onClick={() => navigate(`/devices/${device.id}`)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`} />
                                    <span className="font-medium text-sm">{device.name}</span>
                                  </div>
                                  <Badge className={getStatusColor(device.status)} variant="outline">
                                    {getStatusLabel(device.status)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Navigation className="w-3 h-3" />
                                    <span>{device.speed} km/h</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Battery className="w-3 h-3" />
                                    <span>{device.battery}%</span>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 truncate">{device.location.address}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              /* Admin/Supervisor Layout - Original */
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Map Preview */}
                <Card className="glass-card border-0 lg:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Aperçu de la carte
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => navigate('/map')}>
                        Voir la carte complète
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px] rounded-xl overflow-hidden">
                      <MapView
                        devices={filteredDevices}
                        selectedDevice={selectedDevice}
                        onDeviceSelect={(device) => {
                          setSelectedDevice(device);
                        }}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Enterprises Summary */}
                <Card className="glass-card border-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Entreprises
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/enterprises')}>
                        Voir tout
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[320px]">
                      <div className="space-y-3">
                        {roleEnterprises.map((enterprise) => {
                          const entDevices = roleDevices.filter(d => d.enterpriseId === enterprise.id);
                          const online = entDevices.filter(d => d.status === 'online' || d.status === 'moving' || d.status === 'idle').length;
                          return (
                            <div
                              key={enterprise.id}
                              className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                              onClick={() => navigate(`/enterprises/${enterprise.id}`)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{enterprise.name}</p>
                                    <p className="text-xs text-muted-foreground">{entDevices.length} appareils</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-success border-success/30">
                                  {online} actifs
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Bottom Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Moving Devices */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-primary" />
                    {user?.role === 'operator' ? 'Mes appareils en mouvement' : 'Appareils en mouvement'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {movingDevices.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Aucun appareil en mouvement</p>
                      ) : (
                        movingDevices.map((device) => (
                          <div
                            key={device.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                            onClick={() => navigate(`/devices/${device.id}`)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`} />
                              <div>
                                <p className="font-medium">{device.name}</p>
                                <p className="text-xs text-muted-foreground">{device.location.address}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary">{device.speed} km/h</p>
                              <p className="text-xs text-muted-foreground">{device.enterpriseName}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Alerts */}
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      {user?.role === 'operator' ? 'Mes alertes récentes' : 'Alertes récentes'}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/alerts')}>
                      Voir tout
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {recentAlerts.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Aucune alerte récente</p>
                      ) : (
                        recentAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${alert.type === 'speed' ? 'bg-warning/10' :
                                alert.type === 'geofence' ? 'bg-primary/10' :
                                  'bg-destructive/10'
                                }`}>
                                <AlertTriangle className={`w-4 h-4 ${alert.type === 'speed' ? 'text-warning' :
                                  alert.type === 'geofence' ? 'text-primary' :
                                    'text-destructive'
                                  }`} />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{alert.message}</p>
                                <p className="text-xs text-muted-foreground">{alert.deviceName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={alert.read ? 'secondary' : 'destructive'} className="text-xs">
                                {alert.read ? 'Lu' : 'Nouveau'}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">{formatDate(alert.timestamp)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
