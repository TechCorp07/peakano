'use client';

import { useState } from 'react';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

/**
 * Main application layout with dark theme
 * Used for dashboard and other authenticated pages
 */
export default function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D1117]" data-theme="app">
      {/* Header */}
      <AppHeader />

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        {showSidebar && (
          <AppSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#0D1117]">
          {children}
        </main>
      </div>
    </div>
  );
}
