import DashboardLayout from '@/components/layout/DashboardLayout';
import DeviceCard from '@/components/devices/DeviceCard';
import { useAppStore, useAuthStore } from '@/lib/store';
import { useIsDemo, guardDemoAction } from '@/lib/demoGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Download, Grid3X3, List, Building2, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import DeviceFormModal from '@/components/modals/DeviceFormModal';
import UpgradeOrderModal from '@/components/modals/UpgradeOrderModal';

const DevicesPage = () => {
  const { user } = useAuthStore();
  const isDemo = useIsDemo();
  const { devices, enterprises, searchQuery, setSearchQuery, statusFilter, setStatusFilter, selectedDevice } = useAppStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [enterpriseFilter, setEnterpriseFilter] = useState<string>('all');
  const navigate = useNavigate();

  // Filter devices based on enterprise filter and other filters
  const getFilteredDevices = () => {
    let filtered = devices;

    // Filter by user's enterprise if operator
    if (user?.role === 'operator' && user.enterpriseId) {
      filtered = filtered.filter(d => d.enterpriseId === user.enterpriseId);
    }

    // Filter by selected enterprise
    if (enterpriseFilter !== 'all') {
      filtered = filtered.filter(d => d.enterpriseId === enterpriseFilter);
    }

    // Filter by search query (includes IMEI, subscriberNumber)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.imei.toLowerCase().includes(query) ||
        d.serialNumber.toLowerCase().includes(query) ||
        (d.subscriberNumber && d.subscriberNumber.toLowerCase().includes(query)) ||
        d.enterpriseName.toLowerCase().includes(query) ||
        d.location.address.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    return filtered;
  };

  const filteredDevices = getFilteredDevices();

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">
                {user?.role === 'operator' ? 'Mes Appareils' : 'Appareils'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {filteredDevices.length} appareil{filteredDevices.length !== 1 ? 's' : ''}
                {enterpriseFilter !== 'all' && ` • ${enterprises.find(e => e.id === enterpriseFilter)?.name}`}
                {user?.enterpriseName && ` • ${user.enterpriseName}`}
              </p>
            </div>
            {user?.role === 'admin' && (
              <Button variant="hero" onClick={() => guardDemoAction(isDemo, () => setAddModalOpen(true))}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un appareil
              </Button>
            )}
            {user?.role === 'operator' && (
              <Button
                variant="hero"
                className="gap-2 shadow-lg"
                onClick={() => guardDemoAction(isDemo, () => setUpgradeModalOpen(true))}
              >
                <ShoppingCart className="w-4 h-4" />
                Commander des appareils
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-0"
              />
            </div>

            {/* Enterprise Filter */}
            {user?.role !== 'operator' && (
              <Select value={enterpriseFilter} onValueChange={setEnterpriseFilter}>
                <SelectTrigger className="w-56 bg-secondary/50 border-0">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Entreprise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entreprises</SelectItem>
                  {enterprises.map((ent) => (
                    <SelectItem key={ent.id} value={ent.id}>
                      {ent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-secondary/50 border-0">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="online">En ligne</SelectItem>
                <SelectItem value="moving">En mouvement</SelectItem>
                <SelectItem value="idle">À l'arrêt</SelectItem>
                <SelectItem value="offline">Hors ligne</SelectItem>
                <SelectItem value="alert">Alerte</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {filteredDevices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucun appareil trouvé</h3>
              <p className="text-muted-foreground max-w-md">
                Modifiez vos filtres ou ajoutez de nouveaux appareils.
              </p>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid'
                ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "space-y-3"
            )}>
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  isSelected={selectedDevice?.id === device.id}
                  onClick={() => navigate(`/devices/${device.id}`)}
                  compact={viewMode === 'list'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <DeviceFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
      <UpgradeOrderModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </DashboardLayout>
  );
};

export default DevicesPage;
