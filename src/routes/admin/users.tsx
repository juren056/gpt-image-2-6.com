import { useEffect, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  Ban,
  Coins,
  Download,
  MoreHorizontal,
  Shield,
  ShieldAlert,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { useRouter } from '@/core/i18n/navigation';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  pageQuery,
  type PageResult,
} from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { DataTable, type Column } from '@/components/data-table';
import { SiteSelect } from '@/components/site-select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  credits: number;
  accountStatus: 'active' | 'suspended' | 'banned';
  accountReasonCode: string;
  accountSuspendedUntil: string | null;
  accountVersion: number;
  generationStatus: 'active' | 'warned' | 'restricted' | 'suspended' | 'banned';
  generationRestrictedUntil: string | null;
  strikePoints: number;
  warningCount: number;
}

interface StatusAudit {
  id: string;
  scope: 'account' | 'generation';
  previousStatus: string;
  nextStatus: string;
  reasonCode: string;
  reason: string;
  createdAt: string;
}

interface UserStatusDetails {
  account: {
    status: User['accountStatus'];
    version: number;
    reasonCode: string;
    reason: string;
    suspendedUntil: string | null;
  };
  generation: {
    status: User['generationStatus'];
    strikePoints: number;
    warningCount: number;
    restrictedUntil: string | null;
    lastCategory: string;
  };
  audit: StatusAudit[];
}

interface RoleInfo {
  id: string;
  name: string;
  title: string;
}

interface UserRoleInfo {
  roleId: string;
  roleName: string;
  roleTitle: string;
}

interface AbuseCleanupPreview {
  suspicious: number;
  deletable: number;
  creditsToRevoke: number;
  preserved: number;
  domains: string[];
}

const PAGE_SIZE = 10;

function UsersPage() {
  const { userId } = Route.useSearch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupPreview, setCleanupPreview] =
    useState<AbuseCleanupPreview | null>(null);
  const [cleanupStart, setCleanupStart] = useState<number | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    () => new Set()
  );
  const [statusTargets, setStatusTargets] = useState<User[]>([]);
  const [statusScope, setStatusScope] = useState<
    'account' | 'generation' | 'both'
  >('account');
  const [accountStatus, setAccountStatus] =
    useState<User['accountStatus']>('active');
  const [generationStatus, setGenerationStatus] =
    useState<User['generationStatus']>('active');
  const [statusReasonCode, setStatusReasonCode] = useState('policy_violation');
  const [statusReason, setStatusReason] = useState('');
  const [statusUntil, setStatusUntil] = useState('');
  const [statusConfirmation, setStatusConfirmation] = useState('');

  // Role management dialog
  const [managingUser, setManagingUser] = useState<User | null>(null);

  // Credits dialog
  const [creditsUser, setCreditsUser] = useState<User | null>(null);
  const [creditsAction, setCreditsAction] = useState<'grant' | 'deduct'>(
    'grant'
  );
  const [creditsAmount, setCreditsAmount] = useState('');
  const [creditsDesc, setCreditsDesc] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setSelectedUserIds(new Set());
  }, [debouncedSearch, userId]);

  useEffect(() => {
    setSelectedUserIds(new Set());
  }, [page]);

  const listQuery = useQuery({
    queryKey: ['admin-users', page, debouncedSearch, userId],
    queryFn: () =>
      apiGet<PageResult<User>>(
        pageQuery('/api/admin/users', {
          page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch,
        }) + (userId ? `&userId=${encodeURIComponent(userId)}` : '')
      ),
    placeholderData: userId ? undefined : keepPreviousData,
  });

  const statusDetailsQuery = useQuery({
    queryKey: ['admin-user-status', statusTargets[0]?.id],
    queryFn: () =>
      apiGet<UserStatusDetails>(
        `/api/admin/users/status?userId=${statusTargets[0]!.id}`
      ),
    enabled: statusTargets.length === 1,
  });

  // Role dialog queries — only active while a user is being managed.
  const allRolesQuery = useQuery({
    queryKey: ['admin-roles-all'],
    queryFn: () =>
      apiGet<PageResult<RoleInfo>>('/api/admin/roles?page=1&pageSize=999'),
    enabled: !!managingUser,
  });

  const userRolesQuery = useQuery({
    queryKey: ['user-roles', managingUser?.id],
    queryFn: () =>
      apiGet<UserRoleInfo[]>(`/api/admin/roles?userId=${managingUser!.id}`),
    enabled: !!managingUser,
  });

  const allRoles = allRolesQuery.data?.items ?? [];
  const userRoleIds = new Set((userRolesQuery.data ?? []).map((r) => r.roleId));

  function openRoleDialog(u: User) {
    setManagingUser(u);
  }

  function openCreditsDialog(u: User) {
    setCreditsUser(u);
    setCreditsAction('grant');
    setCreditsAmount('');
    setCreditsDesc('');
  }

  function openStatusDialog(
    users: User[],
    initialScope: 'account' | 'generation' | 'both' = 'account'
  ) {
    if (users.length === 0) return;
    setStatusTargets(users);
    setStatusScope(initialScope);
    setAccountStatus(users[0].accountStatus);
    setGenerationStatus(users[0].generationStatus);
    setStatusReasonCode('policy_violation');
    setStatusReason('');
    setStatusUntil('');
    setStatusConfirmation('');
  }

  function closeStatusDialog() {
    setStatusTargets([]);
    setStatusConfirmation('');
  }

  const statusMutation = useMutation({
    mutationFn: () =>
      apiPatch<{ updated: number }>('/api/admin/users/status', {
        userIds: statusTargets.map((u) => u.id),
        scope: statusScope,
        accountStatus:
          statusScope === 'account' || statusScope === 'both'
            ? accountStatus
            : undefined,
        generationStatus:
          statusScope === 'generation' || statusScope === 'both'
            ? generationStatus
            : undefined,
        reasonCode: statusReasonCode,
        reason: statusReason,
        effectiveUntil: statusUntil
          ? new Date(statusUntil).toISOString()
          : null,
        expectedVersion:
          statusTargets.length === 1 &&
          (statusScope === 'account' || statusScope === 'both')
            ? (statusDetailsQuery.data?.account.version ??
              statusTargets[0].accountVersion)
            : undefined,
      }),
    onSuccess: (result) => {
      toast.success(m['admin.users.status_updated']({ count: result.updated }));
      closeStatusDialog();
      setSelectedUserIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-status'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function submitStatus() {
    if (statusReason.trim().length < 8) {
      toast.error(m['admin.users.status_reason_required']());
      return;
    }
    const temporary =
      ((statusScope === 'account' || statusScope === 'both') &&
        accountStatus === 'suspended') ||
      ((statusScope === 'generation' || statusScope === 'both') &&
        (generationStatus === 'restricted' ||
          generationStatus === 'suspended'));
    if (
      temporary &&
      (!statusUntil || new Date(statusUntil).getTime() <= Date.now())
    ) {
      toast.error(m['admin.users.status_invalid_until']());
      return;
    }
    const permanent =
      ((statusScope === 'account' || statusScope === 'both') &&
        accountStatus === 'banned') ||
      ((statusScope === 'generation' || statusScope === 'both') &&
        generationStatus === 'banned');
    const expectedConfirmation =
      statusTargets.length === 1
        ? statusTargets[0].email
        : `BAN ${statusTargets.length} USERS`;
    if (permanent && statusConfirmation !== expectedConfirmation) {
      toast.error(m['admin.users.status_confirm_mismatch']());
      return;
    }
    statusMutation.mutate();
  }

  function statusBadge(status: string, until?: string | null) {
    const variant =
      status === 'active'
        ? 'secondary'
        : status === 'warned'
          ? 'outline'
          : 'destructive';
    return (
      <div className="space-y-1">
        <Badge variant={variant}>{status}</Badge>
        {until && (
          <div className="text-muted-foreground text-[11px]">
            {new Date(until).toLocaleString()}
          </div>
        )}
      </div>
    );
  }

  const creditsMutation = useMutation({
    mutationFn: (vars: {
      userId: string;
      action: 'grant' | 'deduct';
      credits: number;
      description?: string;
    }) => apiPost<{ balance: number }>('/api/admin/users/credits', vars),
    onSuccess: (_data, vars) => {
      toast.success(
        vars.action === 'grant'
          ? m['admin.users.credits_granted']()
          : m['admin.users.credits_deducted']()
      );
      setCreditsUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submitCredits() {
    if (!creditsUser) return;
    const amount = Number(creditsAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(m['admin.users.credits_invalid_amount']());
      return;
    }
    creditsMutation.mutate({
      userId: creditsUser.id,
      action: creditsAction,
      credits: amount,
      description: creditsDesc || undefined,
    });
  }

  const assignRoleMutation = useMutation({
    mutationFn: (roleId: string) =>
      apiPost('/api/admin/roles/assign', {
        userId: managingUser!.id,
        roleId,
      }),
    onSuccess: () => {
      toast.success(m['admin.users.role_assigned']());
      queryClient.invalidateQueries({
        queryKey: ['user-roles', managingUser?.id],
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRoleMutation = useMutation({
    mutationFn: (roleId: string) =>
      apiDelete(
        `/api/admin/roles/assign?userId=${managingUser!.id}&roleId=${roleId}`
      ),
    onSuccess: () => {
      toast.success(m['admin.users.role_removed']());
      queryClient.invalidateQueries({
        queryKey: ['user-roles', managingUser?.id],
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggling = assignRoleMutation.isPending || removeRoleMutation.isPending;

  function toggleRole(roleId: string) {
    if (!managingUser || toggling) return;
    if (userRoleIds.has(roleId)) {
      removeRoleMutation.mutate(roleId);
    } else {
      assignRoleMutation.mutate(roleId);
    }
  }

  async function exportUsers() {
    if (exporting) return;
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (userId) params.set('userId', userId);
      const response = await fetch(
        `/api/admin/users/export${params.size ? `?${params}` : ''}`
      );
      if (
        !response.ok ||
        !response.headers.get('content-type')?.includes('text/csv')
      ) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(m['admin.users.export_failed']());
    } finally {
      setExporting(false);
    }
  }

  const cleanupMutation = useMutation({
    mutationFn: (createdAfter: number) =>
      apiPost<{ deleted: number; revoked: number; preserved: number }>(
        '/api/admin/users/abuse-cleanup',
        {
          createdAfter,
          confirm: 'CLEAN_DISPOSABLE_SIGNUPS',
        }
      ),
    onSuccess: (result) => {
      toast.success(
        m['admin.users.abuse_cleanup_completed']({
          deleted: result.deleted,
          revoked: result.revoked,
        })
      );
      setCleanupOpen(false);
      setCleanupPreview(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function previewAbuseCleanup() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const createdAfter = start.getTime();
    setCleanupStart(createdAfter);
    setCleanupOpen(true);
    setCleanupPreview(null);
    try {
      const preview = await apiGet<AbuseCleanupPreview>(
        `/api/admin/users/abuse-cleanup?createdAfter=${createdAfter}`
      );
      setCleanupPreview(preview);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Preview failed');
      setCleanupOpen(false);
    }
  }

  const columns: Column<User>[] = [
    {
      header: '',
      className: 'w-[44px]',
      cell: (u) => (
        <Checkbox
          checked={selectedUserIds.has(u.id)}
          aria-label={u.email}
          onCheckedChange={(checked) =>
            setSelectedUserIds((current) => {
              const next = new Set(current);
              if (checked) next.add(u.id);
              else next.delete(u.id);
              return next;
            })
          }
        />
      ),
    },
    {
      header: m['admin.users.user_col'](),
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={u.image || undefined} />
            <AvatarFallback className="text-xs">
              {(u.name || u.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{u.name || '—'}</span>
        </div>
      ),
    },
    {
      header: m['admin.users.email_col'](),
      cell: (u) => u.email,
    },
    {
      header: m['admin.users.verification_col'](),
      cell: (u) => (
        <Badge variant={u.emailVerified ? 'default' : 'secondary'}>
          {u.emailVerified
            ? m['admin.users.verified']()
            : m['admin.users.pending_verification']()}
        </Badge>
      ),
    },
    {
      header: m['admin.users.account_status_col'](),
      cell: (u) => statusBadge(u.accountStatus, u.accountSuspendedUntil),
    },
    {
      header: m['admin.users.generation_status_col'](),
      cell: (u) => (
        <div>
          {statusBadge(u.generationStatus, u.generationRestrictedUntil)}
          {(u.strikePoints > 0 || u.warningCount > 0) && (
            <div className="text-muted-foreground mt-1 text-[11px]">
              {u.strikePoints} pts · {u.warningCount} warnings
            </div>
          )}
        </div>
      ),
    },
    {
      header: m['admin.users.credits_col'](),
      className: 'w-[120px]',
      cell: (u) => (
        <span className="font-medium tabular-nums">
          {u.credits.toLocaleString()}
        </span>
      ),
    },
    {
      header: m['admin.users.joined_col'](),
      cell: (u) => (
        <span className="text-muted-foreground">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: m['admin.users.actions_col'](),
      className: 'w-[80px]',
      cell: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-7">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openCreditsDialog(u)}>
              <Coins className="size-4" />
              {m['admin.users.manage_credits_title']()}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openRoleDialog(u)}>
              <Shield className="size-4" />
              {m['admin.users.manage_roles_title']()}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openStatusDialog([u], 'account')}>
              <Ban className="size-4" />
              {m['admin.users.manage_account_status']()}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openStatusDialog([u], 'generation')}
            >
              <Sparkles className="size-4" />
              {m['admin.users.manage_generation_status']()}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">{m['admin.users.title']()}</h1>
        <p className="text-muted-foreground">
          {m['admin.users.description']()}
        </p>
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={listQuery.data?.items ?? []}
            total={listQuery.data?.total ?? 0}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            rowKey={(u) => u.id}
            emptyText={m['admin.users.no_users']()}
            search={search}
            onSearchChange={setSearch}
            toolbar={
              <div className="flex flex-wrap gap-2">
                {userId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPage(1);
                      setSearch('');
                      setDebouncedSearch('');
                      router.replace('/admin/users');
                    }}
                  >
                    {m['admin.users.show_all']()}
                  </Button>
                )}
                {selectedUserIds.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openStatusDialog(
                        (listQuery.data?.items ?? []).filter((u) =>
                          selectedUserIds.has(u.id)
                        )
                      )
                    }
                  >
                    <UserRoundCheck className="size-4" />
                    {m['admin.users.bulk_status']({
                      count: selectedUserIds.size,
                    })}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previewAbuseCleanup}
                >
                  <ShieldAlert className="size-4" />
                  {m['admin.users.abuse_cleanup']()}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportUsers}
                  disabled={exporting}
                >
                  <Download className="size-4" />
                  {exporting
                    ? m['admin.users.exporting']()
                    : m['admin.users.export']()}
                </Button>
              </div>
            }
            onRefresh={() => listQuery.refetch()}
            loading={listQuery.isFetching}
          />
        </CardContent>
      </Card>

      <Dialog open={cleanupOpen} onOpenChange={setCleanupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{m['admin.users.abuse_cleanup_title']()}</DialogTitle>
            <DialogDescription>
              {m['admin.users.abuse_cleanup_description']()}
            </DialogDescription>
          </DialogHeader>
          {cleanupPreview ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground">
                    {m['admin.users.abuse_suspicious']()}
                  </div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">
                    {cleanupPreview.suspicious}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground">
                    {m['admin.users.abuse_deletable']()}
                  </div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">
                    {cleanupPreview.deletable}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground">
                    {m['admin.users.abuse_revoke']()}
                  </div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">
                    {cleanupPreview.creditsToRevoke}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground">
                    {m['admin.users.abuse_preserved']()}
                  </div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">
                    {cleanupPreview.preserved}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">
                  {m['admin.users.abuse_domains']()}
                </div>
                <div className="font-mono text-xs break-words">
                  {cleanupPreview.domains.join(', ') || '—'}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {m['admin.users.abuse_previewing']()}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCleanupOpen(false)}>
              {m['admin.roles.cancel']()}
            </Button>
            <Button
              variant="destructive"
              disabled={
                !cleanupPreview ||
                !cleanupStart ||
                cleanupMutation.isPending ||
                (cleanupPreview.deletable === 0 &&
                  cleanupPreview.creditsToRevoke === 0)
              }
              onClick={() =>
                cleanupStart && cleanupMutation.mutate(cleanupStart)
              }
            >
              {m['admin.users.abuse_execute']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={statusTargets.length > 0}
        onOpenChange={(open) => !open && closeStatusDialog()}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{m['admin.users.manage_status_title']()}</DialogTitle>
            <DialogDescription>
              {m['admin.users.manage_status_description']({
                count: statusTargets.length,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">
                {m['admin.users.status_scope']()}
              </label>
              <SiteSelect
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                value={statusScope}
                onChange={(event) =>
                  setStatusScope(
                    event.target.value as 'account' | 'generation' | 'both'
                  )
                }
              >
                <option value="account">Account access</option>
                <option value="generation">Generation only</option>
                <option value="both">Both</option>
              </SiteSelect>
            </div>

            {(statusScope === 'account' || statusScope === 'both') && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {m['admin.users.account_status_col']()}
                </label>
                <SiteSelect
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={accountStatus}
                  onChange={(event) =>
                    setAccountStatus(
                      event.target.value as User['accountStatus']
                    )
                  }
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </SiteSelect>
              </div>
            )}

            {(statusScope === 'generation' || statusScope === 'both') && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {m['admin.users.generation_status_col']()}
                </label>
                <SiteSelect
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={generationStatus}
                  onChange={(event) =>
                    setGenerationStatus(
                      event.target.value as User['generationStatus']
                    )
                  }
                >
                  <option value="active">Active</option>
                  <option value="warned">Warned</option>
                  <option value="restricted">Restricted</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </SiteSelect>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {m['admin.users.status_reason_code']()}
              </label>
              <SiteSelect
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                value={statusReasonCode}
                onChange={(event) => setStatusReasonCode(event.target.value)}
              >
                <option value="policy_violation">Policy violation</option>
                <option value="abuse">Abuse / automation</option>
                <option value="payment_risk">Payment risk</option>
                <option value="user_appeal">Appeal approved</option>
                <option value="admin_correction">Admin correction</option>
              </SiteSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {m['admin.users.status_until']()}
              </label>
              <Input
                type="datetime-local"
                value={statusUntil}
                onChange={(event) => setStatusUntil(event.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">
                {m['admin.users.status_reason']()}
              </label>
              <textarea
                className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                value={statusReason}
                onChange={(event) => setStatusReason(event.target.value)}
                maxLength={1000}
                placeholder={m['admin.users.status_reason_placeholder']()}
              />
            </div>

            {(((statusScope === 'account' || statusScope === 'both') &&
              accountStatus === 'banned') ||
              ((statusScope === 'generation' || statusScope === 'both') &&
                generationStatus === 'banned')) && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">
                  {m['admin.users.status_confirm']({
                    value:
                      statusTargets.length === 1
                        ? statusTargets[0].email
                        : `BAN ${statusTargets.length} USERS`,
                  })}
                </label>
                <Input
                  value={statusConfirmation}
                  onChange={(event) =>
                    setStatusConfirmation(event.target.value)
                  }
                />
              </div>
            )}
          </div>

          {statusTargets.length === 1 && (
            <div className="rounded-lg border p-3">
              <div className="mb-2 text-sm font-medium">
                {m['admin.users.status_history']()}
              </div>
              {statusDetailsQuery.isLoading ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : statusDetailsQuery.data?.audit.length ? (
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {statusDetailsQuery.data.audit.map((entry) => (
                    <div
                      key={entry.id}
                      className="border-b pb-2 text-xs last:border-0"
                    >
                      <div className="font-medium">
                        {entry.scope}: {entry.previousStatus} →{' '}
                        {entry.nextStatus}
                      </div>
                      <div className="text-muted-foreground">
                        {entry.reasonCode} ·{' '}
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                      <div>{entry.reason}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {m['admin.users.status_no_history']()}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeStatusDialog}>
              {m['admin.roles.cancel']()}
            </Button>
            <Button
              variant={
                ((statusScope === 'account' || statusScope === 'both') &&
                  accountStatus === 'banned') ||
                ((statusScope === 'generation' || statusScope === 'both') &&
                  generationStatus === 'banned')
                  ? 'destructive'
                  : 'default'
              }
              onClick={submitStatus}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending
                ? m['admin.users.status_saving']()
                : m['admin.users.status_save']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Management Dialog */}
      <Dialog
        open={!!managingUser}
        onOpenChange={(v) => !v && setManagingUser(null)}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{m['admin.users.manage_roles_title']()}</DialogTitle>
            <DialogDescription>
              {m['admin.users.manage_roles_description']()}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 space-y-3 overflow-y-auto py-4">
            {allRoles.map((r) => (
              <label
                key={r.id}
                className="flex cursor-pointer items-center gap-3"
              >
                <Checkbox
                  checked={userRoleIds.has(r.id)}
                  onCheckedChange={() => toggleRole(r.id)}
                  disabled={toggling}
                />
                <div>
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {r.name}
                  </div>
                </div>
              </label>
            ))}
            {allRoles.length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {m['admin.roles.no_roles']()}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingUser(null)}>
              {m['admin.roles.cancel']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credits Management Dialog */}
      <Dialog
        open={!!creditsUser}
        onOpenChange={(v) => !v && setCreditsUser(null)}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{m['admin.users.manage_credits_title']()}</DialogTitle>
            <DialogDescription>
              {creditsUser
                ? m['admin.users.manage_credits_for']({
                    name: creditsUser.name || creditsUser.email,
                    balance: creditsUser.credits.toLocaleString(),
                  })
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCreditsAction('grant')}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  creditsAction === 'grant'
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {m['admin.users.credits_action_grant']()}
              </button>
              <button
                type="button"
                onClick={() => setCreditsAction('deduct')}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  creditsAction === 'deduct'
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {m['admin.users.credits_action_deduct']()}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {m['admin.users.credits_amount_label']()}
              </label>
              <Input
                type="number"
                min="1"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {m['admin.users.credits_desc_label']()}
              </label>
              <Input
                value={creditsDesc}
                onChange={(e) => setCreditsDesc(e.target.value)}
                placeholder={m['admin.users.credits_desc_placeholder']()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsUser(null)}>
              {m['admin.roles.cancel']()}
            </Button>
            <Button
              onClick={submitCredits}
              disabled={creditsMutation.isPending}
            >
              {creditsMutation.isPending
                ? m['admin.users.credits_submitting']()
                : m['admin.users.credits_submit']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute('/admin/users')({
  validateSearch: (search: Record<string, unknown>): { userId?: string } => ({
    userId:
      typeof search.userId === 'string' &&
      search.userId.trim().length > 0 &&
      search.userId.length <= 200
        ? search.userId.trim()
        : undefined,
  }),
  component: UsersPage,
});
