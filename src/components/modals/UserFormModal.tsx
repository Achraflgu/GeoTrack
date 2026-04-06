import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { User } from '@/lib/types';
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
    plan: 'starter' as string,
    enterpriseId: '',
    password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        plan: (user as any).plan || 'starter',
        enterpriseId: user.enterpriseId || '',
        password: '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'operator',
        plan: 'starter',
        enterpriseId: '',
        password: 'demo123',
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const enterprise = enterprises.find(e => e.id === formData.enterpriseId);

    try {
      if (isEditing && user) {
        await updateUser(user.id, {
          ...formData,
          enterpriseName: enterprise?.name,
        });
        toast.success('Utilisateur mis à jour avec succès');
      } else {
        await addUser({
          ...formData,
          enterpriseName: enterprise?.name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
        });
        toast.success('Utilisateur créé avec succès');
      }
      onClose();
    } catch (err) {
      console.error('Error saving user:', err);
      toast.error("Échec de l'enregistrement de l'utilisateur");
    }
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
            <>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(value) => setFormData({ ...formData, plan: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">
                      <span className="flex items-center gap-2">📦 Starter</span>
                    </SelectItem>
                    <SelectItem value="pro">
                      <span className="flex items-center gap-2">🚀 Pro</span>
                    </SelectItem>
                    <SelectItem value="enterprise">
                      <span className="flex items-center gap-2">⭐ Enterprise</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  {formData.plan === 'starter' ? 'Accès: Dashboard, Carte, Appareils, Alertes'
                    : formData.plan === 'pro' ? 'Accès: Tout Starter + Géofences, Support, Paramètres'
                      : 'Accès complet à toutes les fonctionnalités'}
                </p>
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
            </>
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
