// ============================================================
// OneFlesh — Admin Dashboard Page (Crimson Velvet + White)
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { dashboardApi, churchesApi, vendorsApi } from '../../services/api.js';
import type { AdminDashboardStats, Church, Vendor, AuditLog } from '@oneflesh/shared';
import { PageWrapper } from '../../components/layout/PageWrapper.js';
import { Badge, Pill } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';

const C = {
  dark:      '#2C0F12',
  mid:       '#6B1E23',
  accent:    '#fed7b8',
  muted:     '#9a6060',
  white:     '#ffffff',
  border:    'rgba(107,30,35,0.12)',
  borderMid: 'rgba(107,30,35,0.20)',
  skeleton:  'rgba(107,30,35,0.07)',
  shadow:    '0 2px 10px rgba(44,15,18,0.07)',
} as const;

interface AdminDashboardData {
  stats: AdminDashboardStats;
  pendingChurches: Church[];
  pendingVendors: Vendor[];
  auditLogs: AuditLog[];
  apiUptime: number;
}

// ─── KPI Card ──────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: number | string;
  icon: string;
  suffix?: string;
  accent?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, suffix, accent = false }) => (
  <div
    className="rounded-xl px-5 py-4"
    style={
      accent
        ? { background: '#2C0F12', border: '1px solid rgba(254,215,184,0.12)', boxShadow: C.shadow }
        : { background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }
    }
  >
    <div className="flex items-start justify-between">
      <div>
        <div className="font-display text-[30px] leading-none" style={{ color: accent ? '#fed7b8' : C.dark }}>
          {value}
          {suffix && <span className="text-[14px] ml-1 font-body font-light">{suffix}</span>}
        </div>
        <div className="text-[11px] uppercase tracking-[0.07em] mt-1" style={{ color: accent ? 'rgba(254,215,184,0.55)' : C.muted }}>
          {label}
        </div>
      </div>
      <div className="text-[24px]" style={{ opacity: 0.7 }}>{icon}</div>
    </div>
  </div>
);

// ─── Reject modal ──────────────────────────────────────────
interface RejectConfirmProps {
  entityName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const RejectModal: React.FC<RejectConfirmProps> = ({ entityName, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div
        className="rounded-2xl max-w-md w-full p-7"
        style={{ background: C.white, border: `1px solid ${C.borderMid}`, boxShadow: '0 20px 60px rgba(44,15,18,0.18)' }}
      >
        <h3 className="font-display text-[22px] mb-2" style={{ color: C.dark }}>
          Reject {entityName}?
        </h3>
        <p className="text-[13px] mb-4" style={{ color: C.muted }}>
          Please provide a reason for rejection (min 10 characters).
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Reason for rejection…"
          className="w-full px-3 py-2.5 font-body text-[13px] rounded-[5px] outline-none resize-none transition-colors"
          style={{
            background: C.white,
            border: `1px solid rgba(107,30,35,0.18)`,
            color: C.dark,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(107,30,35,0.50)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(107,30,35,0.18)'; }}
        />
        <div className="flex gap-3 mt-4">
          <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button
            variant="danger"
            size="sm"
            disabled={reason.trim().length < 10}
            onClick={() => onConfirm(reason.trim())}
            className="flex-1"
          >
            Confirm Rejection
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── System health ─────────────────────────────────────────
const SystemHealth: React.FC<{ uptime: number }> = ({ uptime }) => (
  <div className="rounded-xl px-5 py-4 flex items-center justify-between" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
    <div>
      <div className="text-[12px] uppercase tracking-[0.07em]" style={{ color: C.muted }}>API Uptime</div>
      <div className="font-display text-[26px] mt-0.5" style={{ color: C.dark }}>{uptime.toFixed(2)}%</div>
    </div>
    <div
      className="w-4 h-4 rounded-full flex-shrink-0"
      style={{
        background: uptime >= 99.5 ? '#22c55e' : uptime >= 95 ? '#eab308' : '#6B1E23',
        boxShadow: uptime >= 99.5 ? '0 0 8px rgba(34,197,94,0.6)' : 'none',
      }}
    />
  </div>
);

// ─── Skeleton ──────────────────────────────────────────────
const AdminSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-xl" style={{ background: C.skeleton }} />
      ))}
    </div>
    <div className="h-48 rounded-xl" style={{ background: C.skeleton }} />
    <div className="h-48 rounded-xl" style={{ background: C.skeleton }} />
  </div>
);

// ─── Table styles helper ────────────────────────────────────
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 16px',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: C.muted,
  borderBottom: `1px solid ${C.border}`,
};

// ─── Page ──────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<{ type: 'church' | 'vendor'; id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-admin'],
    queryFn: () => dashboardApi.admin(),
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const dashData = data?.data?.data as AdminDashboardData | undefined;
  const stats = dashData?.stats;
  const pendingChurches = dashData?.pendingChurches ?? [];
  const pendingVendors = dashData?.pendingVendors ?? [];
  const auditLogs = dashData?.auditLogs ?? [];
  const apiUptime = dashData?.apiUptime ?? 99.9;

  const approveChurchMutation = useMutation({
    mutationFn: (id: string) => churchesApi.approve(id),
    onSuccess: () => { toast.success('Church approved'); void queryClient.invalidateQueries({ queryKey: ['dashboard-admin'] }); },
    onError: () => toast.error('Failed to approve church'),
  });

  const rejectChurchMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => churchesApi.reject(id, reason),
    onSuccess: () => { toast.success('Church rejected'); setRejectTarget(null); void queryClient.invalidateQueries({ queryKey: ['dashboard-admin'] }); },
    onError: () => toast.error('Failed to reject church'),
  });

  const approveVendorMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.verify(id),
    onSuccess: () => { toast.success('Vendor verified'); void queryClient.invalidateQueries({ queryKey: ['dashboard-admin'] }); },
    onError: () => toast.error('Failed to verify vendor'),
  });

  const handleRejectConfirm = (reason: string) => {
    if (!rejectTarget) return;
    if (rejectTarget.type === 'church') {
      rejectChurchMutation.mutate({ id: rejectTarget.id, reason });
    } else {
      toast('Vendor rejection not yet implemented in API.', { icon: 'ℹ️' });
      setRejectTarget(null);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-[1080px] mx-auto px-5 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div>
            <h1 className="font-display text-[clamp(26px,3.5vw,38px)] font-normal" style={{ color: C.dark }}>
              Platform Overview
            </h1>
            <p className="text-[13px] mt-1" style={{ color: C.muted }}>
              System-wide statistics, pending reviews, and audit trails.
            </p>
          </div>
          <Badge variant="crimson" className="self-start mt-1 ml-2">Admin</Badge>
        </div>

        {isLoading ? (
          <AdminSkeleton />
        ) : (
          <>
            {/* KPI Row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <KpiCard label="Total Churches" value={stats?.totalChurches ?? 0} icon="⛪" accent />
              <KpiCard label="Total Profiles" value={stats?.totalProfiles ?? 0} icon="👤" />
              <KpiCard label="Total Alliances" value={stats?.totalAlliances ?? 0} icon="🤝" />
              <KpiCard label="Total Vendors" value={stats?.totalVendors ?? 0} icon="🏪" />
            </div>

            {/* KPI Row 2 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <KpiCard label="Monthly Active Pastors" value={stats?.monthlyActivePastors ?? 0} icon="👨‍💼" />
              <KpiCard label="AI Queries This Month" value={stats?.aiQueriesThisMonth ?? 0} icon="🤖" />
              <KpiCard
                label="Pending Applications"
                value={(stats?.pendingChurchApplications ?? 0) + (stats?.pendingVendorApplications ?? 0)}
                icon="📋"
              />
              <KpiCard label="AI Token Spend" value={stats?.aiTokenSpend ?? 0} icon="💰" suffix="$" />
            </div>

            {/* Pending Applications */}
            <section className="mb-8">
              <h2 className="font-display text-[22px] font-normal mb-4" style={{ color: C.dark }}>
                Pending Applications
              </h2>

              {pendingChurches.length === 0 && pendingVendors.length === 0 ? (
                <div
                  className="text-center py-10 rounded-xl text-[13px]"
                  style={{ background: C.white, border: `1px solid ${C.border}`, color: C.muted }}
                >
                  No pending applications. All caught up!
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Type</th>
                        <th style={{ ...thStyle, display: 'none' }} className="hidden md:table-cell">Location</th>
                        <th style={{ ...thStyle, display: 'none' }} className="hidden md:table-cell">Submitted</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingChurches.map((church) => (
                        <tr
                          key={`church-${church.id}`}
                          style={{ borderBottom: `1px solid ${C.border}` }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(107,30,35,0.03)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                        >
                          <td className="px-5 py-3.5">
                            <div className="text-[13px] font-medium" style={{ color: C.dark }}>{church.name}</div>
                            <div className="text-[11px]" style={{ color: C.muted }}>{church.pastorName}</div>
                          </td>
                          <td className="px-4 py-3.5"><Badge variant="crimson">Church</Badge></td>
                          <td className="px-4 py-3.5 hidden md:table-cell text-[12px]" style={{ color: C.muted }}>{church.city}, {church.state}</td>
                          <td className="px-4 py-3.5 hidden md:table-cell text-[11px]" style={{ color: C.muted }}>
                            {new Date(church.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="primary" size="sm" loading={approveChurchMutation.isPending && approveChurchMutation.variables === church.id} onClick={() => approveChurchMutation.mutate(church.id)}>Approve</Button>
                              <Button variant="danger" size="sm" onClick={() => setRejectTarget({ type: 'church', id: church.id, name: church.name })}>Reject</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pendingVendors.map((vendor) => (
                        <tr
                          key={`vendor-${vendor.id}`}
                          style={{ borderBottom: `1px solid ${C.border}` }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(107,30,35,0.03)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                        >
                          <td className="px-5 py-3.5">
                            <div className="text-[13px] font-medium" style={{ color: C.dark }}>{vendor.businessName}</div>
                            <div className="text-[11px]" style={{ color: C.muted }}>{vendor.ownerName}</div>
                          </td>
                          <td className="px-4 py-3.5"><Badge variant="gold">Vendor</Badge></td>
                          <td className="px-4 py-3.5 hidden md:table-cell text-[12px]" style={{ color: C.muted }}>{vendor.city}, {vendor.state}</td>
                          <td className="px-4 py-3.5 hidden md:table-cell text-[11px]" style={{ color: C.muted }}>
                            {new Date(vendor.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="primary" size="sm" loading={approveVendorMutation.isPending && approveVendorMutation.variables === vendor.id} onClick={() => approveVendorMutation.mutate(vendor.id)}>Verify</Button>
                              <Button variant="danger" size="sm" onClick={() => setRejectTarget({ type: 'vendor', id: vendor.id, name: vendor.businessName })}>Reject</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Audit Logs */}
            <section className="mb-8">
              <h2 className="font-display text-[22px] font-normal mb-4" style={{ color: C.dark }}>
                Recent Audit Logs
              </h2>

              {auditLogs.length === 0 ? (
                <div className="text-center py-10 rounded-xl text-[13px]" style={{ background: C.white, border: `1px solid ${C.border}`, color: C.muted }}>
                  No audit logs yet.
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr>
                          {['User', 'Action', 'Entity', 'IP Address', 'Timestamp'].map((col) => (
                            <th key={col} style={thStyle}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.slice(0, 20).map((log) => (
                          <tr
                            key={log.id}
                            style={{ borderBottom: `1px solid ${C.border}` }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(107,30,35,0.03)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                          >
                            <td className="px-5 py-3 text-[12px] font-mono" style={{ color: C.dark }}>
                              {log.userId ? log.userId.substring(0, 8) + '…' : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <Pill
                                variant={
                                  log.action.includes('APPROVE') || log.action.includes('COMPLETE') ? 'completed'
                                  : log.action.includes('REJECT') || log.action.includes('DELETE') || log.action.includes('DISSOLVE') ? 'dissolved'
                                  : 'active'
                                }
                              >
                                {log.action}
                              </Pill>
                            </td>
                            <td className="px-4 py-3 text-[12px]" style={{ color: C.muted }}>
                              {log.entityType ?? '—'}
                              {log.entityId && (
                                <span className="ml-1 text-[10px] font-mono" style={{ color: 'rgba(154,96,96,0.50)' }}>
                                  {log.entityId.substring(0, 8)}…
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[11px] font-mono" style={{ color: C.muted }}>{log.ipAddress ?? '—'}</td>
                            <td className="px-5 py-3 text-[11px] whitespace-nowrap" style={{ color: C.muted }}>
                              {new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* System Health */}
            <section>
              <h2 className="font-display text-[22px] font-normal mb-4" style={{ color: C.dark }}>
                System Health
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SystemHealth uptime={apiUptime} />
                <div className="rounded-xl px-5 py-4" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                  <div className="text-[12px] uppercase tracking-[0.07em]" style={{ color: C.muted }}>Pending Churches</div>
                  <div className="font-display text-[26px] mt-0.5" style={{ color: C.dark }}>{stats?.pendingChurchApplications ?? 0}</div>
                </div>
                <div className="rounded-xl px-5 py-4" style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                  <div className="text-[12px] uppercase tracking-[0.07em]" style={{ color: C.muted }}>Pending Vendors</div>
                  <div className="font-display text-[26px] mt-0.5" style={{ color: C.dark }}>{stats?.pendingVendorApplications ?? 0}</div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {rejectTarget && (
        <RejectModal
          entityName={rejectTarget.name}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </PageWrapper>
  );
}
