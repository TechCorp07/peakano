'use client';

/**
 * Admin Users Management Page
 * Manage platform users - view, create, edit, and delete users
 * Connected to backend with fallback to mock data
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Users,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Mail,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Filter,
  Download,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  useGetUsersQuery,
  useGetUserStatsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  useLazyExportUsersQuery,
  type User,
} from '@/features/users';

// Mock users data as fallback
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@peakpoint.africa',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    emailVerified: true,
    createdAt: '2024-01-15T10:00:00Z',
    lastLogin: '2025-01-03T14:30:00Z',
    organizationId: 'peakpoint',
  },
  {
    id: '2',
    email: 'instructor@peakpoint.africa',
    firstName: 'John',
    lastName: 'Instructor',
    role: 'instructor',
    isActive: true,
    emailVerified: true,
    createdAt: '2024-02-20T09:00:00Z',
    lastLogin: '2025-01-02T11:15:00Z',
    organizationId: 'peakpoint',
  },
  {
    id: '3',
    email: 'student1@example.com',
    firstName: 'Alice',
    lastName: 'Johnson',
    role: 'student',
    isActive: true,
    emailVerified: true,
    createdAt: '2024-06-10T14:00:00Z',
    lastLogin: '2025-01-01T16:45:00Z',
    organizationId: 'peakpoint',
  },
  {
    id: '4',
    email: 'student2@example.com',
    firstName: 'Bob',
    lastName: 'Smith',
    role: 'student',
    isActive: true,
    emailVerified: false,
    createdAt: '2024-08-05T11:30:00Z',
    lastLogin: '2024-12-28T09:00:00Z',
    organizationId: 'peakpoint',
  },
  {
    id: '5',
    email: 'student3@example.com',
    firstName: 'Carol',
    lastName: 'Williams',
    role: 'student',
    isActive: false,
    emailVerified: true,
    createdAt: '2024-09-12T08:00:00Z',
    lastLogin: '2024-11-15T10:30:00Z',
    organizationId: 'peakpoint',
  },
  {
    id: '6',
    email: 'instructor2@peakpoint.africa',
    firstName: 'David',
    lastName: 'Brown',
    role: 'instructor',
    isActive: true,
    emailVerified: true,
    createdAt: '2024-03-25T13:00:00Z',
    lastLogin: '2025-01-03T08:00:00Z',
    organizationId: 'peakpoint',
  },
  {
    id: '7',
    email: 'student4@example.com',
    firstName: 'Emma',
    lastName: 'Davis',
    role: 'student',
    isActive: true,
    emailVerified: true,
    createdAt: '2024-10-01T15:00:00Z',
    lastLogin: '2025-01-02T17:30:00Z',
    organizationId: 'peakpoint',
  },
  {
    id: '8',
    email: 'student5@example.com',
    firstName: 'Frank',
    lastName: 'Miller',
    role: 'student',
    isActive: true,
    emailVerified: true,
    createdAt: '2024-11-20T10:00:00Z',
    lastLogin: '2025-01-03T12:00:00Z',
    organizationId: 'peakpoint',
  },
];

type UserRole = 'admin' | 'instructor' | 'student';

export default function AdminUsersPage() {
  // Local state for demo mode (when backend is unavailable)
  const [localUsers, setLocalUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  // Form state for create/edit
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'student' as UserRole,
    isActive: true,
  });

  const pageSize = 10;

  // RTK Query hooks
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useGetUsersQuery({
    page: currentPage,
    limit: pageSize,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    search: searchQuery || undefined,
  });

  const { data: statsData, isLoading: statsLoading } = useGetUserStatsQuery();

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUserMutation, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [toggleUserStatus, { isLoading: isToggling }] = useToggleUserStatusMutation();
  const [triggerExport, { isLoading: isExporting }] = useLazyExportUsersQuery();

  // Check if using mock data
  const isUsingMockData = usersError || (!usersLoading && !usersData);

  // Get users - from API or fallback to mock
  const users = useMemo(() => {
    if (usersData?.items && usersData.items.length > 0) {
      return usersData.items;
    }
    return localUsers;
  }, [usersData, localUsers]);

  // Filter and search users (for mock data)
  const filteredUsers = useMemo(() => {
    if (!isUsingMockData) {
      return users; // API handles filtering
    }
    
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === '' ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter, isUsingMockData]);

  // Pagination
  const totalPages = useMemo(() => {
    if (usersData?.totalPages) {
      return usersData.totalPages;
    }
    return Math.ceil(filteredUsers.length / pageSize);
  }, [usersData, filteredUsers.length]);

  const paginatedUsers = useMemo(() => {
    if (!isUsingMockData) {
      return filteredUsers; // API handles pagination
    }
    return filteredUsers.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredUsers, currentPage, isUsingMockData]);

  // Stats - from API or calculated from mock data
  const stats = useMemo(() => {
    if (statsData) {
      return {
        total: statsData.totalUsers,
        admins: statsData.byRole.admin,
        instructors: statsData.byRole.instructor,
        students: statsData.byRole.student,
        active: statsData.activeUsers,
      };
    }
    // Fallback calculation from local data
    const allUsers = isUsingMockData ? localUsers : users;
    return {
      total: allUsers.length,
      admins: allUsers.filter((u) => u.role === 'admin').length,
      instructors: allUsers.filter((u) => u.role === 'instructor').length,
      students: allUsers.filter((u) => u.role === 'student').length,
      active: allUsers.filter((u) => u.isActive).length,
    };
  }, [statsData, users, localUsers, isUsingMockData]);

  // Reset form function - must be defined before functions that use it
  const resetForm = useCallback(() => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'student',
      isActive: true,
    });
    setPassword('');
  }, []);

  const handleCreateUser = useCallback(async () => {
    if (isUsingMockData) {
      // Demo mode - local state only
      const uniqueId = crypto.randomUUID();
      const newUser: User = {
        id: uniqueId,
        ...formData,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        lastLogin: '',
        organizationId: 'peakpoint',
      };
      setLocalUsers((prev) => [...prev, newUser]);
      setIsCreateModalOpen(false);
      resetForm();
      return;
    }

    try {
      await createUser({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: password || 'TempPass123!',
        role: formData.role,
        isActive: formData.isActive,
      }).unwrap();
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  }, [formData, password, isUsingMockData, createUser, resetForm]);

  const handleEditUser = useCallback(async () => {
    if (!selectedUser) return;

    if (isUsingMockData) {
      // Demo mode - local state only
      setLocalUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, ...formData } : u
        )
      );
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
      return;
    }

    try {
      await updateUser({
        userId: selectedUser.id,
        data: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          isActive: formData.isActive,
        },
      }).unwrap();
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }, [selectedUser, formData, isUsingMockData, updateUser, resetForm]);

  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return;

    if (isUsingMockData) {
      // Demo mode - local state only
      setLocalUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      return;
    }

    try {
      await deleteUserMutation(selectedUser.id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  }, [selectedUser, isUsingMockData, deleteUserMutation]);

  const handleToggleStatus = useCallback(async (user: User) => {
    if (isUsingMockData) {
      // Demo mode - local state only
      setLocalUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u
        )
      );
      return;
    }

    try {
      await toggleUserStatus({
        userId: user.id,
        isActive: !user.isActive,
      }).unwrap();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  }, [isUsingMockData, toggleUserStatus]);

  const handleExport = useCallback(async () => {
    try {
      const result = await triggerExport({ format: 'csv' });
      if (result.data) {
        // Download the file
        const url = window.URL.createObjectURL(result.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Failed to export users:', error);
    }
  }, [triggerExport]);

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    });
    setIsEditModalOpen(true);
    setActionMenuOpen(null);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
    setActionMenuOpen(null);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      case 'instructor':
        return 'bg-teal-500/20 text-teal-400 border border-teal-500/30';
      case 'student':
        return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
      default:
        return 'bg-[#30363D] text-[#8B949E]';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#0D1117] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 border border-cyan-500/30">
              <Users className="h-8 w-8 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
                Administration
              </p>
              <h1 className="text-4xl font-black text-[#E6EDF3] tracking-tight">User Management</h1>
            </div>
          </div>
          <p className="text-lg text-[#8B949E] font-medium mt-2">
            Manage platform users, roles, and permissions
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          size="lg"
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold shadow-lg shadow-cyan-500/25 h-12 px-6"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-slate-700/50 p-6 hover:border-slate-600/60 transition-all duration-300 hover:shadow-xl group">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-slate-400 to-slate-600" />
          <div className="flex items-center gap-4 pl-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500/30 to-slate-600/20 shadow-lg">
              <Users className="h-6 w-6 text-slate-300" />
            </div>
            <div>
              <p className="text-4xl font-black text-slate-200">{stats.total}</p>
              <p className="text-sm text-[#8B949E] font-medium uppercase tracking-wide">Total Users</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-rose-500/30 p-6 hover:border-rose-400/50 transition-all duration-300 hover:shadow-xl group">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-rose-400 to-rose-600" />
          <div className="flex items-center gap-4 pl-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/30 to-rose-600/20 shadow-lg">
              <Shield className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <p className="text-4xl font-black text-rose-400">{stats.admins}</p>
              <p className="text-sm text-[#8B949E] font-medium uppercase tracking-wide">Admins</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-teal-500/30 p-6 hover:border-teal-400/50 transition-all duration-300 hover:shadow-xl group">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-teal-400 to-teal-600" />
          <div className="flex items-center gap-4 pl-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/30 to-teal-600/20 shadow-lg">
              <Users className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <p className="text-4xl font-black text-teal-400">{stats.instructors}</p>
              <p className="text-sm text-[#8B949E] font-medium uppercase tracking-wide">Instructors</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-sky-500/30 p-6 hover:border-sky-400/50 transition-all duration-300 hover:shadow-xl group">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-sky-400 to-sky-600" />
          <div className="flex items-center gap-4 pl-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500/30 to-sky-600/20 shadow-lg">
              <Users className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <p className="text-4xl font-black text-sky-400">{stats.students}</p>
              <p className="text-sm text-[#8B949E] font-medium uppercase tracking-wide">Students</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-emerald-500/30 p-6 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-xl group">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-emerald-400 to-emerald-600" />
          <div className="flex items-center gap-4 pl-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 shadow-lg">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-4xl font-black text-emerald-400">{stats.active}</p>
              <p className="text-sm text-[#8B949E] font-medium uppercase tracking-wide">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice - only show when using mock data */}
      {isUsingMockData && (
        <Alert className="mb-8 border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-transparent rounded-xl">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-400 text-sm font-medium">
            Demo mode: Backend unavailable. Changes are temporary and will reset on page refresh.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {usersLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <span className="ml-3 text-[#8B949E]">Loading users...</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-slate-700/50 mb-8 shadow-lg">
        <div className="p-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E7681]" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-[#0D1117] border-2 border-slate-700/50 text-[#E6EDF3] placeholder:text-[#6E7681] focus:border-cyan-500/50 focus:ring-cyan-400/20 rounded-xl text-base"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#6E7681]" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px] h-11 bg-[#0D1117] border-2 border-slate-700/50 text-[#E6EDF3] rounded-xl">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="bg-[#161B22] border-[#30363D]">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-11 bg-[#0D1117] border-2 border-slate-700/50 text-[#E6EDF3] rounded-xl">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#161B22] border-[#30363D]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
              className="h-11 bg-[#0D1117] border-2 border-slate-700/50 text-[#8B949E] hover:text-cyan-400 hover:border-cyan-500/50 rounded-xl"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export
            </Button>
            <Button
              variant="ghost"
              onClick={() => refetchUsers()}
              className="h-11 text-[#8B949E] hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-slate-700/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-700/50 bg-[#0D1117]/50">
                <th className="text-left px-6 py-4 text-sm font-bold text-[#E6EDF3] uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-4 text-sm font-bold text-[#E6EDF3] uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-4 text-sm font-bold text-[#E6EDF3] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-bold text-[#E6EDF3] uppercase tracking-wider">
                  Email Verified
                </th>
                <th className="text-left px-6 py-4 text-sm font-bold text-[#E6EDF3] uppercase tracking-wider">
                  Last Login
                </th>
                <th className="text-left px-6 py-4 text-sm font-bold text-[#E6EDF3] uppercase tracking-wider">
                  Created
                </th>
                <th className="text-right px-6 py-4 text-sm font-bold text-[#E6EDF3] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#0D1117]/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                        <span className="text-cyan-400 text-sm font-bold">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[#E6EDF3] group-hover:text-cyan-400 transition-colors">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-[#6E7681]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'text-sm font-semibold px-3 py-1.5 rounded-lg capitalize',
                        getRoleBadgeClass(user.role)
                      )}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={isToggling}
                      className={cn(
                        'flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50',
                        user.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                      )}
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {user.emailVerified ? (
                      <span className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-sm font-medium text-amber-400">
                        <Mail className="h-4 w-4" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[#8B949E]">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[#8B949E]">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-[#8B949E] hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg"
                        onClick={() =>
                          setActionMenuOpen(
                            actionMenuOpen === user.id ? null : user.id
                          )
                        }
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                      {actionMenuOpen === user.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-[#161B22] border-2 border-slate-700/50 rounded-xl shadow-xl z-10 overflow-hidden">
                          <button
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#E6EDF3] hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit User
                          </button>
                          <button
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                            onClick={() => openDeleteModal(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete User
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > pageSize && (
          <div className="px-6 py-4 border-t-2 border-slate-700/50 flex items-center justify-between bg-[#0D1117]/30">
            <p className="text-sm font-medium text-[#8B949E]">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredUsers.length)} of{' '}
              {filteredUsers.length} users
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-10 bg-[#0D1117] border-2 border-slate-700/50 text-[#8B949E] hover:text-cyan-400 hover:border-cyan-500/50 disabled:opacity-50 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-[#E6EDF3] px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-10 bg-[#0D1117] border-2 border-slate-700/50 text-[#8B949E] hover:text-cyan-400 hover:border-cyan-500/50 disabled:opacity-50 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredUsers.length === 0 && (
          <div className="px-6 py-16 text-center">
            <Users className="h-16 w-16 text-[#30363D] mx-auto mb-4" />
            <p className="text-lg font-semibold text-[#E6EDF3]">No users found</p>
            <p className="text-sm text-[#6E7681] mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-[#161B22] border-[#30363D] text-[#E6EDF3]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription className="text-[#8B949E]">
              Create a new user account on the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="bg-[#0D1117] border-[#30363D]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="bg-[#0D1117] border-[#30363D]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-[#0D1117] border-[#30363D]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
              >
                <SelectTrigger className="bg-[#0D1117] border-[#30363D]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161B22] border-[#30363D]">
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isUsingMockData && (
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty for auto-generated"
                  className="bg-[#0D1117] border-[#30363D]"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateUser} 
              disabled={isCreating}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#161B22] border-[#30363D] text-[#E6EDF3]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-[#8B949E]">
              Update user information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="bg-[#0D1117] border-[#30363D]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="bg-[#0D1117] border-[#30363D]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-[#0D1117] border-[#30363D]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
              >
                <SelectTrigger className="bg-[#0D1117] border-[#30363D]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161B22] border-[#30363D]">
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditUser} 
              disabled={isUpdating}
              className="bg-primary hover:bg-primary/90"
            >
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-[#161B22] border-[#30363D] text-[#E6EDF3]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="text-[#8B949E]">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-[#0D1117] rounded-lg border border-[#30363D]">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-medium">
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-[#6E7681]">{selectedUser.email}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
