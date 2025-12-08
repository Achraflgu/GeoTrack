import { create } from 'zustand';
import { Device, Enterprise, User, mockDevices, mockEnterprises, mockUsers } from './mock-data';

export interface Alert {
  id: string;
  type: 'battery' | 'offline' | 'geofence' | 'speed' | 'sos';
  deviceId: string;
  deviceName: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'low' | 'medium' | 'high';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

interface AppState {
  devices: Device[];
  enterprises: Enterprise[];
  users: User[];
  alerts: Alert[];
  selectedDevice: Device | null;
  selectedEnterprise: Enterprise | null;
  searchQuery: string;
  statusFilter: string;
  sidebarOpen: boolean;
  
  // Actions
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  updateDevice: (id: string, data: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
  
  setEnterprises: (enterprises: Enterprise[]) => void;
  addEnterprise: (enterprise: Enterprise) => void;
  updateEnterprise: (id: string, data: Partial<Enterprise>) => void;
  deleteEnterprise: (id: string) => void;
  
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  addAlert: (alert: Alert) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  deleteAlert: (id: string) => void;
  
  setSelectedDevice: (device: Device | null) => void;
  setSelectedEnterprise: (enterprise: Enterprise | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  setSidebarOpen: (open: boolean) => void;
  
  getFilteredDevices: () => Device[];
  getUnreadAlertsCount: () => number;
}

// Generate mock alerts
const generateMockAlerts = (): Alert[] => [
  {
    id: 'alert-001',
    type: 'battery',
    deviceId: 'dev-006',
    deviceName: 'Bus AT-002',
    message: 'Niveau de batterie critique (15%)',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    read: false,
    severity: 'high',
  },
  {
    id: 'alert-002',
    type: 'offline',
    deviceId: 'dev-007',
    deviceName: 'Fourgon SL-001',
    message: 'Appareil hors ligne depuis 1 heure',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    severity: 'medium',
  },
  {
    id: 'alert-003',
    type: 'speed',
    deviceId: 'dev-005',
    deviceName: 'Camion AT-001',
    message: 'Excès de vitesse détecté (78 km/h)',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    read: true,
    severity: 'low',
  },
  {
    id: 'alert-004',
    type: 'geofence',
    deviceId: 'dev-001',
    deviceName: 'Camion TL-001',
    message: 'Sortie de la zone autorisée',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    read: false,
    severity: 'medium',
  },
];

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  login: async (email: string, password: string) => {
    const user = mockUsers.find(u => u.email === email);
    if (user && password === 'demo123') {
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  updateProfile: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },
}));

export const useAppStore = create<AppState>((set, get) => ({
  devices: mockDevices,
  enterprises: mockEnterprises,
  users: mockUsers,
  alerts: generateMockAlerts(),
  selectedDevice: null,
  selectedEnterprise: null,
  searchQuery: '',
  statusFilter: 'all',
  sidebarOpen: true,
  
  setDevices: (devices) => set({ devices }),
  addDevice: (device) => set((state) => ({ devices: [...state.devices, device] })),
  updateDevice: (id, data) => set((state) => ({
    devices: state.devices.map(d => d.id === id ? { ...d, ...data } : d),
  })),
  deleteDevice: (id) => set((state) => ({
    devices: state.devices.filter(d => d.id !== id),
    selectedDevice: state.selectedDevice?.id === id ? null : state.selectedDevice,
  })),
  
  setEnterprises: (enterprises) => set({ enterprises }),
  addEnterprise: (enterprise) => set((state) => ({ enterprises: [...state.enterprises, enterprise] })),
  updateEnterprise: (id, data) => set((state) => ({
    enterprises: state.enterprises.map(e => e.id === id ? { ...e, ...data } : e),
  })),
  deleteEnterprise: (id) => set((state) => ({
    enterprises: state.enterprises.filter(e => e.id !== id),
    selectedEnterprise: state.selectedEnterprise?.id === id ? null : state.selectedEnterprise,
  })),
  
  setUsers: (users) => set({ users }),
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  updateUser: (id, data) => set((state) => ({
    users: state.users.map(u => u.id === id ? { ...u, ...data } : u),
  })),
  deleteUser: (id) => set((state) => ({
    users: state.users.filter(u => u.id !== id),
  })),
  
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  markAlertRead: (id) => set((state) => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, read: true } : a),
  })),
  markAllAlertsRead: () => set((state) => ({
    alerts: state.alerts.map(a => ({ ...a, read: true })),
  })),
  deleteAlert: (id) => set((state) => ({
    alerts: state.alerts.filter(a => a.id !== id),
  })),
  
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setSelectedEnterprise: (enterprise) => set({ selectedEnterprise: enterprise }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  getFilteredDevices: () => {
    const state = get();
    const { user } = useAuthStore.getState();
    
    let filtered = state.devices;
    
    if (user?.role === 'operator' && user.enterpriseId) {
      filtered = filtered.filter(d => d.enterpriseId === user.enterpriseId);
    }
    
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(query) ||
        d.licensePlate.toLowerCase().includes(query) ||
        d.enterpriseName.toLowerCase().includes(query) ||
        d.location.address.toLowerCase().includes(query)
      );
    }
    
    if (state.statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === state.statusFilter);
    }
    
    return filtered;
  },
  
  getUnreadAlertsCount: () => {
    return get().alerts.filter(a => !a.read).length;
  },
}));
