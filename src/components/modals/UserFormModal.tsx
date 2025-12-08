import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { User } from '@/lib/mock-data';
import { toast } from 'sonner';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
}

const UserFormModal = ({ open, onClose, user }: UserFormModalProps) => {
  const { enterprises, addUser, updateUser } = useAppStore();
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'operator' as User['role'],
    enterpriseId: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        enterpriseId: user.enterpriseId || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'operator',
        enterpriseId: '',
      });
    }
  }, [user, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const enterprise = enterprises.find(e => e.id === formData.enterpriseId);

    if (isEditing && user) {
      updateUser(user.id, {
        ...formData,
        enterpriseName: enterprise?.name,
      });
      toast.success('Utilisateur mis à jour avec succès');
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        ...formData,
        enterpriseName: enterprise?.name,
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString(),
      };
      addUser(newUser);
      toast.success('Utilisateur créé avec succès');
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Ahmed Benali"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="utilisateur@email.dz"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select
              value={formData.role}
              onValueChange={(value: User['role']) => 
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="operator">Opérateur</SelectItem>
                <SelectItem value="supervisor">Superviseur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === 'operator' && (
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
          )}

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

export default UserFormModal;
