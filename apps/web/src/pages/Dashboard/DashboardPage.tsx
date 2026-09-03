// ============================================================
// OneFlesh — Pastor Dashboard Page (Crimson Velvet + White)
// ============================================================

import React from 'react';
import { Users, Handshake, HeartHandshake, CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, notificationsApi } from '../../services/api.js';
import { useAuthStore } from '../../stores/authStore.js';
import type {
  PastorDashboardStats,
  Alliance,
  Profile,
  Notification,
  CounsellingSession,
} from '@oneflesh/shared';
import { NotificationType } from '@oneflesh/shared';
import { useNotificationStore } from '../../stores/notificationStore.js';
import { PageWrapper } from '../../components/layout/PageWrapper.js';
import { ProfileCard } from '../../components/profiles/ProfileCard.js';
import { AlliancePipeline } from '../../components/alliances/AlliancePipeline.js';
import { AIPanel } from '../../components/ai/AIPanel.js';
import { Pill } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';

// ─── Theme palette ─────────────────────────────────────────
const C = {
  page:        '#fdf9f7',
  dark:        '#2C0F12',
  mid:         '#6B1E23',
  accent:      '#fed7b8',
  accentMid:   'rgba(254,215,184,0.60)',
  accentFaint: 'rgba(254,215,184,0.12)',
  heading:     '#2C0F12',
  body:        '#4a1a1e',
  muted:       '#9a6060',
  mutedLight:  '#c8a4a6',
  white:       '#ffffff',
  border:      'rgba(107,30,35,0.12)',
  borderMid:   'rgba(107,30,35,0.22)',
  shadow:      '0 2px 12px rgba(44,15,18,0.07)',
  shadowMd:    '0 4px 20px rgba(44,15,18,0.10)',
} as const;

// ─── Dashboard API response shape ─────────────────────────
interface PastorDashboardData {
  stats: PastorDashboardStats;
  alliances: Alliance[];
  profiles: Profile[];
  upcomingSessions: CounsellingSession[];
}

// ─── Stat Card ─────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  neon: string; // glow colour e.g. '#00e5ff'
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, neon }) => (
  <div
    style={{
      background: '#3F070B',
      border: '1px solid rgba(201,168,76,0.22)',
      borderRadius: '14px',
      padding: '20px 22px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 4px 20px rgba(44,15,18,0.35)',
    }}
  >
    <div
      style={{
        width: '52px',
        height: '52px',
        borderRadius: '10px',
        background: `${neon}22`,
        border: `1.5px solid ${neon}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 0 12px ${neon}, 0 0 24px ${neon}55`,
      }}
    >
      {icon}
    </div>
    <div>
      <div
        className="font-display"
        style={{ fontSize: '32px', color: '#ffffff', lineHeight: 1, textShadow: '0 0 12px rgba(255,255,255,0.3)' }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: '#ffffff',
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          marginTop: '5px',
          fontWeight: 300,
          textShadow: '0 0 8px rgba(255,255,255,0.25)',
        }}
      >
        {label}
      </div>
    </div>
  </div>
);

// ─── Notification helpers ──────────────────────────────────
function notifBorderColor(type: NotificationType): string {
  switch (type) {
    case NotificationType.INTEREST:         return '#c9a84c';
    case NotificationType.ALLIANCE_UPDATE:  return '#2e7d32';
    default:                                return C.mid;
  }
}

function notifIcon(type: NotificationType): string {
  switch (type) {
    case NotificationType.INTEREST:             return '💌';
    case NotificationType.ALLIANCE_UPDATE:      return '🤝';
    case NotificationType.PROFILE_APPROVED:     return '✅';
    case NotificationType.COUNSELLING_REMINDER: return '📅';
    case NotificationType.VENDOR_CONTACT:       return '🏪';
    default:                                    return '🔔';
  }
}

function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Notification Item ─────────────────────────────────────
interface NotifItemProps { notification: Notification; }

const NotifItem: React.FC<NotifItemProps> = ({ notification }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px 14px',
      background: notification.read ? C.white : 'rgba(107,30,35,0.04)',
      border: `1px solid ${C.border}`,
      borderLeftWidth: '3px',
      borderLeftColor: notifBorderColor(notification.type),
      borderRadius: '8px',
      boxShadow: C.shadow,
    }}
  >
    <div style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>
      {notifIcon(notification.type)}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{ fontSize: '13px', fontWeight: 600, color: C.heading, lineHeight: 1.3 }}
      >
        {notification.title}
      </div>
      <div
        className="line-clamp-2"
        style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}
      >
        {notification.body}
      </div>
    </div>
    <div
      style={{ fontSize: '10px', color: C.mutedLight, flexShrink: 0, whiteSpace: 'nowrap' }}
    >
      {timeAgo(notification.createdAt)}
    </div>
  </div>
);

// ─── Upcoming Session Card ─────────────────────────────────
interface SessionCardProps { session: CounsellingSession; }

const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const dateObj = session.sessionDate ? new Date(session.sessionDate) : null;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      {/* Date badge */}
      <div style={{ flexShrink: 0, width: '48px', textAlign: 'center' }}>
        {dateObj ? (
          <div style={{ background: C.dark, borderRadius: '10px', overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '9px',
                color: C.accent,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '2px 4px',
                background: 'rgba(254,215,184,0.10)',
              }}
            >
              {dateObj.toLocaleDateString('en-IN', { month: 'short' })}
            </div>
            <div
              className="font-display"
              style={{ fontSize: '22px', color: C.accent, lineHeight: 1, paddingBottom: '4px' }}
            >
              {dateObj.getDate()}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(107,30,35,0.08)',
              borderRadius: '10px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '10px', color: C.muted }}>TBD</span>
          </div>
        )}
      </div>

      {/* Event details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: C.heading, lineHeight: 1.3 }}>
          Session {session.sessionNumber} — {session.groomName} &amp; {session.brideName}
        </div>
        <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
          {session.format.replace('_', ' ')}
          {dateObj && (
            <span>
              {' '}· {dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <Pill
        variant={session.status === 'COMPLETED' ? 'completed' : 'pending'}
        className="flex-shrink-0 self-start mt-0.5"
      >
        {session.status}
      </Pill>
    </div>
  );
};

// ─── Skeleton ──────────────────────────────────────────────
const DashboardSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{ height: '88px', borderRadius: '14px', background: 'rgba(107,30,35,0.12)' }}
        />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6 mt-6">
      <div className="space-y-4">
        <div style={{ height: '192px', borderRadius: '14px', background: 'rgba(107,30,35,0.08)' }} />
        <div style={{ height: '192px', borderRadius: '14px', background: 'rgba(107,30,35,0.08)' }} />
      </div>
      <div style={{ height: '500px', borderRadius: '14px', background: 'rgba(107,30,35,0.08)' }} />
    </div>
  </div>
);

// ─── Section header helper ─────────────────────────────────
const SH: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
    <h2
      className="font-display"
      style={{ fontSize: '20px', color: C.heading, fontWeight: 400 }}
    >
      {title}
    </h2>
    {action}
  </div>
);

// ─── Empty state card ──────────────────────────────────────
const EmptyCard: React.FC<{ emoji?: string; message: string; cta?: React.ReactNode }> = ({ emoji, message, cta }) => (
  <div
    style={{
      textAlign: 'center',
      padding: emoji ? '40px 20px' : '32px 20px',
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: '12px',
      boxShadow: C.shadow,
    }}
  >
    {emoji && <div style={{ fontSize: '32px', marginBottom: '10px' }}>{emoji}</div>}
    <div style={{ fontSize: '13px', color: C.muted }}>{message}</div>
    {cta && <div style={{ marginTop: '12px' }}>{cta}</div>}
  </div>
);

// ─── Page ──────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount } = useNotificationStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'CHURCH_ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', isAdmin ? 'admin' : 'pastor'],
    // Admins have no churchId — call the admin endpoint and map to the same shape
    queryFn: async () => {
      if (isAdmin) {
        const res = await dashboardApi.admin();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const d = res.data?.data as {
          totalChurches: number; totalProfiles: number;
          totalAlliances: number; pendingChurchApplications: number;
        };
        // Reshape admin stats into the pastor dashboard shape so the UI reuses the same cards
        return {
          data: {
            data: {
              stats: {
                activeProfiles: d?.totalProfiles ?? 0,
                alliancesInProgress: d?.totalAlliances ?? 0,
                pendingInterests: d?.pendingChurchApplications ?? 0,
                upcomingCounsellingSessions: 0,
              },
              alliances: [],
              profiles: [],
              upcomingSessions: [],
            },
          },
        };
      }
      return dashboardApi.pastor();
    },
  });

  useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationsApi.list({ limit: 20 });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const items = (res.data?.data as Notification[]) ?? [];
      useNotificationStore.getState().setNotifications(items);
      return items;
    },
    staleTime: 1000 * 60,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const dashData = data?.data?.data as PastorDashboardData | undefined;
  const stats    = dashData?.stats;
  const alliances   = dashData?.alliances ?? [];
  const profiles    = dashData?.profiles ?? [];
  const sessions    = dashData?.upcomingSessions ?? [];

  return (
    <PageWrapper>
      <div style={{ background: C.page, minHeight: '100%' }}>
        <div className="max-w-[1080px] mx-auto px-5 py-10">

          {/* ── Page header ── */}
          <div className="mb-8">
            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(26px,3.5vw,38px)',
                color: C.heading,
                fontWeight: 400,
                lineHeight: 1.2,
              }}
            >
              Pastoral Dashboard
            </h1>
            <p style={{ fontSize: '13px', color: C.muted, marginTop: '6px' }}>
              Manage profiles, alliances, and counselling from one place.
            </p>
          </div>

          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* ── Stat cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Active Profiles"       value={stats?.activeProfiles ?? 0}             neon="#00ffff" icon={<Users          size={26} color="#00ffff" strokeWidth={2.5} />} />
                <StatCard label="Alliances in Progress" value={stats?.alliancesInProgress ?? 0}        neon="#facc15" icon={<Handshake       size={26} color="#facc15" strokeWidth={2.5} />} />
                <StatCard label="Pending Interests"     value={stats?.pendingInterests ?? 0}            neon="#ff2d78" icon={<HeartHandshake  size={26} color="#ff2d78" strokeWidth={2.5} />} />
                <StatCard label="Sessions This Month"   value={stats?.upcomingCounsellingSessions ?? 0} neon="#bf5fff" icon={<CalendarDays    size={26} color="#bf5fff" strokeWidth={2.5} />} />
              </div>

              {/* ── Two-column layout ── */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start overflow-visible">

                {/* Left column */}
                <div className="space-y-7">

                  {/* Notifications */}
                  <section>
                    <SH
                      title="Notifications"
                      action={
                        unreadCount > 0 ? (
                          <span
                            style={{
                              background: C.mid,
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                            }}
                          >
                            {unreadCount}
                          </span>
                        ) : null
                      }
                    />
                    {notifications.length === 0 ? (
                      <EmptyCard message="No notifications yet." />
                    ) : (
                      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                        {notifications.slice(0, 10).map((n) => (
                          <NotifItem key={n.id} notification={n} />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Alliance Pipeline */}
                  <section>
                    <SH
                      title="Active Alliances"
                      action={
                        <button
                          onClick={() => navigate('/alliances')}
                          style={{ fontSize: '12px', color: C.mid, fontWeight: 500 }}
                          className="hover:opacity-75 transition-opacity"
                        >
                          View all →
                        </button>
                      }
                    />
                    {alliances.length === 0 ? (
                      <EmptyCard message="No active alliances." />
                    ) : (
                      <div className="space-y-4">
                        {alliances.slice(0, 3).map((alliance) => (
                          <AlliancePipeline key={alliance.id} alliance={alliance} compact={false} />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* My Profiles */}
                  <section>
                    <SH
                      title="My Profiles"
                      action={
                        <Button variant="ghost" size="sm" onClick={() => navigate('/profiles/add')}>
                          + Add Profile
                        </Button>
                      }
                    />
                    {profiles.length === 0 ? (
                      <EmptyCard
                        emoji="👤"
                        message="No profiles yet."
                        cta={
                          <button
                            onClick={() => navigate('/profiles/add')}
                            style={{ fontSize: '12px', color: C.mid, fontWeight: 600 }}
                            className="hover:opacity-75 transition-opacity"
                          >
                            Add your first profile →
                          </button>
                        }
                      />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {profiles.map((profile) => (
                          <ProfileCard
                            key={profile.id}
                            profile={profile}
                            showActions
                            onClick={() => navigate(`/profiles/${profile.id}`)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                {/* Right column */}
                <div className="space-y-7 overflow-visible">

                  {/* AI Panel */}
                  <AIPanel />

                  {/* Upcoming Schedule */}
                  <section>
                    <SH title="Upcoming Schedule" />
                    {sessions.length === 0 ? (
                      <EmptyCard message="No upcoming sessions." />
                    ) : (
                      <div
                        style={{
                          background: C.white,
                          border: `1px solid ${C.border}`,
                          borderRadius: '12px',
                          padding: '20px 20px',
                          boxShadow: C.shadow,
                        }}
                      >
                        <div className="space-y-5">
                          {sessions.slice(0, 5).map((session, i) => (
                            <React.Fragment key={session.id}>
                              {i > 0 && (
                                <div style={{ height: '1px', background: C.border }} />
                              )}
                              <SessionCard session={session} />
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => navigate('/counselling')}
                      style={{
                        marginTop: '12px',
                        fontSize: '12px',
                        color: C.mid,
                        fontWeight: 500,
                        width: '100%',
                        textAlign: 'center',
                        display: 'block',
                      }}
                      className="hover:opacity-75 transition-opacity"
                    >
                      View all counselling sessions →
                    </button>
                  </section>

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
