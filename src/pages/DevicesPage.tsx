import DashboardLayout from '@/components/layout/DashboardLayout';
import DeviceCard from '@/components/devices/DeviceCard';
import { useAppStore, useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Download, Grid3X3, List } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import DeviceFormModal from '@/components/modals/DeviceFormModal';

const DevicesPage = () => {
  const { user } = useAuthStore();
  const { getFilteredDevices, searchQuery, setSearchQuery, statusFilter, setStatusFilter, selectedDevice, setSelectedDevice } = useAppStore();
  const devices = getFilteredDevices();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">
                {user?.role === 'operator' ? 'Ma Flotte' : 'Véhicules'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {devices.length} véhicule{devices.length !== 1 ? 's' : ''} 
                {user?.enterpriseName && ` • ${user.enterpriseName}`}
              </p>
            </div>
            {user?.role === 'admin' && (
              <Button variant="hero" onClick={() => setAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un véhicule
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-0"
              />
            </div>
            
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
          {devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucun véhicule trouvé</h3>
              <p className="text-muted-foreground max-w-md">
                Modifiez vos filtres ou ajoutez de nouveaux véhicules à votre flotte.
              </p>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "space-y-3"
            )}>
              {devices.map((device) => (
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
    </DashboardLayout>
  );
};

export default DevicesPage;
