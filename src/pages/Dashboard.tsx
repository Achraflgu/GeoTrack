import DashboardLayout from '@/components/layout/DashboardLayout';
import MapView from '@/components/map/MapView';
import DeviceList from '@/components/devices/DeviceList';
import StatsBar from '@/components/dashboard/StatsBar';
import { useAppStore, useAuthStore } from '@/lib/store';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { selectedDevice, setSelectedDevice, getFilteredDevices } = useAppStore();
  const devices = getFilteredDevices();

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="h-16 px-6 flex items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-bold">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground">
              Bienvenue, {user?.name}
            </p>
          </div>
          <StatsBar />
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Map Panel */}
            <ResizablePanel defaultSize={70} minSize={50}>
              <div className="h-full p-4">
                <MapView 
                  devices={devices}
                  selectedDevice={selectedDevice}
                  onDeviceSelect={setSelectedDevice}
                  className="h-full"
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Device List Panel */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
              <div className="h-full border-l border-border/50 bg-card/30">
                <DeviceList 
                  devices={devices}
                  selectedDevice={selectedDevice}
                  onDeviceSelect={setSelectedDevice}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
