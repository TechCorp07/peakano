'use client';

/**
 * Admin Users Management Page
 * Manage platform users - view, create, edit, and delete users
 */

import { useState, useMemo } from 'react';
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

// Mock users data
const mockUsers = [
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

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string;
  organizationId: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers as User[]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'student' as UserRole,
    isActive: true,
  });

  const pageSize = 10;

  // Filter and search users
  const filteredUsers = useMemo(() => {
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
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'admin').length,
      instructors: users.filter((u) => u.role === 'instructor').length,
      students: users.filter((u) => u.role === 'student').length,
      active: users.filter((u) => u.isActive).length,
    };
  }, [users]);

  const handleCreateUser = () => {
    const newUser: User = {
      id: String(Date.now()),
      ...formData,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      lastLogin: '',
      organizationId: 'peakpoint',
    };
    setUsers((prev) => [...prev, newUser]);
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, ...formData } : u
      )
    );
    setIsEditModalOpen(false);
    setSelectedUser(null);
    resetForm();
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const handleToggleStatus = (user: User) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      )
    );
  };

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

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'student',
      isActive: true,
    });
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400';
      case 'instructor':
        return 'bg-purple-500/20 text-purple-400';
      case 'student':
        return 'bg-blue-500/20 text-blue-400';
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#E6EDF3]">User Management</h1>
          <p className="text-sm text-[#8B949E] mt-1">
            Manage platform users and their permissions
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#21262D] rounded-lg">
              <Users className="h-5 w-5 text-[#8B949E]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#E6EDF3]">{stats.total}</p>
              <p className="text-xs text-[#6E7681]">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#E6EDF3]">{stats.admins}</p>
              <p className="text-xs text-[#6E7681]">Admins</p>
            </div>
          </div>
        </div>
        <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#E6EDF3]">{stats.instructors}</p>
              <p className="text-xs text-[#6E7681]">Instructors</p>
            </div>
          </div>
        </div>
        <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#E6EDF3]">{stats.students}</p>
              <p className="text-xs text-[#6E7681]">Students</p>
            </div>
          </div>
        </div>
        <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#E6EDF3]">{stats.active}</p>
              <p className="text-xs text-[#6E7681]">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <Alert className="mb-6 border-warning/50 bg-warning/10">
        <AlertDescription className="text-warning text-sm">
          Demo mode: Changes are temporary and will reset on page refresh. Connect to backend for persistent data.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <div className="bg-[#161B22] rounded-lg border border-[#30363D] mb-6">
        <div className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E7681]" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0D1117] border-[#30363D] text-[#E6EDF3] placeholder:text-[#6E7681]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#6E7681]" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] bg-[#0D1117] border-[#30363D] text-[#E6EDF3]">
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
              <SelectTrigger className="w-[140px] bg-[#0D1117] border-[#30363D] text-[#E6EDF3]">
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
              size="sm"
              className="bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D]"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#161B22] rounded-lg border border-[#30363D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363D]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#8B949E] uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#8B949E] uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#8B949E] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#8B949E] uppercase tracking-wider">
                  Email Verified
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#8B949E] uppercase tracking-wider">
                  Last Login
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#8B949E] uppercase tracking-wider">
                  Created
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#8B949E] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262D]">
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#0D1117]/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary text-sm font-medium">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#E6EDF3]">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-[#6E7681]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-1 rounded-full capitalize',
                        getRoleBadgeClass(user.role)
                      )}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors',
                        user.isActive
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      )}
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {user.emailVerified ? (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-[#6E7681]">
                        <Mail className="h-3.5 w-3.5" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#8B949E]">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#8B949E]">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#8B949E] hover:text-white hover:bg-white/5"
                        onClick={() =>
                          setActionMenuOpen(
                            actionMenuOpen === user.id ? null : user.id
                          )
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      {actionMenuOpen === user.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-[#161B22] border border-[#30363D] rounded-md shadow-lg z-10">
                          <button
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#E6EDF3] hover:bg-[#21262D] transition-colors"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-[#21262D] transition-colors"
                            onClick={() => openDeleteModal(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
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
          <div className="px-4 py-3 border-t border-[#30363D] flex items-center justify-between">
            <p className="text-sm text-[#8B949E]">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredUsers.length)} of{' '}
              {filteredUsers.length} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D] disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-[#8B949E]">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D] disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredUsers.length === 0 && (
          <div className="px-4 py-12 text-center">
            <Users className="h-12 w-12 text-[#30363D] mx-auto mb-4" />
            <p className="text-[#8B949E]">No users found</p>
            <p className="text-sm text-[#6E7681] mt-1">
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D]"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser} className="bg-primary hover:bg-primary/90">
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
            <Button onClick={handleEditUser} className="bg-primary hover:bg-primary/90">
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
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
