import { create } from 'zustand';
import { Device, Enterprise, User, mockDevices, mockEnterprises, mockUsers } from './mock-data';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

interface AppState {
  devices: Device[];
  enterprises: Enterprise[];
  selectedDevice: Device | null;
  selectedEnterprise: Enterprise | null;
  searchQuery: string;
  statusFilter: string;
  setDevices: (devices: Device[]) => void;
  setEnterprises: (enterprises: Enterprise[]) => void;
  setSelectedDevice: (device: Device | null) => void;
  setSelectedEnterprise: (enterprise: Enterprise | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  getFilteredDevices: () => Device[];
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  login: async (email: string, password: string) => {
    // Mock login - find user by email
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
}));

export const useAppStore = create<AppState>((set, get) => ({
  devices: mockDevices,
  enterprises: mockEnterprises,
  selectedDevice: null,
  selectedEnterprise: null,
  searchQuery: '',
  statusFilter: 'all',
  setDevices: (devices) => set({ devices }),
  setEnterprises: (enterprises) => set({ enterprises }),
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setSelectedEnterprise: (enterprise) => set({ selectedEnterprise: enterprise }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  getFilteredDevices: () => {
    const state = get();
    const { user } = useAuthStore.getState();
    
    let filtered = state.devices;
    
    // Filter by enterprise if operator
    if (user?.role === 'operator' && user.enterpriseId) {
      filtered = filtered.filter(d => d.enterpriseId === user.enterpriseId);
    }
    
    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(query) ||
        d.licensePlate.toLowerCase().includes(query) ||
        d.enterpriseName.toLowerCase().includes(query) ||
        d.location.address.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (state.statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === state.statusFilter);
    }
    
    return filtered;
  },
}));
