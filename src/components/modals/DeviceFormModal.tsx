import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { Device } from '@/lib/mock-data';
import { toast } from 'sonner';

interface DeviceFormModalProps {
  open: boolean;
  onClose: () => void;
  device?: Device | null;
}

const DeviceFormModal = ({ open, onClose, device }: DeviceFormModalProps) => {
  const { enterprises, addDevice, updateDevice } = useAppStore();
  const isEditing = !!device;

  const [formData, setFormData] = useState({
    name: '',
    imei: '',
    licensePlate: '',
    vehicleType: 'car' as Device['vehicleType'],
    enterpriseId: '',
  });

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name,
        imei: device.imei,
        licensePlate: device.licensePlate,
        vehicleType: device.vehicleType,
        enterpriseId: device.enterpriseId,
      });
    } else {
      setFormData({
        name: '',
        imei: '',
        licensePlate: '',
        vehicleType: 'car',
        enterpriseId: '',
      });
    }
  }, [device, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const enterprise = enterprises.find(e => e.id === formData.enterpriseId);
    if (!enterprise) {
      toast.error('Veuillez sélectionner une entreprise');
      return;
    }

    if (isEditing && device) {
      updateDevice(device.id, {
        ...formData,
        enterpriseName: enterprise.name,
      });
      toast.success('Véhicule mis à jour avec succès');
    } else {
      const newDevice: Device = {
        id: `dev-${Date.now()}`,
        ...formData,
        enterpriseName: enterprise.name,
        status: 'offline',
        lastUpdate: new Date().toISOString(),
        location: { lat: 36.7538, lng: 3.0588, address: 'Position initiale' },
        speed: 0,
        heading: 0,
        battery: 100,
        signal: 0,
      };
      addDevice(newDevice);
      toast.success('Véhicule ajouté avec succès');
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du véhicule</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Camion TL-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imei">Numéro IMEI</Label>
            <Input
              id="imei"
              value={formData.imei}
              onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
              placeholder="359072012345678"
              required
              maxLength={15}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licensePlate">Immatriculation</Label>
            <Input
              id="licensePlate"
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
              placeholder="00123-116-16"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Type de véhicule</Label>
            <Select
              value={formData.vehicleType}
              onValueChange={(value: Device['vehicleType']) => 
                setFormData({ ...formData, vehicleType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="car">Voiture</SelectItem>
                <SelectItem value="truck">Camion</SelectItem>
                <SelectItem value="van">Fourgon</SelectItem>
                <SelectItem value="motorcycle">Moto</SelectItem>
                <SelectItem value="bus">Bus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Entreprise</Label>
            <Select
              value={formData.enterpriseId}
              onValueChange={(value) => setFormData({ ...formData, enterpriseId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une entreprise" />
              </SelectTrigger>
              <SelectContent>
                {enterprises.map((ent) => (
                  <SelectItem key={ent.id} value={ent.id}>
                    {ent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="hero">
              {isEditing ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceFormModal;
