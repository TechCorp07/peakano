'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  User,
  LogOut,
  ChevronDown,
  Bell,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/features/auth/authSlice';
import { ROUTES } from '@/config/routes';

export default function AppHeader() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="h-14 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between px-4">
      {/* Left: Logo */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-semibold hidden md:block">MRI Training Platform</span>
        </Link>
      </div>

      {/* Right: Actions + Profile */}
      <div className="flex items-center gap-2">
        {/* Help */}
        <button
          className="p-2 text-[#8B949E] hover:text-white hover:bg-white/10 rounded-md"
          title="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button
          className="p-2 text-[#8B949E] hover:text-white hover:bg-white/10 rounded-md relative"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 px-2 py-1.5 text-[#8B949E] hover:text-white hover:bg-white/10 rounded-md"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-xs font-semibold">
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <span className="hidden sm:block text-sm">
              {user?.firstName || user?.email?.split('@')[0] || 'User'}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-56 py-1 bg-[#21262D] border border-[#30363D] rounded-lg shadow-xl z-50 animate-slideDown">
                <div className="px-4 py-3 border-b border-[#30363D]">
                  <p className="text-sm font-medium text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-[#8B949E]">{user?.email}</p>
                </div>

                <Link
                  href={ROUTES.PROFILE}
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#8B949E] hover:text-white hover:bg-white/5"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>

                <Link
                  href={ROUTES.PROFILE_SETTINGS}
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#8B949E] hover:text-white hover:bg-white/5"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>

                <div className="border-t border-[#30363D] mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </header>
  );
}
