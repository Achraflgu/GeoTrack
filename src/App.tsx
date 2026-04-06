import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import DevicesPage from "./pages/DevicesPage";
import DeviceDetailPage from "./pages/DeviceDetailPage";
import EnterprisesPage from "./pages/EnterprisesPage";
import EnterpriseDetailPage from "./pages/EnterpriseDetailPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import AlertsPage from "./pages/AlertsPage";
import SupportCenter from "./pages/SupportCenter";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import AuditLogsPage from "./pages/AuditLogsPage";
import GuidePage from "./pages/GuidePage";
import OrdersPage from "./pages/OrdersPage";
import GeofencesPage from "./pages/GeofencesPage";
import BillingPage from "./pages/BillingPage";
import PlanRoute from "./components/auth/PlanRoute";
import { useAppStore, useAuthStore } from "./lib/store";

const queryClient = new QueryClient();

const AppContent = () => {
  const { initializeData, initializeWebSocket } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const showChatbot = location.pathname === '/' || location.pathname === '/guide';

  // Initialize data from MongoDB when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[App] Initializing data from MongoDB...');
      initializeData();
      initializeWebSocket();
    }
  }, [isAuthenticated, initializeData, initializeWebSocket]);

  return (
    <>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/guide" element={<GuidePage />} />


      {/* Protected routes - require authentication */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
      <Route path="/devices" element={<ProtectedRoute><DevicesPage /></ProtectedRoute>} />
      <Route path="/devices/:id" element={<ProtectedRoute><DeviceDetailPage /></ProtectedRoute>} />

      {/* Admin & Supervisor only - Enterprises */}
      <Route path="/enterprises" element={<RoleRoute allowedRoles={['admin', 'supervisor']}><EnterprisesPage /></RoleRoute>} />
      <Route path="/enterprises/:id" element={<RoleRoute allowedRoles={['admin', 'supervisor']}><EnterpriseDetailPage /></RoleRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
      <Route path="/geofences" element={<ProtectedRoute><PlanRoute requiredPlan="pro"><GeofencesPage /></PlanRoute></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><SupportCenter /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />

      {/* Admin & Supervisor routes (read-only for supervisors handled in pages) */}
      <Route path="/users" element={<RoleRoute allowedRoles={['admin', 'supervisor']}><UsersPage /></RoleRoute>} />
      <Route path="/admin/logs" element={<RoleRoute allowedRoles={['admin']}><AuditLogsPage /></RoleRoute>} />
      <Route path="/admin/orders" element={<RoleRoute allowedRoles={['admin']}><OrdersPage /></RoleRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    <div style={{ display: showChatbot ? 'block' : 'none' }}>
      <ChatbotWidget />
    </div>
    </>
  );
};

import { ThemeProvider } from './lib/theme';
import { I18nProvider } from './lib/i18n';

const App = () => (
  <ThemeProvider>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="bottom-left" richColors closeButton visibleToasts={3} />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </I18nProvider>
  </ThemeProvider>
);

export default App;

