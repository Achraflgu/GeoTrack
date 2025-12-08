import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-16 md:ml-64 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
