import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { Enterprise } from '@/lib/mock-data';
import { toast } from 'sonner';

interface EnterpriseFormModalProps {
  open: boolean;
  onClose: () => void;
  enterprise?: Enterprise | null;
}

const EnterpriseFormModal = ({ open, onClose, enterprise }: EnterpriseFormModalProps) => {
  const { addEnterprise, updateEnterprise } = useAppStore();
  const isEditing = !!enterprise;

  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    phone: '',
    address: '',
    status: 'pending' as Enterprise['status'],
  });

  useEffect(() => {
    if (enterprise) {
      setFormData({
        name: enterprise.name,
        contactEmail: enterprise.contactEmail,
        phone: enterprise.phone,
        address: enterprise.address,
        status: enterprise.status,
      });
    } else {
      setFormData({
        name: '',
        contactEmail: '',
        phone: '',
        address: '',
        status: 'pending',
      });
    }
  }, [enterprise, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && enterprise) {
      updateEnterprise(enterprise.id, formData);
      toast.success('Entreprise mise à jour avec succès');
    } else {
      const newEnterprise: Enterprise = {
        id: `ent-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
        deviceCount: 0,
      };
      addEnterprise(newEnterprise);
      toast.success('Entreprise créée avec succès');
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'entreprise</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: TransLogistics SA"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email de contact</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="contact@entreprise.dz"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+213 21 45 67 89"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Zone Industrielle, Alger"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Enterprise['status']) => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="hero">
              {isEditing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnterpriseFormModal;
