import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Building2, Shield, Calendar, Clock, Save, Key, Edit2 } from 'lucide-react';
import { getRoleName, getRoleColor, formatDate } from '@/lib/utils-geo';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    await updateProfile({ name, email });
    toast.success('Profil mis à jour avec succès');
    setIsEditing(false);
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <h1 className="text-xl font-bold">Mon Profil</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos informations personnelles
          </p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header Card */}
            <Card className="glass-card-elevated border-0 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
              <CardContent className="relative pt-0 pb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
                  <Avatar className="w-24 h-24 border-4 border-card shadow-xl">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center sm:text-left pb-2">
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                      <Badge className={getRoleColor(user.role)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {getRoleName(user.role)}
                      </Badge>
                      {user.enterpriseName && (
                        <Badge variant="outline">
                          <Building2 className="w-3 h-3 mr-1" />
                          {user.enterpriseName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={isEditing ? "secondary" : "outline"}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    {isEditing ? 'Annuler' : 'Modifier'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Edit Profile */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Informations personnelles</CardTitle>
                      <CardDescription>Vos informations de compte</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom"
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-secondary/50' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.dz"
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-secondary/50' : ''}
                    />
                  </div>

                  {isEditing && (
                    <div className="flex justify-end pt-2">
                      <Button variant="hero" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Informations du compte</CardTitle>
                      <CardDescription>Détails de votre compte</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date de création</p>
                      <p className="font-medium">{new Date(user.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30">
                    <Clock className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-sm text-muted-foreground">Dernière connexion</p>
                      <p className="font-medium">{formatDate(user.lastLogin)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email vérifié</p>
                      <p className="font-medium text-success">Oui</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security */}
            <Card className="glass-card border-0">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Sécurité</CardTitle>
                    <CardDescription>Gérez votre mot de passe et la sécurité du compte</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mot de passe actuel</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => toast.info('Fonctionnalité en cours de développement')}>
                    <Key className="w-4 h-4 mr-2" />
                    Changer le mot de passe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
