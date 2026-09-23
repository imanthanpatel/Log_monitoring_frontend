'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Users,
  RefreshCw,
  Pencil,
  Trash2,
  Loader2,
  UserCog,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { PageHeader } from '@/components/shared/page-header';
import { RoleBadge } from '@/components/shared/role-badge';
import { SearchInput } from '@/components/shared/search-input';
import { FilterSelect } from '@/components/shared/filter-select';
import { TableSkeleton } from '@/components/shared/loading-states';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
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
import { toast } from 'sonner';
import { ApiError, deleteUser, getUsers, updateUser } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Role, User } from '@/lib/types';

const roleOptions: { label: string; value: Role }[] = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'SOC Analyst', value: 'SOC' },
  { label: 'Investigator', value: 'INVESTIGATOR' },
  { label: 'Viewer', value: 'VIEWER' },
];

export default function UsersPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <AppLayout>
        <UsersContent />
      </AppLayout>
    </RouteGuard>
  );
}

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [editUser, setEditUser] = useState<User | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<Role>('VIEWER');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.first_name?.toLowerCase().includes(q) ||
          u.last_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, search, roleFilter]);

  function openEdit(user: User) {
    setEditUser(user);
    setEditUsername(user.username || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'VIEWER');
    setEditFirstName(user.first_name || '');
    setEditLastName(user.last_name || '');
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!editUser) return;
    setSaving(true);
    try {
      const data: Partial<User> = {
        username: editUsername,
        email: editEmail,
        role: editRole,
        first_name: editFirstName,
        last_name: editLastName,
      };
      const updated = await updateUser(editUser.id, data);
      setUsers((prev) => prev.map((u) => (u.id === editUser.id ? updated : u)));
      toast.success('User updated successfully');
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success('User deleted successfully');
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="Manage users, roles, and access">
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by username, email, name…"
              className="flex-1"
            />
            <FilterSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleOptions.map((r) => ({ label: r.label, value: r.value }))}
              placeholder="All Roles"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableSkeleton rows={8} cols={5} /></div>
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="No users found" description="No users match your current filters." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">#{user.id}</TableCell>
                      <TableCell className="font-medium">
                        {user.username}
                        {user.first_name || user.last_name ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({user.first_name} {user.last_name})
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email || '—'}</TableCell>
                      <TableCell><RoleBadge role={user.role} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(user.date_joined)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setDeleteTarget(user);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {!loading && !error && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {filtered.length} of {users.length} users
        </p>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Edit User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete User?"
        description={`Are you sure you want to delete user "${deleteTarget?.username}"? This action cannot be undone.`}
        confirmLabel="Delete User"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
