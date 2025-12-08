import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAppStore, useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Plus, Search, Building2, Truck, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const EnterprisesPage = () => {
  const { user } = useAuthStore();
  const { enterprises } = useAppStore();

  // Only admin and supervisor can access
  if (user?.role === 'operator') {
    return <Navigate to="/dashboard" replace />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Actif</Badge>;
      case 'suspended':
        return <Badge className="bg-destructive text-destructive-foreground">Suspendu</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-warning-foreground">En attente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Entreprises</h1>
              <p className="text-sm text-muted-foreground">
                {enterprises.length} entreprise{enterprises.length !== 1 ? 's' : ''} enregistrée{enterprises.length !== 1 ? 's' : ''}
              </p>
            </div>
            {user?.role === 'admin' && (
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle entreprise
              </Button>
            )}
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher une entreprise..."
              className="pl-10 bg-secondary/50 border-0"
            />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Entreprise</TableHead>
                  <TableHead className="text-muted-foreground">Contact</TableHead>
                  <TableHead className="text-muted-foreground">Véhicules</TableHead>
                  <TableHead className="text-muted-foreground">Statut</TableHead>
                  <TableHead className="text-muted-foreground">Date d'inscription</TableHead>
                  {user?.role === 'admin' && (
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enterprises.map((enterprise) => (
                  <TableRow key={enterprise.id} className="border-border/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{enterprise.name}</p>
                          <p className="text-sm text-muted-foreground">{enterprise.address}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{enterprise.contactEmail}</p>
                      <p className="text-sm text-muted-foreground">{enterprise.phone}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{enterprise.deviceCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(enterprise.status)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(enterprise.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    {user?.role === 'admin' && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EnterprisesPage;
