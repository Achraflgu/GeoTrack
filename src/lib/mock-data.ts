// Mock data for the GPS tracking platform

export interface Enterprise {
  id: string;
  name: string;
  logo?: string;
  contactEmail: string;
  phone: string;
  address: string;
  createdAt: string;
  deviceCount: number;
  status: 'active' | 'suspended' | 'pending';
}

export interface Device {
  id: string;
  imei: string;
  name: string;
  vehicleType: 'car' | 'truck' | 'motorcycle' | 'van' | 'bus';
  licensePlate: string;
  enterpriseId: string;
  enterpriseName: string;
  status: 'online' | 'offline' | 'moving' | 'idle' | 'alert';
  lastUpdate: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  speed: number;
  heading: number;
  battery: number;
  signal: number;
}

export interface LocationHistory {
  timestamp: string;
  lat: number;
  lng: number;
  speed: number;
  address: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'supervisor';
  enterpriseId?: string;
  enterpriseName?: string;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
}

// Mock enterprises
export const mockEnterprises: Enterprise[] = [
  {
    id: 'ent-001',
    name: 'TransLogistics SA',
    contactEmail: 'contact@translogistics.dz',
    phone: '+213 21 45 67 89',
    address: 'Zone Industrielle, Alger',
    createdAt: '2024-01-15',
    deviceCount: 25,
    status: 'active',
  },
  {
    id: 'ent-002',
    name: 'Rapid Delivery Co',
    contactEmail: 'info@rapiddelivery.dz',
    phone: '+213 21 78 90 12',
    address: 'Bab Ezzouar, Alger',
    createdAt: '2024-02-20',
    deviceCount: 18,
    status: 'active',
  },
  {
    id: 'ent-003',
    name: 'Atlas Transport',
    contactEmail: 'atlas@transport.dz',
    phone: '+213 31 45 67 89',
    address: 'Oran Centre',
    createdAt: '2024-03-10',
    deviceCount: 32,
    status: 'active',
  },
  {
    id: 'ent-004',
    name: 'Sahara Logistics',
    contactEmail: 'contact@saharalog.dz',
    phone: '+213 49 12 34 56',
    address: 'Ghardaia',
    createdAt: '2024-04-05',
    deviceCount: 12,
    status: 'pending',
  },
];

// Mock devices with locations across Algeria
export const mockDevices: Device[] = [
  {
    id: 'dev-001',
    imei: '359072012345678',
    name: 'Camion TL-001',
    vehicleType: 'truck',
    licensePlate: '00123-116-16',
    enterpriseId: 'ent-001',
    enterpriseName: 'TransLogistics SA',
    status: 'moving',
    lastUpdate: new Date().toISOString(),
    location: { lat: 36.7538, lng: 3.0588, address: 'Alger Centre' },
    speed: 65,
    heading: 45,
    battery: 85,
    signal: 92,
  },
  {
    id: 'dev-002',
    imei: '359072012345679',
    name: 'Fourgon TL-002',
    vehicleType: 'van',
    licensePlate: '00456-116-16',
    enterpriseId: 'ent-001',
    enterpriseName: 'TransLogistics SA',
    status: 'idle',
    lastUpdate: new Date(Date.now() - 300000).toISOString(),
    location: { lat: 36.7725, lng: 3.0420, address: 'Bab El Oued' },
    speed: 0,
    heading: 180,
    battery: 72,
    signal: 88,
  },
  {
    id: 'dev-003',
    imei: '359072012345680',
    name: 'Voiture RD-001',
    vehicleType: 'car',
    licensePlate: '00789-116-16',
    enterpriseId: 'ent-002',
    enterpriseName: 'Rapid Delivery Co',
    status: 'online',
    lastUpdate: new Date(Date.now() - 60000).toISOString(),
    location: { lat: 36.7654, lng: 3.0987, address: 'Bab Ezzouar' },
    speed: 0,
    heading: 90,
    battery: 95,
    signal: 100,
  },
  {
    id: 'dev-004',
    imei: '359072012345681',
    name: 'Moto RD-002',
    vehicleType: 'motorcycle',
    licensePlate: '00111-116-16',
    enterpriseId: 'ent-002',
    enterpriseName: 'Rapid Delivery Co',
    status: 'moving',
    lastUpdate: new Date().toISOString(),
    location: { lat: 36.7432, lng: 3.0756, address: 'Hussein Dey' },
    speed: 42,
    heading: 270,
    battery: 68,
    signal: 85,
  },
  {
    id: 'dev-005',
    imei: '359072012345682',
    name: 'Camion AT-001',
    vehicleType: 'truck',
    licensePlate: '00222-131-31',
    enterpriseId: 'ent-003',
    enterpriseName: 'Atlas Transport',
    status: 'moving',
    lastUpdate: new Date().toISOString(),
    location: { lat: 35.6969, lng: -0.6331, address: 'Oran Centre' },
    speed: 78,
    heading: 120,
    battery: 90,
    signal: 95,
  },
  {
    id: 'dev-006',
    imei: '359072012345683',
    name: 'Bus AT-002',
    vehicleType: 'bus',
    licensePlate: '00333-131-31',
    enterpriseId: 'ent-003',
    enterpriseName: 'Atlas Transport',
    status: 'alert',
    lastUpdate: new Date(Date.now() - 120000).toISOString(),
    location: { lat: 35.7323, lng: -0.5489, address: 'Es Senia, Oran' },
    speed: 0,
    heading: 0,
    battery: 15,
    signal: 45,
  },
  {
    id: 'dev-007',
    imei: '359072012345684',
    name: 'Fourgon SL-001',
    vehicleType: 'van',
    licensePlate: '00444-147-47',
    enterpriseId: 'ent-004',
    enterpriseName: 'Sahara Logistics',
    status: 'offline',
    lastUpdate: new Date(Date.now() - 3600000).toISOString(),
    location: { lat: 32.4908, lng: 3.6736, address: 'Ghardaia' },
    speed: 0,
    heading: 0,
    battery: 0,
    signal: 0,
  },
  {
    id: 'dev-008',
    imei: '359072012345685',
    name: 'Camion TL-003',
    vehicleType: 'truck',
    licensePlate: '00555-116-16',
    enterpriseId: 'ent-001',
    enterpriseName: 'TransLogistics SA',
    status: 'moving',
    lastUpdate: new Date().toISOString(),
    location: { lat: 36.4650, lng: 2.8287, address: 'Blida' },
    speed: 55,
    heading: 200,
    battery: 78,
    signal: 90,
  },
];

// Mock users
export const mockUsers: User[] = [
  {
    id: 'user-001',
    email: 'admin@geotrack.dz',
    name: 'Ahmed Benali',
    role: 'admin',
    avatar: undefined,
    createdAt: '2024-01-01',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-002',
    email: 'operator@translogistics.dz',
    name: 'Karim Meziane',
    role: 'operator',
    enterpriseId: 'ent-001',
    enterpriseName: 'TransLogistics SA',
    createdAt: '2024-01-16',
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'user-003',
    email: 'supervisor@gn.dz',
    name: 'Colonel Rachid',
    role: 'supervisor',
    createdAt: '2024-01-10',
    lastLogin: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Stats calculation
export const getStats = (devices: Device[]) => {
  const total = devices.length;
  const online = devices.filter(d => d.status === 'online' || d.status === 'moving' || d.status === 'idle').length;
  const offline = devices.filter(d => d.status === 'offline').length;
  const moving = devices.filter(d => d.status === 'moving').length;
  const alerts = devices.filter(d => d.status === 'alert').length;
  
  return { total, online, offline, moving, alerts };
};

// Generate location history
export const generateLocationHistory = (deviceId: string, hours: number = 24): LocationHistory[] => {
  const history: LocationHistory[] = [];
  const device = mockDevices.find(d => d.id === deviceId);
  if (!device) return history;

  const baseLocation = device.location;
  const now = new Date();

  for (let i = hours * 4; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 15 * 60 * 1000);
    const offset = (hours * 4 - i) / (hours * 4);
    
    history.push({
      timestamp: timestamp.toISOString(),
      lat: baseLocation.lat + (Math.random() - 0.5) * 0.05 * offset,
      lng: baseLocation.lng + (Math.random() - 0.5) * 0.05 * offset,
      speed: Math.floor(Math.random() * 80),
      address: `Position ${i}`,
    });
  }

  return history;
};
