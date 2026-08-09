import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit3,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  LockKeyhole,
  Plus,
  Save,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationProps } from '../types';

/* ───── Types ───── */

type ActionKey = 'view' | 'create' | 'edit' | 'delete' | 'approve';
type ModuleKey =
  | 'dashboard'
  | 'bookings'
  | 'customers'
  | 'services'
  | 'staff'
  | 'website'
  | 'marketing'
  | 'wallet'
  | 'analytics'
  | 'payroll'
  | 'settings';

type PermissionMatrix = Record<ModuleKey, Record<ActionKey, boolean>>;

type RoleDefinition = {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  permissions: PermissionMatrix;
  createdAt: string;
};

type SensitiveModuleKey = ModuleKey;

/* ───── Constants ───── */

const STORAGE_KEY = 'nexora_roles_access_control';
const AUDIT_KEY = 'nexora_staff_audit_log';

const CARD_CLASS =
  'rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-5';
const INPUT_CLASS =
  'w-full rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-3 text-sm font-medium text-on-background outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';

const ALL_MODULES: { key: ModuleKey; label: string; icon: typeof Shield }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: Eye },
  { key: 'bookings', label: 'Bookings', icon: Users },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'services', label: 'Services', icon: Settings },
  { key: 'staff', label: 'Staff', icon: Users },
  { key: 'website', label: 'Website', icon: Eye },
  { key: 'marketing', label: 'Marketing', icon: Eye },
  { key: 'wallet', label: 'Wallet', icon: KeyRound },
  { key: 'analytics', label: 'Analytics', icon: Eye },
  { key: 'payroll', label: 'Payroll', icon: KeyRound },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const ALL_ACTIONS: { key: ActionKey; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'approve', label: 'Approve' },
];

const SENSITIVE_MODULES: SensitiveModuleKey[] = [
  'wallet',
  'payroll',
  'customers',
  'staff',
  'settings',
];

const SENSITIVE_LABELS: Partial<Record<ModuleKey, string>> = {
  wallet: 'Wallet — financial transaction data',
  payroll: 'Payroll — salary, commission and payout data',
  customers: 'Global Customer Data — personal and contact information',
  staff: 'Staff Permissions — ability to manage other staff members',
  settings: 'Settings — business configuration and integrations',
};

/* ───── Helpers ───── */

function uid() {
  return `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyMatrix(): PermissionMatrix {
  const matrix = {} as PermissionMatrix;
  for (const mod of ALL_MODULES) {
    matrix[mod.key] = { view: false, create: false, edit: false, delete: false, approve: false };
  }
  return matrix;
}

function fullMatrix(): PermissionMatrix {
  const matrix = {} as PermissionMatrix;
  for (const mod of ALL_MODULES) {
    matrix[mod.key] = { view: true, create: true, edit: true, delete: true, approve: true };
  }
  return matrix;
}

function assignedAccessMatrix(): PermissionMatrix {
  const matrix = emptyMatrix();
  // Service providers: full access to bookings, services, customers (view only), dashboard
  matrix.dashboard = { view: true, create: false, edit: false, delete: false, approve: false };
  matrix.bookings = { view: true, create: true, edit: true, delete: false, approve: false };
  matrix.services = { view: true, create: false, edit: false, delete: false, approve: false };
  matrix.customers = { view: true, create: false, edit: false, delete: false, approve: false };
  return matrix;
}

function frontdeskMatrix(): PermissionMatrix {
  const matrix = emptyMatrix();
  matrix.dashboard = { view: true, create: false, edit: false, delete: false, approve: false };
  matrix.bookings = { view: true, create: true, edit: true, delete: false, approve: true };
  matrix.customers = { view: true, create: true, edit: true, delete: false, approve: false };
  matrix.services = { view: true, create: false, edit: false, delete: false, approve: false };
  matrix.staff = { view: true, create: false, edit: false, delete: false, approve: false };
  return matrix;
}

function defaultRoles(): RoleDefinition[] {
  return [
    {
      id: 'role-manager',
      name: 'Manager',
      description: 'Full Access',
      isBuiltIn: true,
      permissions: fullMatrix(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'role-service-provider',
      name: 'Service Provider',
      description: 'Assigned Access',
      isBuiltIn: true,
      permissions: assignedAccessMatrix(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'role-receptionist',
      name: 'Receptionist',
      description: 'Frontdesk Access',
      isBuiltIn: true,
      permissions: frontdeskMatrix(),
      createdAt: new Date().toISOString(),
    },
  ];
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function isAuthorized() {
  if (typeof window === 'undefined') return true;
  const role = (
    window.localStorage.getItem('nexora-user-role') ||
    window.localStorage.getItem('nexora-demo-role') ||
    'owner'
  ).toLowerCase();
  return ['owner', 'manager', 'admin', 'salon_owner'].some((allowed) => role.includes(allowed));
}

function appendAudit(staffId: string, action: string) {
  const all = readJson<Record<string, any[]>>(AUDIT_KEY, {});
  all[staffId] = [
    { id: uid(), action, timestamp: new Date().toISOString(), changedBy: 'You' },
    ...(all[staffId] || []),
  ];
  window.localStorage.setItem(AUDIT_KEY, JSON.stringify(all));
}

function countPermissions(matrix: PermissionMatrix): number {
  let count = 0;
  for (const mod of ALL_MODULES) {
    for (const action of ALL_ACTIONS) {
      if (matrix[mod.key][action.key]) count++;
    }
  }
  return count;
}

function getRoleBadgeColor(id: string): string {
  if (id === 'role-manager') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (id === 'role-service-provider') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (id === 'role-receptionist') return 'border-purple-200 bg-purple-50 text-purple-700';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function getRoleIcon(id: string) {
  if (id === 'role-manager') return ShieldCheck;
  if (id === 'role-service-provider') return Settings;
  if (id === 'role-receptionist') return Users;
  return KeyRound;
}

/* ───── Main Component ───── */

export default function RolesAccessControl({ navigate }: NavigationProps) {
  const [authorized] = useState(() => isAuthorized());
  const [roles, setRoles] = useState<RoleDefinition[]>(() =>
    readJson<RoleDefinition[]>(STORAGE_KEY, defaultRoles()),
  );
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
    () => roles[0]?.id || null,
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSensitiveModal, setShowSensitiveModal] = useState<{
    moduleKey: ModuleKey;
    actionKey: ActionKey;
    enable: boolean;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState<string | null>(null);

  // Custom role form state
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Persist roles
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  }, [roles]);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || null,
    [roles, selectedRoleId],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── Permission toggle with sensitive guard ── */
  const togglePermission = useCallback(
    (moduleKey: ModuleKey, actionKey: ActionKey) => {
      if (!selectedRole) return;
      const currentValue = selectedRole.permissions[moduleKey][actionKey];
      const willEnable = !currentValue;

      // If enabling a sensitive module, show warning
      if (willEnable && SENSITIVE_MODULES.includes(moduleKey)) {
        setShowSensitiveModal({ moduleKey, actionKey, enable: true });
        return;
      }

      // If disabling, apply directly
      setRoles((prev) =>
        prev.map((role) =>
          role.id === selectedRoleId
            ? {
                ...role,
                permissions: {
                  ...role.permissions,
                  [moduleKey]: {
                    ...role.permissions[moduleKey],
                    [actionKey]: willEnable,
                  },
                },
              }
            : role,
        ),
      );
    },
    [selectedRole, selectedRoleId],
  );

  const confirmSensitiveToggle = useCallback(() => {
    if (!showSensitiveModal || !selectedRoleId) return;
    const { moduleKey, actionKey, enable } = showSensitiveModal;

    setRoles((prev) =>
      prev.map((role) =>
        role.id === selectedRoleId
          ? {
              ...role,
              permissions: {
                ...role.permissions,
                [moduleKey]: {
                  ...role.permissions[moduleKey],
                  [actionKey]: enable,
                },
              },
            }
          : role,
      ),
    );

    appendAudit('system', `Sensitive permission ${enable ? 'granted' : 'revoked'}: ${SENSITIVE_LABELS[moduleKey]}`);
    setShowSensitiveModal(null);
    showToast('Permission updated');
  }, [showSensitiveModal, selectedRoleId, showToast]);

  /* ── Toggle all actions for a module ── */
  const toggleAllModule = useCallback(
    (moduleKey: ModuleKey) => {
      if (!selectedRole) return;
      const allEnabled = ALL_ACTIONS.every((a) => selectedRole.permissions[moduleKey][a.key]);
      const newValue = !allEnabled;

      if (newValue && SENSITIVE_MODULES.includes(moduleKey)) {
        setShowSensitiveModal({ moduleKey, actionKey: 'view', enable: true });
        return;
      }

      setRoles((prev) =>
        prev.map((role) => {
          if (role.id !== selectedRoleId) return role;
          const updated = { ...role.permissions[moduleKey] };
          for (const action of ALL_ACTIONS) {
            updated[action.key] = newValue;
          }
          return { ...role, permissions: { ...role.permissions, [moduleKey]: updated } };
        }),
      );
    },
    [selectedRole, selectedRoleId],
  );

  /* ── Create custom role ── */
  const handleCreateCustomRole = useCallback(() => {
    const name = customName.trim();
    if (!name) {
      showToast('Please enter a role name');
      return;
    }

    const newRole: RoleDefinition = {
      id: uid(),
      name,
      description: customDescription.trim() || 'Custom role',
      isBuiltIn: false,
      permissions: emptyMatrix(),
      createdAt: new Date().toISOString(),
    };

    setRoles((prev) => [...prev, newRole]);
    setSelectedRoleId(newRole.id);
    setShowCreateForm(false);
    setCustomName('');
    setCustomDescription('');
    appendAudit('system', `Custom role created: ${name}`);
    showToast(`Role "${name}" created`);
  }, [customName, customDescription, showToast]);

  /* ── Delete custom role ── */
  const deleteRole = useCallback(
    (roleId: string) => {
      const role = roles.find((r) => r.id === roleId);
      if (!role || role.isBuiltIn) return;
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      if (selectedRoleId === roleId) {
        setSelectedRoleId(roles[0]?.id === roleId ? roles[1]?.id || null : roles[0]?.id || null);
      }
      appendAudit('system', `Role deleted: ${role.name}`);
      showToast(`Role "${role.name}" deleted`);
    },
    [roles, selectedRoleId, showToast],
  );

  /* ── Save role ── */
  const saveRole = useCallback(() => {
    if (!selectedRole) return;
    appendAudit('system', `Role permissions saved: ${selectedRole.name}`);
    showToast(`"${selectedRole.name}" permissions saved`);
  }, [selectedRole, showToast]);

  if (!authorized) return <Unauthorized navigate={navigate} />;

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background antialiased">
      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('staff')}
            className="rounded-full p-2 text-primary hover:bg-[#fde7f3]"
            aria-label="Back to staff"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight text-primary">
              Roles &amp; Access Control
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              NexoraOS · Confidential
            </p>
          </div>
          <div className="w-9" />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-24 sm:px-6">
        {/* Subtitle */}
        <section className="mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fde7f3] text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-on-background">
                Roles &amp; Access Control
              </h2>
              <p className="mt-0.5 text-sm text-on-surface-variant">
                Control what each staff role can access.
              </p>
            </div>
          </div>
        </section>

        {/* ── Role Cards ── */}
        <section className="mb-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {roles.map((role) => {
              const Icon = getRoleIcon(role.id);
              const isSelected = selectedRoleId === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all ${
                    isSelected
                      ? 'border-primary bg-[#fde7f3] shadow-md'
                      : 'border-[#e8e8e8] bg-white hover:bg-[#fdf8f8] hover:border-[#e0bec6]'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isSelected ? 'bg-primary text-white' : 'bg-[#fde7f3] text-primary'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        isSelected ? 'text-primary' : 'text-on-background'
                      }`}
                    >
                      {role.name}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">{role.description}</p>
                  </div>
                  {!role.isBuiltIn && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRole(role.id);
                      }}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm hover:bg-red-200"
                      aria-label={`Delete ${role.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-primary bg-[#fde7f3]" />
                  )}
                </button>
              );
            })}

            {/* Create Custom Role CTA */}
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#e0bec6] p-4 text-center transition-all hover:border-primary hover:bg-[#fdf8f8]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fde7f3] text-primary">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary">+ Create Custom Role</p>
              </div>
            </button>
          </div>
        </section>

        {/* ── Selected Role Info ── */}
        {selectedRole && (
          <section className="mb-4">
            <div className={`${CARD_CLASS} border-primary/20 bg-[#fde7f3]`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = getRoleIcon(selectedRole.id);
                    return (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-base font-bold text-on-background">{selectedRole.name}</h3>
                    <p className="text-xs text-on-surface-variant">{selectedRole.description}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeColor(selectedRole.id)}`}
                >
                  {countPermissions(selectedRole.permissions)} / {ALL_MODULES.length * ALL_ACTIONS.length}{' '}
                  granted
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ── Permission Matrix ── */}
        {selectedRole && (
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-on-background">Permission Matrix</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                {ALL_MODULES.length} modules · {ALL_ACTIONS.length} actions
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {ALL_MODULES.map((mod) => {
                const Icon = mod.icon;
                const allEnabled = ALL_ACTIONS.every(
                  (a) => selectedRole.permissions[mod.key][a.key],
                );
                const someEnabled = ALL_ACTIONS.some(
                  (a) => selectedRole.permissions[mod.key][a.key],
                );
                const isSensitive = SENSITIVE_MODULES.includes(mod.key);

                return (
                  <ModuleCard
                    key={mod.key}
                    moduleKey={mod.key}
                    label={mod.label}
                    Icon={Icon}
                    isSensitive={isSensitive}
                    allEnabled={allEnabled}
                    someEnabled={someEnabled}
                    permissions={selectedRole.permissions[mod.key]}
                    onToggleAction={(actionKey) => togglePermission(mod.key, actionKey)}
                    onToggleAll={() => toggleAllModule(mod.key)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ── Role Preview ── */}
        {selectedRole && (
          <section className="mb-6">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex w-full items-center justify-between rounded-2xl border border-[#e8e8e8] bg-white px-4 py-3 text-left transition-colors hover:bg-[#fdf8f8]"
            >
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-on-background">
                  &ldquo;This role can access&hellip;&rdquo;
                </span>
              </div>
              {showPreview ? (
                <ChevronDown className="h-4 w-4 text-on-surface-variant" />
              ) : (
                <ChevronRight className="h-4 w-4 text-on-surface-variant" />
              )}
            </button>

            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 flex flex-col gap-1.5 rounded-2xl border border-[#e8e8e8] bg-white p-4">
                    {ALL_MODULES.map((mod) => {
                      const grantedActions = ALL_ACTIONS.filter(
                        (a) => selectedRole.permissions[mod.key][a.key],
                      );
                      return (
                        <div
                          key={mod.key}
                          className="flex items-start gap-3 rounded-xl bg-[#fdf8f8] px-3 py-2.5"
                        >
                          <span className="mt-0.5 text-xs font-bold text-on-background">
                            {mod.label}
                          </span>
                          <div className="flex flex-1 flex-wrap gap-1">
                            {grantedActions.length > 0 ? (
                              grantedActions.map((a) => (
                                <span
                                  key={a.key}
                                  className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                >
                                  {a.label}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] italic text-on-surface-variant/60">
                                No access
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* ── Actions ── */}
        {selectedRole && (
          <section className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={saveRole}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white hover:opacity-90 active:scale-95"
            >
              <Save className="h-4 w-4" /> Save Role Permissions
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPreview(true);
                showToast('Role preview expanded');
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e0bec6] bg-white px-4 py-3 text-xs font-bold text-on-surface-variant hover:bg-[#fde7f3]"
            >
              <Eye className="h-4 w-4" /> Preview Access
            </button>
          </section>
        )}
      </main>

      {/* ── Sensitive Module Warning Modal ── */}
      <AnimatePresence>
        {showSensitiveModal && (
          <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-on-background">Sensitive Permission</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                You are granting access to sensitive business information.
              </p>
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p className="font-semibold">{SENSITIVE_LABELS[showSensitiveModal.moduleKey]}</p>
                <p className="mt-1">
                  Permission: <b>{showSensitiveModal.actionKey}</b> on{' '}
                  <b>
                    {ALL_MODULES.find((m) => m.key === showSensitiveModal.moduleKey)?.label}
                  </b>
                </p>
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSensitiveModal(null)}
                  className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-3 text-xs font-bold text-on-surface-variant"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSensitiveToggle}
                  className="flex-1 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Create Custom Role Modal ── */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
            >
              <div className="mb-5 flex items-center justify-between border-b border-[#e8e8e8] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fde7f3] text-primary">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-background">Create Custom Role</h3>
                    <p className="text-xs text-on-surface-variant">
                      Define a new role with custom permissions.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCustomName('');
                    setCustomDescription('');
                  }}
                  aria-label="Close form"
                  className="rounded-full p-2 text-on-surface-variant hover:bg-[#f7f2f2]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                  Role Name *
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Senior Manager"
                    className={INPUT_CLASS}
                    autoFocus
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                  Description
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Describe what this role can do..."
                    rows={3}
                    className={`${INPUT_CLASS} resize-none`}
                  />
                </label>

                <div className="rounded-xl border border-[#e0bec6] bg-[#fdf8f8] p-3 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Starts with no permissions</span>
                  </div>
                  <p className="mt-1">
                    After creation, configure permissions using the matrix above.
                  </p>
                </div>

                <div className="mt-2 flex gap-3 border-t border-[#e8e8e8] pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCustomName('');
                      setCustomDescription('');
                    }}
                    className="flex-1 rounded-xl border border-[#e0bec6] py-3 text-sm font-semibold text-on-surface-variant hover:bg-[#f7f2f2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCustomRole}
                    className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    Create Role
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 10 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#313030] px-4 py-3 text-xs font-semibold text-white shadow-xl"
          >
            <Check className="h-4 w-4 text-emerald-300" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───── Module Card (expandable, mobile-first) ───── */

function ModuleCard({
  moduleKey,
  label,
  Icon,
  isSensitive,
  allEnabled,
  someEnabled,
  permissions,
  onToggleAction,
  onToggleAll,
}: {
  moduleKey: ModuleKey;
  label: string;
  Icon: typeof Shield;
  isSensitive: boolean;
  allEnabled: boolean;
  someEnabled: boolean;
  permissions: Record<ActionKey, boolean>;
  onToggleAction: (actionKey: ActionKey) => void;
  onToggleAll: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const grantedCount = ALL_ACTIONS.filter((a) => permissions[a.key]).length;

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors ${
        allEnabled
          ? 'border-primary/30 bg-[#fde7f3]/50'
          : someEnabled
            ? 'border-[#e8e8e8] bg-white'
            : 'border-[#e8e8e8] bg-white'
      }`}
    >
      {/* Collapsed header — tap to expand */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            allEnabled ? 'bg-primary text-white' : 'bg-[#fde7f3] text-primary'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-on-background">{label}</span>
            {isSensitive && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                Sensitive
              </span>
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant">
            {grantedCount} of {ALL_ACTIONS.length} actions granted
          </p>
        </div>

        {/* Quick toggle all (pill) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleAll();
          }}
          className={`mr-2 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
            allEnabled
              ? 'bg-primary text-white'
              : 'border border-[#e0bec6] bg-white text-on-surface-variant hover:bg-[#fde7f3]'
          }`}
        >
          {allEnabled ? 'All On' : 'Toggle'}
        </button>

        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-on-surface-variant" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-on-surface-variant" />
        )}
      </button>

      {/* Expanded: action toggles */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#e8e8e8] bg-[#fdf8f8] px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {ALL_ACTIONS.map((action) => {
                  const isActive = permissions[action.key];
                  return (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => onToggleAction(action.key)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11px] font-bold transition-all ${
                        isActive
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-[#e0bec6] bg-white text-on-surface-variant hover:bg-[#fde7f3]'
                      }`}
                    >
                      {isActive ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-current" />
                      )}
                      {action.label}
                    </button>
                  );
                })}
              </div>

              {isSensitive && someEnabled && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[10px] font-semibold text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5" />
                  This module contains sensitive business data.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───── Unauthorized ───── */

function Unauthorized({ navigate }: NavigationProps) {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => navigate('staff')}
            className="rounded-full p-2 text-primary hover:bg-[#fde7f3]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-primary">Roles &amp; Access Control</h1>
          <span className="w-9" />
        </div>
      </header>
      <main className="flex min-h-screen items-center justify-center px-5 pt-16">
        <section className={`${CARD_CLASS} w-full max-w-md py-12 text-center`}>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <LockKeyhole className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-on-background">
            You don't have permission to access Payroll.
          </h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Roles &amp; Access Control is visible only to authorized owners, managers and
            administrators.
          </p>
          <button
            type="button"
            onClick={() => navigate('staff')}
            className="mt-6 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white"
          >
            Back to Staff
          </button>
        </section>
      </main>
    </div>
  );
}
