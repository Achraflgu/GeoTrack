import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { Device } from '@/lib/types';
import { toast } from 'sonner';
import { Radio, MapPin, Wifi, Cpu, Smartphone, Truck, Package, User, Container, Plane, Camera, Copy, Link, CheckCircle2, ExternalLink } from 'lucide-react';
import { devicesApi } from '@/lib/api';

// Device type options with labels
const deviceTypes = [
  { value: 'tracker', label: 'Tracker GPS', icon: Radio },
  { value: 'gps', label: 'GPS Portable', icon: MapPin },
  { value: 'beacon', label: 'Beacon', icon: Wifi },
  { value: 'sensor', label: 'Capteur IoT', icon: Cpu },
  { value: 'mobile', label: 'Mobile', icon: Smartphone },
  { value: 'vehicle', label: 'Véhicule', icon: Truck },
  { value: 'asset', label: 'Asset / Équipement', icon: Package },
  { value: 'personal', label: 'Personnel', icon: User },
  { value: 'container', label: 'Container', icon: Container },
  { value: 'drone', label: 'Drone', icon: Plane },
  { value: 'camera', label: 'Caméra', icon: Camera },
] as const;

interface DeviceFormModalProps {
  open: boolean;
  onClose: () => void;
  device?: Device | null;
  initialEnterpriseId?: string;
}

const DeviceFormModal = ({ open, onClose, device }: DeviceFormModalProps) => {
  const { enterprises, fetchDevices } = useAppStore();
  const isEditing = !!device;
  const isOperator = user?.role === 'operator';

  const [formData, setFormData] = useState({
    name: '',
    imei: '',
    serialNumber: '',
    subscriberNumber: '',
    deviceType: 'tracker' as Device['deviceType'],
    assignedTo: '',
    enterpriseId: '',
    dataSource: 'fake' as 'fake' | 'real',
  });

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdDevice, setCreatedDevice] = useState<{ name: string; trackingToken: string; trackingUrl: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackerBaseUrl, setTrackerBaseUrl] = useState('http://localhost:3001');

  // Fetch tracker URL from server config every time dialog opens
  useEffect(() => {
    if (open) {
      fetch('http://localhost:3001/api/config')
        .then(res => res.json())
        .then(config => {
          if (config.trackerUrl) {
            setTrackerBaseUrl(config.trackerUrl);
          }
        })
        .catch(err => console.warn('Could not fetch tracker config:', err));
    }
  }, [open]);

  // Fetch next available IDs when enterprise changes (Creation Mode)
  useEffect(() => {
    if (!isEditing && formData.enterpriseId) {
      // Small delay to let UI settle
      const timeout = setTimeout(() => {
        fetch(`http://localhost:3001/api/enterprises/${formData.enterpriseId}/next-ids`)
          .then(res => res.json())
          .then(ids => {
            if (ids && !ids.error) {
              setFormData(prev => ({
                ...prev,
                serialNumber: ids.serialNumber,
                imei: ids.imei,
                subscriberNumber: ids.subscriberNumber
              }));
            }
          })
          .catch(err => console.error('Failed to fetch next IDs:', err));
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [formData.enterpriseId, isEditing]);

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name,
        imei: device.imei,
        serialNumber: device.serialNumber,
        subscriberNumber: device.subscriberNumber || '',
        deviceType: device.deviceType,
        assignedTo: device.assignedTo || '',
        enterpriseId: device.enterpriseId,
        dataSource: device.dataSource || 'fake',
      });
    } else {
      setFormData({
        name: '',
        imei: '',
        serialNumber: '',
        subscriberNumber: '',
        deviceType: 'tracker',
        assignedTo: '',
        enterpriseId: '',
        dataSource: 'fake',
      });
    }
    setShowSuccessDialog(false);
    setCreatedDevice(null);
  }, [device, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const enterprise = enterprises.find(e => e.id === formData.enterpriseId);
    if (!enterprise && (!isEditing || !isOperator)) {
      toast.error('Veuillez sélectionner une entreprise');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && device) {
        // Update existing device via API
        await devicesApi.update(device.id, {
          ...formData, // Including manual edits to IDs if allowed or just for existing data
          assignedTo: formData.assignedTo || undefined,
          enterpriseName: enterprise.name,
        });
        toast.success('Appareil mis à jour avec succès');
        await fetchDevices();
        onClose();
      } else {
        // Create new device via API - Server handles ID generation
        const newDeviceData = {
          name: formData.name,
          deviceType: formData.deviceType,
          assignedTo: formData.assignedTo || undefined,
          enterpriseId: formData.enterpriseId,
          enterpriseName: enterprise.name,
          dataSource: formData.dataSource,
          status: 'offline',
          location: { lat: 36.8065, lng: 10.1815, address: 'Position initiale' },
          speed: 0,
          heading: 0,
          battery: 100,
          signal: 0,
          simulation: formData.dataSource === 'fake' ? {
            routeId: 'tunis-ariana',
            currentIndex: 0,
            direction: 1,
            isRunning: true
          } : undefined,
        };

        const result = await devicesApi.create(newDeviceData);
        await fetchDevices();

        if (formData.dataSource === 'real' && result.trackingToken) {
          // Show success dialog with tracking link
          const trackingUrl = `${trackerBaseUrl}/tracker/?token=${result.trackingToken}`;
          setCreatedDevice({
            name: formData.name,
            trackingToken: result.trackingToken,
            trackingUrl
          });
          setShowSuccessDialog(true);
        } else {
          toast.success('Appareil ajouté avec succès');
          onClose();
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingLink = () => {
    if (createdDevice) {
      navigator.clipboard.writeText(createdDevice.trackingUrl);
      toast.success('Lien copié dans le presse-papier!');
    }
  };

  // Success dialog for real device with tracking link
  if (showSuccessDialog && createdDevice) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <DialogTitle>Appareil créé!</DialogTitle>
                <DialogDescription>{createdDevice.name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">📱 Lien de suivi pour téléphone</p>
              <p className="text-xs text-muted-foreground">
                Ouvrez ce lien sur votre téléphone pour activer le suivi GPS en temps réel.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={createdDevice.trackingUrl}
                  className="font-mono text-xs bg-background"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={copyTrackingLink}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => window.open(createdDevice.trackingUrl, '_blank')}
                className="w-full"
                variant="hero"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ouvrir le lien
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier l\'appareil' : 'Ajouter un appareil'}
          </DialogTitle>
          <DialogDescription className="hidden">
            Remplir les détails de l'appareil
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Enterprise Selection - First to generate IDs */}
          <div className="space-y-2">
            <Label>Entreprise *</Label>
            <Select
              value={formData.enterpriseId}
              onValueChange={(value) => setFormData({ ...formData, enterpriseId: value })}
              disabled={isEditing} // Prevent changing enterprise on edit to avoid ID conflicts
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une entreprise" />
              </SelectTrigger>
              <SelectContent>
                {enterprises.map((ent: any) => (
                  <SelectItem key={ent._id || ent.id} value={ent._id || ent.id}>
                    {ent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'appareil *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Tracker TL-001"
              required
            />
          </div>

          {/* Auto-generated IDs - Read only */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI</Label>
              <Input
                id="imei"
                value={formData.imei}
                readOnly
                className="bg-muted/50 font-mono text-xs"
                placeholder="Génération en cours..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">N° Série</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                readOnly
                className="bg-muted/50 font-mono text-xs"
                placeholder="Génération en cours..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscriberNumber">N° Abonné / SIM</Label>
            <Input
              id="subscriberNumber"
              value={formData.subscriberNumber}
              readOnly
              className="bg-muted/50 font-mono text-xs"
              placeholder="Génération en cours..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigné à (optionnel)</Label>
            <Input
              id="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              placeholder="Ex: Camion #1, Livreur Mohamed..."
            />
          </div>

          <div className="space-y-2">
            <Label>Type d'appareil</Label>
            <Select
              value={formData.deviceType}
              onValueChange={(value: Device['deviceType']) =>
                setFormData({ ...formData, deviceType: value })
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {(() => {
                    const selected = deviceTypes.find(t => t.value === formData.deviceType);
                    if (selected) {
                      const Icon = selected.icon;
                      return (
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{selected.label}</span>
                        </div>
                      );
                    }
                    return 'Sélectionner...';
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {deviceTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Data Source Toggle */}
          <div className="space-y-2">
            <Label>Source de données</Label>
            <Select
              value={formData.dataSource}
              onValueChange={(value: 'fake' | 'real') =>
                setFormData({ ...formData, dataSource: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fake">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-primary" />
                    <span>Simulé (Démonstration)</span>
                  </div>
                </SelectItem>
                <SelectItem value="real">
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-success" />
                    <span>Réel (GPS Téléphone)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {formData.dataSource === 'real' && (
              <p className="text-xs text-muted-foreground">
                📱 Un lien sera généré pour connecter votre téléphone.
              </p>
            )}
          </div>

          {/* Show tracking link for existing real devices */}
          {isEditing && device?.dataSource === 'real' && device?.trackingToken && (
            <div className="space-y-2">
              <Label>Lien de suivi actif</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`http://localhost:8080/tracker-page/index.html?token=${device.trackingToken}`}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`http://localhost:8080/tracker-page/index.html?token=${device.trackingToken}`);
                    toast.success('Lien copié!');
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="hero" disabled={isSubmitting}>
              {isSubmitting ? 'En cours...' : (isEditing ? 'Enregistrer' : 'Ajouter')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceFormModal;
