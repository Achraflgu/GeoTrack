import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore, useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Shield, UserCircle } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Navigate } from 'react-router-dom';
import { getRoleName, getRoleColor, formatDate } from '@/lib/utils-geo';
import UserFormModal from '@/components/modals/UserFormModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { User } from '@/lib/mock-data';
import { toast } from 'sonner';

const UsersPage = () => {
  const { user } = useAuthStore();
  const { users, deleteUser } = useAppStore();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleEdit = (u: User) => {
    setSelectedUser(u);
    setFormModalOpen(true);
  };

  const handleDelete = (u: User) => {
    setSelectedUser(u);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUser(selectedUser.id);
      toast.success('Utilisateur supprimé');
      setDeleteModalOpen(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Shield;
      default:
        return UserCircle;
    }
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Utilisateurs</h1>
              <p className="text-sm text-muted-foreground">
                {mockUsers.length} utilisateur{mockUsers.length !== 1 ? 's' : ''} enregistré{mockUsers.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un utilisateur..."
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
                  <TableHead className="text-muted-foreground">Utilisateur</TableHead>
                  <TableHead className="text-muted-foreground">Rôle</TableHead>
                  <TableHead className="text-muted-foreground">Entreprise</TableHead>
                  <TableHead className="text-muted-foreground">Dernière connexion</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const RoleIcon = getRoleIcon(u.role);
                  return (
                    <TableRow key={u.id} className="border-border/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {u.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(u.role)}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {getRoleName(u.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.enterpriseName || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(u.lastLogin)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(u)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(u)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <UserFormModal 
        open={formModalOpen} 
        onClose={() => setFormModalOpen(false)} 
        user={selectedUser}
      />
      
      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer l'utilisateur"
        description={`Êtes-vous sûr de vouloir supprimer "${selectedUser?.name}" ?`}
      />
    </DashboardLayout>
  );
};

export default UsersPage;
