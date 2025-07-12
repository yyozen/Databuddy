"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Globe,
  BarChart3,
  Settings,
  PanelLeftIcon,
  HomeIcon,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from "./sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleOverlayClick = () => setSidebarOpen(false);
  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleOverlayClick}
          onKeyDown={handleOverlayKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div className={`fixed md:relative z-50 md:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            onKeyDown={(e) => e.key === 'Enter' && setSidebarOpen(true)}
            className="md:hidden"
          >
            <PanelLeftIcon className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <LayoutDashboard className="h-6 w-6" />
            <span>Databuddy</span>
          </Link>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
} 