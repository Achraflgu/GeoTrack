import { useState } from 'react';
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
import { Plus, Search, Building2, Radio, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Navigate, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import EnterpriseFormModal from '@/components/modals/EnterpriseFormModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { Enterprise } from '@/lib/types';
import { toast } from 'sonner';

const EnterprisesPage = () => {
  const { user } = useAuthStore();
  const { enterprises, deleteEnterprise } = useAppStore();
  const navigate = useNavigate();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);

  // Only admin and supervisor can access
  if (user?.role === 'operator') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleEdit = (enterprise: Enterprise) => {
    setSelectedEnterprise(enterprise);
    setFormModalOpen(true);
  };

  const handleDelete = (enterprise: Enterprise) => {
    setSelectedEnterprise(enterprise);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEnterprise) {
      deleteEnterprise(selectedEnterprise.id);
      toast.success('Entreprise supprimée');
      setDeleteModalOpen(false);
    }
  };

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
              <Button variant="hero" onClick={() => { setSelectedEnterprise(null); setFormModalOpen(true); }}>
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
                  <TableHead className="text-muted-foreground">Appareils</TableHead>
                  <TableHead className="text-muted-foreground">Statut</TableHead>
                  <TableHead className="text-muted-foreground">Date d'inscription</TableHead>
                  {user?.role === 'admin' && (
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enterprises.map((enterprise) => (
                  <TableRow
                    key={enterprise.id}
                    className="border-border/50 cursor-pointer hover:bg-secondary/50"
                    onClick={() => navigate(`/enterprises/${enterprise.id}`)}
                  >
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
                        <Radio className="w-4 h-4 text-muted-foreground" />
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/enterprises/${enterprise.id}`); }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(enterprise); }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(enterprise); }}>
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

      <EnterpriseFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        enterprise={selectedEnterprise}
      />

      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer l'entreprise"
        description={`Êtes-vous sûr de vouloir supprimer "${selectedEnterprise?.name}" ?`}
      />
    </DashboardLayout>
  );
};

export default EnterprisesPage;
