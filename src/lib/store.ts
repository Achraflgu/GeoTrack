import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { Device, Enterprise, User, Alert, SupportTicket, SupportMessage } from './types';
import { devicesApi, enterprisesApi, usersApi, statsApi, alertsApi, auditApi, createWebSocket, authApi, supportApi, billingApi } from './api';

// Re-export Alert type for backwards compatibility
export type { Alert } from './types';

interface LoginResult {
  success: boolean;
  needsVerification: boolean;
  needsPasswordSetup?: boolean;
  emailVerified?: boolean;
  email?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  completeVerification: () => void;
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
  enterpriseFilter: string;
  sidebarOpen: boolean;
  isLoading: boolean;
  wsConnected: boolean;
  supportTickets: SupportTicket[];
  supportMessages: Record<string, SupportMessage[]>; // ticketId -> messages
  activeTicketId: string | null;

  // Actions
  fetchDevices: () => Promise<void>;
  fetchEnterprises: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  initializeData: () => Promise<void>;
  initializeWebSocket: () => void;

  setDevices: (devices: Device[]) => void;
  addDevice: (device: any) => Promise<void>;
  updateDevice: (id: string, data: Partial<Device>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;

  setEnterprises: (enterprises: Enterprise[]) => void;
  addEnterprise: (enterprise: any) => Promise<void>;
  updateEnterprise: (id: string, data: Partial<Enterprise>) => Promise<void>;
  deleteEnterprise: (id: string) => Promise<void>;

  setUsers: (users: User[]) => void;
  addUser: (user: any) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  fetchAlerts: () => Promise<void>;
  addAlert: (alert: Omit<Alert, 'id'>) => Promise<void>;
  markAlertRead: (id: string) => Promise<void>;
  markAllAlertsRead: () => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;

  // Support Actions
  fetchTickets: () => Promise<void>;
  fetchMessages: (ticketId: string) => Promise<void>;
  createTicket: (subject: string, message: string) => Promise<void>;
  sendMessage: (ticketId: string, message: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: 'open' | 'closed') => Promise<void>;
  setActiveTicketId: (id: string | null) => void;
  addSupportMessage: (message: SupportMessage) => void;

  setSelectedDevice: (device: Device | null) => void;
  setSelectedEnterprise: (enterprise: Enterprise | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  setEnterpriseFilter: (filter: string) => void;
  setSidebarOpen: (open: boolean) => void;

  getFilteredDevices: () => Device[];
  getUnreadAlertsCount: () => number;
  resetData: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        try {
          // --- DEMO MODE BYPASS ---
          if (email === 'demo@geotrack.tn') {
            const demoUser: User = {
              id: 'demo-user-id',
              name: 'Opérateur Démo',
              email: 'demo@geotrack.tn',
              role: 'operator',
              enterpriseId: 'demo-enterprise',
              createdAt: new Date().toISOString()
            };
            set({ user: demoUser, isAuthenticated: true });

            // Populate app store with some mock devices for the demo
            useAppStore.getState().setDevices([
              {
                id: 'demo-dev-1',
                imei: '862000000000001',
                name: 'Camion Transport A1',
                deviceType: 'vehicle',
                serialNumber: 'SN-001',
                enterpriseId: 'demo-enterprise',
                enterpriseName: 'Demo Transport',
                status: 'online',
                lastUpdate: new Date().toISOString(),
                location: { lat: 36.8065, lng: 10.1815, address: 'Tunis, Tunisie' },
                speed: 45,
                heading: 120,
                battery: 98,
                signal: 85,
              } as Device,
              {
                id: 'demo-dev-2',
                imei: '862000000000002',
                name: 'Voiture Commercial B2',
                deviceType: 'vehicle',
                serialNumber: 'SN-002',
                enterpriseId: 'demo-enterprise',
                enterpriseName: 'Demo Transport',
                status: 'offline',
                lastUpdate: new Date(Date.now() - 3600000).toISOString(),
                location: { lat: 35.8256, lng: 10.6369, address: 'Sousse, Tunisie' },
                speed: 0,
                heading: 0,
                battery: 12,
                signal: 0,
              } as Device
            ]);

            return { success: true, needsVerification: false };
          }
          // ------------------------

          const result = await authApi.login({ email, password });

          if (result.needsVerification) {
            set({ user: result.user, isAuthenticated: false });
            return {
              success: true,
              needsVerification: true,
              email: result.email,
              needsPasswordSetup: result.needsPasswordSetup,
              emailVerified: result.emailVerified
            };
          }

          if (result.success && result.user) {
            set({ user: result.user, isAuthenticated: true });
            return { success: true, needsVerification: false };
          }

          return { success: false, needsVerification: false };
        } catch (error: any) {
          console.error('[Auth] Login error:', error);
          toast.error(error.message || 'Erreur de connexion');
          return { success: false, needsVerification: false };
        }
      },
      logout: async () => {
        const currentUser = get().user;

        // Create audit log for logout before clearing user
        if (currentUser && currentUser.email !== 'demo@geotrack.tn') {
          try {
            await auditApi.create({
              action: 'user.logout',
              userName: currentUser.name,
              ip: 'client'
            });
            console.log('[Audit] Logout logged for', currentUser.name);
          } catch (auditError) {
            console.error('[Audit] Failed to log logout:', auditError);
          }
        }

        // Reset application data on logout
        useAppStore.getState().resetData();

        set({ user: null, isAuthenticated: false });
      },
      completeVerification: async () => {
        const currentUser = get().user;
        if (currentUser) {
          set({ isAuthenticated: true });
          // Create audit log for login after verification
          if (currentUser.email !== 'demo@geotrack.tn') {
            try {
              await auditApi.create({
                action: 'user.login',
                userName: currentUser.name,
                ip: 'client'
              });
              console.log('[Audit] Login logged after verification for', currentUser.name);
            } catch (auditError) {
              console.error('[Audit] Failed to log login:', auditError);
            }
          }
        }
      },
      updateProfile: async (data) => {
        const currentUser = get().user;
        if (currentUser) {
          try {
            // Persist to database
            await usersApi.update(currentUser.id, data);
            set({ user: { ...currentUser, ...data } });
          } catch (error) {
            console.error('Failed to update profile:', error);
            // Still update local state even if API fails
            set({ user: { ...currentUser, ...data } });
          }
        }
      },
    }),
    {
      name: 'geotrack-auth',
    }
  )
);

// WebSocket instance
let wsInstance: WebSocket | null = null;

export const useAppStore = create<AppState>((set, get) => ({
  devices: [],
  enterprises: [],
  users: [],
  alerts: [],
  selectedDevice: null,
  selectedEnterprise: null,
  searchQuery: '',
  statusFilter: 'all',
  enterpriseFilter: 'all',
  sidebarOpen: true,
  isLoading: false,
  wsConnected: false,
  supportTickets: [],
  supportMessages: {},
  activeTicketId: null,

  // Fetch devices from MongoDB
  fetchDevices: async () => {
    try {
      const devices = await devicesApi.getAll();
      set({ devices });
      console.log(`[Store] Loaded ${devices.length} devices from MongoDB`);
    } catch (error) {
      console.error('[Store] Failed to fetch devices:', error);
    }
  },

  // Fetch enterprises from MongoDB
  fetchEnterprises: async () => {
    try {
      const enterprises = await enterprisesApi.getAll();
      set({ enterprises });
      console.log(`[Store] Loaded ${enterprises.length} enterprises from MongoDB`);
    } catch (error) {
      console.error('[Store] Failed to fetch enterprises:', error);
    }
  },

  // Fetch users from MongoDB
  fetchUsers: async () => {
    try {
      const users = await usersApi.getAll();
      set({ users });
      console.log(`[Store] Loaded ${users.length} users from MongoDB`);
    } catch (error) {
      console.error('[Store] Failed to fetch users:', error);
    }
  },

  // Initialize all data from MongoDB
  initializeData: async () => {
    set({ isLoading: true });
    try {
      const authUser = useAuthStore.getState().user;
      
      // Keep auth store synced with the real billing status on load
      if (authUser?.role === 'operator') {
          try {
              const planData = await billingApi.getCurrentPlan(authUser.id);
              if (planData && (planData.billingStatus !== (authUser as any).billingStatus)) {
                  useAuthStore.setState({
                      user: { ...authUser, billingStatus: planData.billingStatus, billingNextDue: planData.billingNextDue } as any
                  });
              }
          } catch(e) { console.error('Failed to sync billing state', e); }
      }

      await Promise.all([
        get().fetchDevices(),
        get().fetchEnterprises(),
        get().fetchUsers(),
        get().fetchAlerts(),
      ]);
    } finally {
      set({ isLoading: false });
    }
  },

  // Initialize WebSocket for real-time updates
  initializeWebSocket: () => {
    if (wsInstance) return;

    // Get current user for identification
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    const identifyData = {
      enterpriseId: currentUser.role === 'operator' ? currentUser.enterpriseId : undefined,
      role: currentUser.role
    };

    wsInstance = createWebSocket(
      (devices) => {
        // Double check authentication before updating state
        if (!useAuthStore.getState().isAuthenticated) return;

        // Transform MongoDB format to frontend format
        const formatted = devices.map((d: any) => ({
          id: d._id,
          imei: d.imei,
          name: d.name,
          deviceType: d.deviceType,
          serialNumber: d.serialNumber,
          subscriberNumber: d.subscriberNumber,
          plateId: d.plateId,
          assignedTo: d.assignedTo,
          enterpriseId: d.enterpriseId,
          enterpriseName: d.enterpriseName,
          dataSource: d.dataSource,
          trackingToken: d.trackingToken,
          status: d.status,
          lastUpdate: d.lastUpdate,
          location: {
            lat: d.location?.coordinates?.[1] || 36.8065,
            lng: d.location?.coordinates?.[0] || 10.1815,
            address: d.address || '',
          },
          speed: d.speed,
          heading: d.heading,
          battery: d.battery,
          signal: d.signal,
          simulation: d.simulation,
          isRunning: d.simulation?.isRunning
        }));

        set({ devices: formatted, wsConnected: true });
      },
      (newAlert) => {
        // ... omitted for brevity but keeping same logic
        if (!useAuthStore.getState().isAuthenticated) return;
        const formattedAlert: Alert = {
          id: newAlert._id,
          deviceId: newAlert.deviceId,
          deviceName: newAlert.deviceName,
          type: newAlert.type,
          severity: newAlert.severity,
          message: newAlert.message,
          read: newAlert.read,
          timestamp: newAlert.createdAt || new Date().toISOString()
        };
        set((state) => ({ alerts: [formattedAlert, ...state.alerts] }));

        // Notification Settings Check
        const savedSettings = localStorage.getItem('app-settings');
        const settings = savedSettings ? JSON.parse(savedSettings) : { alertPush: true, alertBattery: true, alertOffline: true, alertSound: false };

        // Do not show any toasts if push notifications are disabled globally in settings
        if (settings.alertPush === false) return;
        
        // Do not show specific alert types if disabled in settings
        if (newAlert.type === 'battery' && settings.alertBattery === false) return;
        if (newAlert.type === 'offline' && settings.alertOffline === false) return;

        // Do not show notifications on public landing or login pages
        const currentPath = window.location.pathname;
        if (currentPath === '/' || currentPath === '/login' || currentPath === '/guide') return;

        // 10s deduplication per device/type to avoid toast flood
        const toastKey = `toast_${newAlert.deviceId}_${newAlert.type}`;
        const lastToastAt = (window as any)[toastKey];
        const now = Date.now();
        if (lastToastAt && (now - lastToastAt) < 10000) return;
        (window as any)[toastKey] = now;

        const alertIcons: Record<string, string> = { speed: '⚡', battery: '🔋', geofence: '🚨', sos: '🆘', offline: '🔌' };
        
        const showDevice = () => {
          window.location.href = `/devices/${newAlert.deviceId}`;
        };

        const toastFn = newAlert.severity === 'high' ? toast.error : (newAlert.severity === 'medium' ? toast.warning : toast.info);
        
        toastFn(`${alertIcons[newAlert.type] || '🔔'} ${newAlert.deviceName}`, {
          description: newAlert.message,
          duration: 3000,
          action: {
            label: 'Voir',
            onClick: showDevice
          }
        });

        // Play sound if enabled
        if (settings.alertSound === true) {
          try {
            const audio = new Audio('/alert-sound.mp3'); 
            audio.play().catch(e => console.log('Audio play failed', e));
          } catch (e) {}
        }
      },
      (supportMsg) => {
        if (!useAuthStore.getState().isAuthenticated) return;
        const formattedMsg: SupportMessage = {
          id: supportMsg._id,
          ...supportMsg
        };
        get().addSupportMessage(formattedMsg);

        // Notify if not active ticket
        if (get().activeTicketId !== formattedMsg.ticketId) {
          toast.info(`Nouveau message de ${formattedMsg.senderName}`, {
            description: formattedMsg.message.substring(0, 50) + (formattedMsg.message.length > 50 ? '...' : ''),
            action: {
              label: 'Voir',
              onClick: () => get().setActiveTicketId(formattedMsg.ticketId)
            }
          });
        }
      },
      (ticket) => {
        if (!useAuthStore.getState().isAuthenticated) return;
        // ticket already has both _id and id from formatTicket()
        const formattedTicket = { ...ticket, id: ticket.id || ticket._id };
        set((state) => ({
          supportTickets: state.supportTickets.map(t =>
            t.id === formattedTicket.id ? { ...t, ...formattedTicket } : t
          )
        }));

        if (formattedTicket.status === 'closed') {
          toast.success(`Le ticket "${formattedTicket.subject}" a été résolu`);
        } else if (formattedTicket.status === 'open' && formattedTicket.lastMessage) {
          // Ticket got a new message from admin — show toast if not currently viewing it
          const currentTicketId = get().activeTicketId;
          if (currentTicketId !== formattedTicket.id) {
            toast.info(`💬 Nouveau message sur "${formattedTicket.subject}"`, {
              description: formattedTicket.lastMessage?.substring(0, 60),
              action: {
                label: 'Voir',
                onClick: () => get().setActiveTicketId(formattedTicket.id)
              }
            });
          }
        }
      },
      { enterpriseId: currentUser.enterpriseId, role: currentUser.role, userId: currentUser.id },
      () => useAuthStore.getState().isAuthenticated
    );
  },

  setDevices: (devices) => set({ devices }),
  addDevice: async (device) => {
    if (useAuthStore.getState().user?.email === 'demo@geotrack.tn') {
      toast.error('Action non autorisée', { description: 'Mode lecture seule actif.' });
      return;
    }
    try {
      const newDevice = await devicesApi.create(device);
      const formatted = {
        id: newDevice._id,
        ...newDevice,
        location: {
          lat: newDevice.location.coordinates[1],
          lng: newDevice.location.coordinates[0],
          address: newDevice.address
        }
      };
      set((state) => ({ devices: [...state.devices, formatted] }));
    } catch (error) {
      console.error('[Store] Failed to add device:', error);
    }
  },
  updateDevice: async (id, data) => {
    if (useAuthStore.getState().user?.email === 'demo@geotrack.tn') {
      toast.error('Action non autorisée', { description: 'Mode lecture seule actif.' });
      return;
    }
    try {
      const updated = await devicesApi.update(id, data);
      set((state) => {
        const d = state.devices.find(dev => dev.id === id);
        if (!d) return state;
        
        const mergedLocation = updated.location && Array.isArray(updated.location.coordinates) 
          ? {
              lat: updated.location.coordinates[1],
              lng: updated.location.coordinates[0],
              address: updated.address || d.location?.address || 'Adresse inconnue'
            }
          : d.location;

        return {
          devices: state.devices.map(dev => dev.id === id ? { 
            ...dev, 
            ...updated, 
            location: mergedLocation 
          } : dev),
        };
      });
    } catch (error) {
      console.error('[Store] Failed to update device:', error);
    }
  },
  deleteDevice: async (id) => {
    if (useAuthStore.getState().user?.email === 'demo@geotrack.tn') {
      toast.error('Action non autorisée', { description: 'Mode lecture seule actif.' });
      return;
    }
    try {
      await devicesApi.delete(id);
      set((state) => ({
        devices: state.devices.filter(d => d.id !== id),
        selectedDevice: state.selectedDevice?.id === id ? null : state.selectedDevice,
      }));
    } catch (error) {
      console.error('[Store] Failed to delete device:', error);
    }
  },

  setEnterprises: (enterprises) => set({ enterprises }),
  addEnterprise: async (enterprise) => {
    if (useAuthStore.getState().user?.email === 'demo@geotrack.tn') {
      toast.error('Action non autorisée', { description: 'Mode lecture seule actif.' });
      return;
    }
    try {
      const newEnt = await enterprisesApi.create(enterprise);
      set((state) => ({ enterprises: [...state.enterprises, { ...newEnt, id: newEnt._id }] }));
    } catch (error) {
      console.error('[Store] Failed to add enterprise:', error);
      throw error; // Re-throw to allow component to handle specific validation errors
    }
  },
  updateEnterprise: async (id, data) => {
    if (useAuthStore.getState().user?.email === 'demo@geotrack.tn') {
      toast.error('Action non autorisée', { description: 'Mode lecture seule actif.' });
      return;
    }
    try {
      const updated = await enterprisesApi.update(id, data);
      set((state) => ({
        enterprises: state.enterprises.map(e => e.id === id ? { ...e, ...updated } : e),
      }));
    } catch (error) {
      console.error('[Store] Failed to update enterprise:', error);
      throw error;
    }
  },
  deleteEnterprise: async (id) => {
    if (useAuthStore.getState().user?.email === 'demo@geotrack.tn') {
      toast.error('Action non autorisée', { description: 'Mode lecture seule actif.' });
      return;
    }
    try {
      await enterprisesApi.delete(id);
      set((state) => ({
        enterprises: state.enterprises.filter(e => e.id !== id),
        selectedEnterprise: state.selectedEnterprise?.id === id ? null : state.selectedEnterprise,
      }));
    } catch (error) {
      console.error('[Store] Failed to delete enterprise:', error);
    }
  },

  setUsers: (users) => set({ users }),
  addUser: async (user) => {
    if (useAuthStore.getState().user?.email === 'demo@geotrack.tn') {
      toast.error('Action non autorisée', { description: 'Mode lecture seule actif.' });
      return;
    }
    try {
      const newUser = await usersApi.create(user);
      set((state) => ({ users: [...state.users, { ...newUser, id: newUser._id }] }));
    } catch (error) {
      console.error('[Store] Failed to add user:', error);
    }
  },
  updateUser: async (id, data) => {
    if (useAuthStore.getState().user?.email === 'demo@geotrack.tn') {
      toast.error('Action non autorisée', { description: 'Mode lecture seule actif.' });
      return;
    }
    try {
      const updated = await usersApi.update(id, data);
      set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...updated } : u),
      }));
    } catch (error) {
      console.error('[Store] Failed to update user:', error);
    }
  },
  deleteUser: async (id) => {
    if (useAuthStore.getState().user?.email === 'demo@geotrack.tn') {
      toast.error('Action non autorisée', { description: 'Mode lecture seule actif.' });
      return;
    }
    try {
      await usersApi.delete(id);
      set((state) => ({
        users: state.users.filter(u => u.id !== id),
      }));
    } catch (error) {
      console.error('[Store] Failed to delete user:', error);
    }
  },

  fetchAlerts: async () => {
    try {
      const user = useAuthStore.getState().user;
      const enterpriseId = user?.role === 'operator' ? user?.enterpriseId : undefined;
      const alerts = await alertsApi.getAll(enterpriseId, user?.id);
      set({ alerts });
    } catch (error) {
      console.error('[Store] Failed to fetch alerts:', error);
    }
  },
  addAlert: async (alert) => {
    try {
      const newAlert = await alertsApi.create(alert);
      set((state) => ({ alerts: [newAlert, ...state.alerts] }));
    } catch (error) {
      console.error('[Store] Failed to add alert:', error);
    }
  },
  markAlertRead: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) return;
      await alertsApi.markRead(id, user.id);
      set((state) => ({
        alerts: state.alerts.map(a => a.id === id ? { ...a, read: true } : a),
      }));
    } catch (error) {
      console.error('[Store] Failed to mark alert read:', error);
    }
  },
  markAllAlertsRead: async () => {
    try {
      const user = useAuthStore.getState().user;
      const enterpriseId = user?.role === 'operator' ? user?.enterpriseId : undefined;
      await alertsApi.markAllRead(enterpriseId, user?.id);
      set((state) => ({
        alerts: state.alerts.map(a => ({ ...a, read: true })),
      }));
    } catch (error) {
      console.error('[Store] Failed to mark all alerts read:', error);
    }
  },
  deleteAlert: async (id) => {
    try {
      await alertsApi.delete(id);
      set((state) => ({
        alerts: state.alerts.filter(a => a.id !== id),
      }));
    } catch (error) {
      console.error('[Store] Failed to delete alert:', error);
    }
  },

  // Support Actions
  fetchTickets: async () => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;
      const tickets = await supportApi.getTickets(user.id, user.role, user.enterpriseId);
      const formatted = tickets.map((t: any) => ({ ...t, id: t._id }));
      set({ supportTickets: formatted });
    } catch (error) {
      console.error('[Store] Failed to fetch tickets:', error);
    }
  },
  fetchMessages: async (ticketId) => {
    try {
      const messages = await supportApi.getMessages(ticketId);
      const formatted = messages.map((m: any) => ({ ...m, id: m._id }));
      set((state) => ({
        supportMessages: { ...state.supportMessages, [ticketId]: formatted }
      }));
    } catch (error) {
      console.error('[Store] Failed to fetch messages:', error);
    }
  },
  createTicket: async (subject, message) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const newTicket = await supportApi.createTicket({
        userId: user.id,
        userName: user.name,
        enterpriseId: user.enterpriseId,
        subject,
        message
      });

      const formatted = { ...newTicket, id: newTicket._id };
      set((state) => ({
        supportTickets: [formatted, ...state.supportTickets],
        activeTicketId: formatted.id
      }));

      // Also fetch messages to get the initial one
      await get().fetchMessages(formatted.id);

      toast.success('Rapport envoyé avec succès');
    } catch (error) {
      console.error('[Store] Failed to create ticket:', error);
      toast.error('Erreur lors de l\'envoi du rapport');
    }
  },
  sendMessage: async (ticketId, message) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const newMessage = await supportApi.sendMessage(ticketId, {
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        message
      });

      const formatted = { ...newMessage, id: newMessage._id };
      get().addSupportMessage(formatted);

      // Update last message in ticket list
      set((state) => ({
        supportTickets: state.supportTickets.map(t =>
          t.id === ticketId ? { ...t, lastMessage: message, lastMessageAt: new Date().toISOString() } : t
        )
      }));
    } catch (error) {
      console.error('[Store] Failed to send message:', error);
    }
  },
  updateTicketStatus: async (ticketId, status) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const updated = await supportApi.updateStatus(ticketId, status, user.name);
      const formatted = { ...updated, id: updated._id || updated.id };

      set((state) => ({
        supportTickets: state.supportTickets.map(t =>
          t.id === ticketId ? formatted : t
        )
      }));
      toast.success(status === 'closed' ? 'Ticket résolu' : 'Ticket réouvert');
    } catch (error) {
      console.error('[Store] Failed to update ticket status:', error);
    }
  },
  setActiveTicketId: (id) => set({ activeTicketId: id }),
  addSupportMessage: (message) => {
    set((state) => {
      const ticketMessages = state.supportMessages[message.ticketId] || [];
      // Prevent duplicates
      if (ticketMessages.some(m => m.id === message.id)) return state;

      return {
        supportMessages: {
          ...state.supportMessages,
          [message.ticketId]: [...ticketMessages, message]
        }
      };
    });
  },

  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setSelectedEnterprise: (enterprise) => set({ selectedEnterprise: enterprise }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setEnterpriseFilter: (filter) => set({ enterpriseFilter: filter }),
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
        d.serialNumber.toLowerCase().includes(query) ||
        d.enterpriseName.toLowerCase().includes(query) ||
        d.location?.address?.toLowerCase().includes(query)
      );
    }

    // Filter by enterprise
    if (state.enterpriseFilter && state.enterpriseFilter !== 'all') {
      filtered = filtered.filter(d => d.enterpriseId === state.enterpriseFilter);
    }

    if (state.statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === state.statusFilter);
    }

    return filtered;
  },

  getUnreadAlertsCount: () => {
    return get().alerts.filter(a => !a.read).length;
  },

  resetData: () => {
    set({
      devices: [],
      enterprises: [],
      users: [],
      alerts: [],
      selectedDevice: null,
      selectedEnterprise: null,
      searchQuery: '',
      statusFilter: 'all',
      enterpriseFilter: 'all',
      isLoading: false,
      wsConnected: false,
      supportTickets: [],
      supportMessages: {},
      activeTicketId: null,
    });

    // Close WebSocket if open
    if (wsInstance) {
      console.log('[WebSocket] Closing connection on data reset');
      wsInstance.close();
      wsInstance = null;
    }
  }
}));
