/**
 * Admin Management Page
 * Implements US1-US3: Create, manage, and configure admin users
 */

import React, { useState } from 'react';
import {
  Shield,
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  UserCog,
  Key,
  Power,
  PowerOff,
  Mail,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
} from 'lucide-react';

import {
  useAdminUsers,
  useAdminRoles,
  useAllPermissions,
  useAdminStats,
  useAdminActivityLogs,
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeactivateAdminUser,
  useReactivateAdminUser,
  useResetAdminPassword,
  ADMIN_ROLE_INFO,
  PERMISSION_MODULE_INFO,
} from '@/entities/admin-permissions';

import type {
  AdminRoleType,
  AdminUserWithDetails,
  AdminPermission,
  CreateAdminRequest,
} from '@/entities/admin-permissions';

// ============================================
// CREATE ADMIN MODAL
// ============================================

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { data: roles } = useAdminRoles();
  const createAdmin = useCreateAdminUser();

  const [formData, setFormData] = useState<CreateAdminRequest>({
    email: '',
    first_name: '',
    last_name: '',
    admin_role_type: 'support_admin',
    department: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createAdmin.mutateAsync(formData);
      onSuccess();
      onClose();
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        admin_role_type: 'support_admin',
        department: '',
        password: '',
      });
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to create admin' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCog className="h-5 w-5 text-royal-600" />
            Create New Admin
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-royal-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="admin@bda-global.org"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-royal-500 ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.first_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-royal-500 ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.last_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-royal-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Min 8 characters"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Admin will be required to change password on first login
              </p>
            </div>

            {/* Admin Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Role
              </label>
              <select
                value={formData.admin_role_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    admin_role_type: e.target.value as AdminRoleType,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-500"
              >
                {roles
                  ?.filter((r) => r.role_type !== 'super_admin')
                  .map((role) => (
                    <option key={role.role_type} value={role.role_type}>
                      {role.display_name}
                    </option>
                  ))}
              </select>
              {formData.admin_role_type && (
                <p className="text-gray-500 text-xs mt-1">
                  {ADMIN_ROLE_INFO[formData.admin_role_type]?.description}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department (Optional)
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-500"
                placeholder="e.g., Operations, IT"
              />
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createAdmin.isPending}
                className="px-4 py-2 bg-royal-600 text-white rounded-lg hover:bg-royal-700 disabled:opacity-50 flex items-center gap-2"
              >
                {createAdmin.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Admin
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ADMIN DETAILS MODAL
// ============================================

interface AdminDetailsModalProps {
  admin: AdminUserWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

const AdminDetailsModal: React.FC<AdminDetailsModalProps> = ({
  admin,
  isOpen,
  onClose,
}) => {
  const { data: allPermissions } = useAllPermissions();

  if (!isOpen || !admin) return null;

  // Group permissions by module
  const permissionsByModule = allPermissions?.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, AdminPermission[]>);

  const roleInfo = ADMIN_ROLE_INFO[admin.admin_role_type];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${roleInfo?.bgColor || 'bg-gray-100'} flex items-center justify-center`}
              >
                <Shield className={`h-5 w-5 ${roleInfo?.color || 'text-gray-600'}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {admin.user.first_name} {admin.user.last_name}
                </h2>
                <p className="text-sm text-gray-500">{admin.user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XCircle className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Role & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Role</p>
                <p className={`font-medium ${roleInfo?.color || 'text-gray-900'}`}>
                  {roleInfo?.label || admin.admin_role_type}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {admin.is_active ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-700 font-medium">Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-700 font-medium">Inactive</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {admin.department && (
                <div>
                  <p className="text-gray-500">Department</p>
                  <p className="font-medium">{admin.department}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Login Count</p>
                <p className="font-medium">{admin.login_count}</p>
              </div>
              {admin.last_login_at && (
                <div>
                  <p className="text-gray-500">Last Login</p>
                  <p className="font-medium">
                    {new Date(admin.last_login_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium">
                  {new Date(admin.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Permissions</h3>
              <div className="space-y-3">
                {Object.entries(permissionsByModule || {}).map(([module, perms]) => (
                  <div key={module} className="border rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {PERMISSION_MODULE_INFO[module as keyof typeof PERMISSION_MODULE_INFO]
                        ?.label || module}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((perm) => {
                        const hasPermission = admin.permissions.includes(
                          perm.permission_key
                        );
                        return (
                          <span
                            key={perm.permission_key}
                            className={`px-2 py-1 rounded text-xs ${
                              hasPermission
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {perm.display_name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deactivation Info */}
            {!admin.is_active && admin.deactivation_reason && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">
                  Deactivation Reason
                </p>
                <p className="text-red-700">{admin.deactivation_reason}</p>
                {admin.deactivated_at && (
                  <p className="text-red-600 text-sm mt-1">
                    Deactivated on{' '}
                    {new Date(admin.deactivated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DEACTIVATE MODAL
// ============================================

interface DeactivateModalProps {
  admin: AdminUserWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

const DeactivateModal: React.FC<DeactivateModalProps> = ({
  admin,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !admin) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Deactivate Admin
            </h2>
          </div>

          <p className="text-gray-600 mb-4">
            Are you sure you want to deactivate{' '}
            <strong>
              {admin.user.first_name} {admin.user.last_name}
            </strong>
            ? They will lose access to the admin panel immediately.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for deactivation
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Enter reason..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={!reason.trim() || isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                <>
                  <PowerOff className="h-4 w-4" />
                  Deactivate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const AdminManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminRoleType | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUserWithDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [adminToDeactivate, setAdminToDeactivate] = useState<AdminUserWithDetails | null>(
    null
  );

  const { data: admins, isLoading, refetch } = useAdminUsers({
    role_type: roleFilter || undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    search: searchQuery || undefined,
  });

  const { data: roles } = useAdminRoles();
  const { data: stats } = useAdminStats();
  const { data: recentActivity } = useAdminActivityLogs({ limit: 5 });

  const deactivateAdmin = useDeactivateAdminUser();
  const reactivateAdmin = useReactivateAdminUser();
  const resetPassword = useResetAdminPassword();

  const handleDeactivate = async (reason: string) => {
    if (!adminToDeactivate) return;
    await deactivateAdmin.mutateAsync({
      adminUserId: adminToDeactivate.id,
      reason,
    });
    setAdminToDeactivate(null);
  };

  const handleReactivate = async (admin: AdminUserWithDetails) => {
    await reactivateAdmin.mutateAsync(admin.id);
  };

  const handleResetPassword = async (admin: AdminUserWithDetails) => {
    if (
      confirm(
        `Send password reset email to ${admin.user.email}?`
      )
    ) {
      await resetPassword.mutateAsync(admin.id);
      alert('Password reset email sent successfully');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Management</h1>
                <p className="text-white/80">
                  Manage admin users, roles, and permissions
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-white text-royal-600 rounded-lg hover:bg-white/90 font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Admin
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total_admins || 0}
                </p>
                <p className="text-sm text-gray-500">Total Admins</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.active_admins || 0}
                </p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.inactive_admins || 0}
                </p>
                <p className="text-sm text-gray-500">Inactive</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.recent_activity_count || 0}
                </p>
                <p className="text-sm text-gray-500">Actions (24h)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Admin List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              {/* Filters */}
              <div className="p-4 border-b">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-500"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) =>
                      setRoleFilter(e.target.value as AdminRoleType | '')
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-500"
                  >
                    <option value="">All Roles</option>
                    {roles?.map((role) => (
                      <option key={role.role_type} value={role.role_type}>
                        {role.display_name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* List */}
              <div className="divide-y">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    Loading admins...
                  </div>
                ) : admins?.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    No admin users found
                  </div>
                ) : (
                  admins?.map((admin) => {
                    const roleInfo = ADMIN_ROLE_INFO[admin.admin_role_type];
                    return (
                      <div
                        key={admin.id}
                        className="p-4 hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full ${
                              roleInfo?.bgColor || 'bg-gray-100'
                            } flex items-center justify-center`}
                          >
                            <span
                              className={`font-medium ${roleInfo?.color || 'text-gray-600'}`}
                            >
                              {admin.user.first_name?.[0] || '?'}
                              {admin.user.last_name?.[0] || ''}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {admin.user.first_name} {admin.user.last_name}
                              </p>
                              {!admin.is_active && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {admin.user.email}
                            </p>
                            <p
                              className={`text-xs ${roleInfo?.color || 'text-gray-500'}`}
                            >
                              {roleInfo?.label || admin.admin_role_type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(admin)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4 text-gray-500" />
                          </button>
                          {admin.is_active ? (
                            <button
                              onClick={() => setAdminToDeactivate(admin)}
                              className="p-2 hover:bg-red-50 rounded-lg"
                              title="Deactivate"
                            >
                              <PowerOff className="h-4 w-4 text-red-500" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivate(admin)}
                              className="p-2 hover:bg-green-50 rounded-lg"
                              title="Reactivate"
                            >
                              <Power className="h-4 w-4 text-green-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Roles Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Admins by Role</h3>
              <div className="space-y-3">
                {roles?.map((role) => {
                  const count = stats?.by_role?.[role.role_type] || 0;
                  const roleInfo = ADMIN_ROLE_INFO[role.role_type];
                  return (
                    <div
                      key={role.role_type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            roleInfo?.color?.replace('text-', 'bg-') || 'bg-gray-400'
                          }`}
                        />
                        <span className="text-sm text-gray-600">
                          {role.display_name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {recentActivity?.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity?.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Activity className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-gray-900">
                          {log.action_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateAdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <AdminDetailsModal
        admin={selectedAdmin}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedAdmin(null);
        }}
      />

      <DeactivateModal
        admin={adminToDeactivate}
        isOpen={!!adminToDeactivate}
        onClose={() => setAdminToDeactivate(null)}
        onConfirm={handleDeactivate}
        isLoading={deactivateAdmin.isPending}
      />
    </div>
  );
};

export default AdminManagement;
