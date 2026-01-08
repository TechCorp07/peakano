'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Image,
  ClipboardCheck,
  Users,
  Upload,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  FileCheck,
  FolderOpen,
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: <Home className="h-5 w-5" /> },
      { label: 'Courses', href: ROUTES.COURSES, icon: <BookOpen className="h-5 w-5" /> },
      { label: 'Annotation', href: ROUTES.ANNOTATION, icon: <Image className="h-5 w-5" /> },
      { label: 'Studies', href: ROUTES.STUDIES, icon: <FolderOpen className="h-5 w-5" /> },
      { label: 'Assessments', href: ROUTES.ASSESSMENTS, icon: <ClipboardCheck className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Instructor',
    items: [
      { label: 'My Courses', href: ROUTES.INSTRUCTOR_COURSES, icon: <GraduationCap className="h-5 w-5" />, roles: ['instructor', 'admin'] },
      { label: 'Review Queue', href: ROUTES.INSTRUCTOR_REVIEW, icon: <FileCheck className="h-5 w-5" />, roles: ['instructor', 'admin'] },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Users', href: ROUTES.ADMIN_USERS, icon: <Users className="h-5 w-5" />, roles: ['admin'] },
      { label: 'DICOM', href: ROUTES.ADMIN_DICOM, icon: <Upload className="h-5 w-5" />, roles: ['admin'] },
      { label: 'Analytics', href: ROUTES.ADMIN_ANALYTICS, icon: <BarChart3 className="h-5 w-5" />, roles: ['admin'] },
    ],
  },
];

interface AppSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function AppSidebar({ collapsed = false, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const userRole = user?.role || 'student';

  const isActive = (href: string) => {
    if (href === ROUTES.DASHBOARD) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const hasAccess = (roles?: string[]) => {
    if (!roles) return true;
    return roles.includes(userRole);
  };

  return (
    <aside
      className={cn(
        'h-full bg-[#161B22] border-r border-[#30363D] flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto py-4">
        {sidebarSections.map((section) => {
          const visibleItems = section.items.filter((item) => hasAccess(item.roles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-[#6E7681] uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <nav className="space-y-1 px-2">
                {visibleItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md transition-colors group',
                      isActive(item.href)
                        ? 'bg-primary/15 text-primary border-l-2 border-primary'
                        : 'text-[#8B949E] hover:text-white hover:bg-white/5'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span
                      className={cn(
                        'flex-shrink-0',
                        isActive(item.href) ? 'text-primary' : 'text-[#8B949E] group-hover:text-white'
                      )}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      {onToggle && (
        <div className="border-t border-[#30363D] p-2">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[#8B949E] hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
