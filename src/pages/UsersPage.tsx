import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { mockUsers } from '@/lib/mock-data';
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
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Shield, UserCircle } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Navigate } from 'react-router-dom';
import { getRoleName, getRoleColor, formatDate } from '@/lib/utils-geo';

const UsersPage = () => {
  const { user } = useAuthStore();

  // Only admin can access
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

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
                {mockUsers.map((u) => {
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
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir le profil
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
