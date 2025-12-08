import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAppStore, useAuthStore } from '@/lib/store';
import { generateLocationHistory } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  MapPin, 
  Battery, 
  Signal, 
  Gauge, 
  Clock, 
  Building2,
  Navigation,
  Edit,
  Trash2,
  History,
  Route
} from 'lucide-react';
import { getVehicleIcon, getStatusColor, getStatusLabel, formatDate, formatSpeed, formatBattery } from '@/lib/utils-geo';
import MapView from '@/components/map/MapView';
import { useState } from 'react';
import DeviceFormModal from '@/components/modals/DeviceFormModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { toast } from 'sonner';

const DeviceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { devices, deleteDevice } = useAppStore();
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const device = devices.find(d => d.id === id);
  
  if (!device) {
    return (
      <DashboardLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Véhicule non trouvé</h2>
            <Button onClick={() => navigate('/devices')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux véhicules
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const VehicleIcon = getVehicleIcon(device.vehicleType);
  const history = generateLocationHistory(device.id, 24);

  const handleDelete = () => {
    deleteDevice(device.id);
    toast.success('Véhicule supprimé avec succès');
    navigate('/devices');
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <VehicleIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">{device.name}</h1>
                    <Badge className={getStatusColor(device.status)}>
                      {getStatusLabel(device.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{device.licensePlate} • {device.imei}</p>
                </div>
              </div>
            </div>
            
            {user?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="destructive" onClick={() => setDeleteModalOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
              <TabsTrigger value="map">Carte</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Position</p>
                        <p className="font-medium truncate">{device.location.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Gauge className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vitesse</p>
                        <p className="font-medium">{formatSpeed(device.speed)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Battery className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Batterie</p>
                        <p className="font-medium">{formatBattery(device.battery)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Signal className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Signal</p>
                        <p className="font-medium">{device.signal}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Info Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Informations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entreprise</span>
                      <span className="font-medium">{device.enterpriseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">{device.vehicleType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IMEI</span>
                      <span className="font-medium font-mono text-sm">{device.imei}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Immatriculation</span>
                      <span className="font-medium">{device.licensePlate}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Navigation className="w-5 h-5" />
                      Navigation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latitude</span>
                      <span className="font-medium font-mono text-sm">{device.location.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Longitude</span>
                      <span className="font-medium font-mono text-sm">{device.location.lng.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Direction</span>
                      <span className="font-medium">{device.heading}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dernière mise à jour</span>
                      <span className="font-medium text-sm">{formatDate(device.lastUpdate)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mini Map */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Position actuelle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] rounded-lg overflow-hidden">
                    <MapView devices={[device]} selectedDevice={device} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Historique des dernières 24 heures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[500px] overflow-auto">
                    {history.slice(0, 20).map((point, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Route className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{point.address}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-medium text-sm">{point.speed} km/h</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(point.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="h-[calc(100vh-280px)]">
              <Card className="glass-card border-0 h-full">
                <CardContent className="p-0 h-full">
                  <MapView devices={[device]} selectedDevice={device} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DeviceFormModal 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        device={device}
      />
      
      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le véhicule"
        description={`Êtes-vous sûr de vouloir supprimer "${device.name}" ? Cette action est irréversible.`}
      />
    </DashboardLayout>
  );
};

export default DeviceDetailPage;
