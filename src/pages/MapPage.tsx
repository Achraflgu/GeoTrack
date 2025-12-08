import DashboardLayout from '@/components/layout/DashboardLayout';
import MapView from '@/components/map/MapView';
import DeviceList from '@/components/devices/DeviceList';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Layers } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const MapPage = () => {
  const { selectedDevice, setSelectedDevice, getFilteredDevices } = useAppStore();
  const devices = getFilteredDevices();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <DashboardLayout>
      <div className="h-screen relative">
        {/* Full screen map */}
        <MapView 
          devices={devices}
          selectedDevice={selectedDevice}
          onDeviceSelect={setSelectedDevice}
          className="h-full rounded-none"
        />

        {/* Floating controls */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-card/90 backdrop-blur-sm shadow-lg"
          >
            <Layers className="w-4 h-4" />
          </Button>
        </div>

        {/* Floating sidebar */}
        <div className={cn(
          "absolute top-4 right-4 bottom-4 w-80 z-10 transition-all duration-300",
          sidebarOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        )}>
          <div className="h-full glass-card-elevated overflow-hidden">
            <DeviceList 
              devices={devices}
              selectedDevice={selectedDevice}
              onDeviceSelect={setSelectedDevice}
              compact
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MapPage;
