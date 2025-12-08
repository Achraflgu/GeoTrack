import { LucideIcon, Car, Truck, Bike, Bus } from "lucide-react";

export const getVehicleIcon = (type: string): LucideIcon => {
  switch (type) {
    case 'truck':
      return Truck;
    case 'motorcycle':
      return Bike;
    case 'bus':
      return Bus;
    case 'van':
      return Truck;
    default:
      return Car;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'online':
      return 'bg-success';
    case 'moving':
      return 'bg-primary';
    case 'idle':
      return 'bg-warning';
    case 'offline':
      return 'bg-muted';
    case 'alert':
      return 'bg-destructive';
    default:
      return 'bg-muted';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'online':
      return 'En ligne';
    case 'moving':
      return 'En mouvement';
    case 'idle':
      return 'À l\'arrêt';
    case 'offline':
      return 'Hors ligne';
    case 'alert':
      return 'Alerte';
    default:
      return status;
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatSpeed = (speed: number): string => {
  return `${speed} km/h`;
};

export const formatBattery = (battery: number): string => {
  return `${battery}%`;
};

export const getRoleName = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Administrateur';
    case 'operator':
      return 'Opérateur';
    case 'supervisor':
      return 'Superviseur';
    default:
      return role;
  }
};

export const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-destructive text-destructive-foreground';
    case 'operator':
      return 'bg-primary text-primary-foreground';
    case 'supervisor':
      return 'bg-warning text-warning-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};
