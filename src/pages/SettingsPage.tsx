import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Bell, 
  Shield, 
  Globe, 
  Palette,
  Save
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

const SettingsPage = () => {
  const { user } = useAuthStore();

  // Only admin can access
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <h1 className="text-xl font-bold">Paramètres</h1>
          <p className="text-sm text-muted-foreground">
            Configurez les options de la plateforme
          </p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl space-y-6">
            {/* General Settings */}
            <Card className="glass-card border-0">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Paramètres généraux</CardTitle>
                    <CardDescription>Configuration de base de la plateforme</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Nom de la plateforme</Label>
                    <Input defaultValue="GeoTrack" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fuseau horaire</Label>
                    <Input defaultValue="Africa/Algiers (UTC+1)" disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="glass-card border-0">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Notifications</CardTitle>
                    <CardDescription>Gérez les alertes et notifications</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertes de batterie faible</p>
                    <p className="text-sm text-muted-foreground">Notification quand un appareil a moins de 20%</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertes hors ligne</p>
                    <p className="text-sm text-muted-foreground">Notification quand un appareil perd la connexion</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications par email</p>
                    <p className="text-sm text-muted-foreground">Recevoir les alertes par email</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="glass-card border-0">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Sécurité</CardTitle>
                    <CardDescription>Options de sécurité et d'accès</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Authentification à deux facteurs</p>
                    <p className="text-sm text-muted-foreground">Exiger 2FA pour tous les utilisateurs</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Journal d'activité</p>
                    <p className="text-sm text-muted-foreground">Enregistrer toutes les actions utilisateur</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="hero">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
