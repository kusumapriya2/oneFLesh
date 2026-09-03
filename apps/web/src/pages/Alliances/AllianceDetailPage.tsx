// ============================================================
// OneFlesh — Alliance Detail Page (Crimson Velvet + White)
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Send } from 'lucide-react';
import type { Alliance, AllianceNote, CounsellingSession, PaginatedResponse } from '@oneflesh/shared';
import { AllianceStatus } from '@oneflesh/shared';
import { alliancesApi, counsellingApi } from '../../services/api.js';
import { AlliancePipeline } from '../../components/alliances/AlliancePipeline.js';
import { PageWrapper } from '../../components/layout/PageWrapper.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Tabs, TabPanel } from '../../components/ui/Tabs.js';
import { Pill } from '../../components/ui/Badge.js';

const C = {
  dark:        '#2C0F12',
  mid:         '#6B1E23',
  accent:      '#fed7b8',
  muted:       '#9a6060',
  white:       '#ffffff',
  border:      'rgba(107,30,35,0.12)',
  borderMid:   'rgba(107,30,35,0.22)',
  skeleton:    'rgba(107,30,35,0.08)',
  inputBorder: 'rgba(107,30,35,0.18)',
  inputFocus:  'rgba(107,30,35,0.50)',
  inputBorderError: 'rgba(239,68,68,0.60)',
} as const;

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80';

// ─── Advance Stage Modal ──────────────────────────────────────
interface AdvanceModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  loading: boolean;
}

function AdvanceModal({ open, onClose, onConfirm, loading }: AdvanceModalProps) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!note.trim()) { setError('A note is required to advance the stage.'); return; }
    setError('');
    onConfirm(note.trim());
  };

  const handleClose = () => { setNote(''); setError(''); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Advance Stage" maxWidth="max-w-[480px]">
      <div className="px-6 pb-6 pt-4">
        <p className="text-[13px] mb-4" style={{ color: C.muted }}>
          Add a note describing progress before advancing to the next stage.
        </p>
        <div className="mb-4">
          <label className="block text-[11px] font-medium tracking-[0.07em] uppercase mb-1.5" style={{ color: C.mid }}>
            Note *
          </label>
          <textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); if (error) setError(''); }}
            placeholder="Describe what happened at this stage…"
            rows={4}
            className="w-full px-3 py-2.5 font-body text-[13px] rounded-[5px] outline-none resize-vertical transition-colors"
            style={{ background: C.white, border: `1px solid ${error ? C.inputBorderError : C.inputBorder}`, color: C.dark }}
            onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = C.inputFocus; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = error ? C.inputBorderError : C.inputBorder; }}
          />
          {error && <p className="text-red-600 text-[11px] mt-1">{error}</p>}
        </div>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" className="flex-1" onClick={handleConfirm} loading={loading}>
            Advance Stage
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Dissolve Confirm Dialog ──────────────────────────────────
interface DissolveDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function DissolveDialog({ open, onClose, onConfirm, loading }: DissolveDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Dissolve Alliance" maxWidth="max-w-[420px]">
      <div className="px-6 pb-6 pt-4">
        <p className="text-[13px] mb-5" style={{ color: C.muted }}>
          Are you sure you want to dissolve this alliance? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" size="sm" className="flex-1" onClick={onConfirm} loading={loading}>
            Dissolve Alliance
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Notes Timeline ───────────────────────────────────────────
function NotesTab({ allianceId }: { allianceId: string }) {
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState('');

  const { data: notesData, isLoading } = useQuery({
    queryKey: ['alliance-notes', allianceId],
    queryFn: () => alliancesApi.getNotes(allianceId).then((r) => r.data as { data: AllianceNote[] }),
  });

  const notes = notesData?.data ?? [];

  const addNote = useMutation({
    mutationFn: (content: string) => alliancesApi.addNote(allianceId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alliance-notes', allianceId] });
      setNoteText('');
    },
  });

  const handleSubmitNote = () => {
    if (!noteText.trim()) { setNoteError('Note cannot be empty.'); return; }
    if (noteText.trim().length < 5) { setNoteError('Note must be at least 5 characters.'); return; }
    setNoteError('');
    addNote.mutate(noteText.trim());
  };

  return (
    <div>
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-[72px] rounded-[8px] animate-pulse" style={{ background: C.skeleton }} />
          ))}
        </div>
      )}

      {!isLoading && notes.length === 0 && (
        <p className="text-[13px] italic text-center py-8" style={{ color: C.muted }}>
          No notes yet. Add the first note below.
        </p>
      )}

      {!isLoading && notes.length > 0 && (
        <div className="space-y-3 mb-6">
          {[...notes]
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((note) => (
              <div
                key={note.id}
                className="rounded-[8px] px-4 py-3"
                style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(44,15,18,0.05)' }}
              >
                <div className="flex justify-between items-start gap-3 mb-1.5">
                  <span className="text-[12px] font-medium" style={{ color: C.mid }}>
                    {note.author?.email ?? 'Pastor'}
                  </span>
                  <span className="text-[11px] flex-shrink-0" style={{ color: C.muted }}>
                    {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-[13px] font-light leading-relaxed" style={{ color: '#4a1a1e' }}>
                  {note.content}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* Add note */}
      <div className="pt-5" style={{ borderTop: `1px solid ${C.border}` }}>
        <label className="block text-[11px] font-medium tracking-[0.07em] uppercase mb-1.5" style={{ color: C.mid }}>
          Add Note
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              value={noteText}
              onChange={(e) => { setNoteText(e.target.value); if (noteError) setNoteError(''); }}
              placeholder="Add a note about this alliance…"
              rows={3}
              className="w-full px-3 py-2.5 font-body text-[13px] rounded-[5px] outline-none resize-none transition-colors"
              style={{
                background: C.white,
                border: `1px solid ${noteError ? C.inputBorderError : C.inputBorder}`,
                color: C.dark,
              }}
              onFocus={(e) => { if (!noteError) e.currentTarget.style.borderColor = C.inputFocus; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = noteError ? C.inputBorderError : C.inputBorder; }}
            />
            {noteError && <p className="text-red-600 text-[11px] mt-1">{noteError}</p>}
          </div>
          <Button variant="primary" size="sm" onClick={handleSubmitNote} loading={addNote.isPending} className="self-start mt-0.5">
            <Send size={13} />
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Schedule Tab ─────────────────────────────────────────────
function ScheduleTab({ allianceId }: { allianceId: string }) {
  const { data } = useQuery({
    queryKey: ['counselling', 'alliance', allianceId],
    queryFn: () => counsellingApi.list({ allianceId }).then((r) => r.data as { data: PaginatedResponse<CounsellingSession> }),
  });

  const sessions = (data?.data?.items as CounsellingSession[]) ?? [];

  if (sessions.length === 0) {
    return (
      <p className="text-[13px] italic text-center py-8" style={{ color: C.muted }}>
        No counselling sessions scheduled for this alliance.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="rounded-[8px] px-4 py-3 flex items-center justify-between gap-4"
          style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(44,15,18,0.05)' }}
        >
          <div>
            <p className="text-[13px] font-medium" style={{ color: C.dark }}>
              Session {session.sessionNumber}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
              {session.sessionDate
                ? new Date(session.sessionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Date TBD'}{' '}
              · {session.format.replace('_', ' ')}
            </p>
          </div>
          <Pill variant={session.status === 'COMPLETED' ? 'completed' : session.status === 'CANCELLED' ? 'dissolved' : 'active'}>
            {session.status}
          </Pill>
        </div>
      ))}
    </div>
  );
}

// ─── Counselling Tab ──────────────────────────────────────────
function CounsellingTab({ alliance }: { alliance: Alliance }) {
  return (
    <div className="text-center py-12">
      <div className="font-display text-[38px] mb-3" style={{ color: 'rgba(107,30,35,0.15)' }}>✦</div>
      <p className="font-display text-[18px] mb-1" style={{ color: C.dark }}>Pre-Marital Counselling</p>
      <p className="text-[13px] mb-5" style={{ color: C.muted }}>
        This alliance is at stage {alliance.stage}. Counselling is available at stage 4.
      </p>
      {alliance.stage < 4 && (
        <p className="text-[12px] italic" style={{ color: C.muted }}>
          Advance the alliance to Pre-Marital Counselling stage to schedule sessions.
        </p>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
const DETAIL_TABS = [
  { id: 'notes', label: 'Notes Timeline' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'counselling', label: 'Counselling' },
];

export default function AllianceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('notes');
  const [showAdvance, setShowAdvance] = useState(false);
  const [showDissolve, setShowDissolve] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['alliance', id],
    queryFn: () => alliancesApi.get(id!).then((r) => r.data as { data: Alliance }),
    enabled: !!id,
  });

  const alliance = data?.data;

  const advanceMutation = useMutation({
    mutationFn: ({ note }: { note: string }) => alliancesApi.advance(id!, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alliance', id] });
      queryClient.invalidateQueries({ queryKey: ['alliances'] });
      setShowAdvance(false);
    },
  });

  const dissolveMutation = useMutation({
    mutationFn: () => alliancesApi.dissolve(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alliances'] });
      navigate('/alliances');
    },
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="max-w-[800px] mx-auto px-6 py-9 space-y-5">
          <div className="h-8 w-32 rounded animate-pulse" style={{ background: C.skeleton }} />
          <div className="h-[220px] rounded-[12px] animate-pulse" style={{ background: C.skeleton }} />
          <div className="h-[140px] rounded-[12px] animate-pulse" style={{ background: C.skeleton }} />
        </div>
      </PageWrapper>
    );
  }

  if (isError || !alliance) {
    return (
      <PageWrapper>
        <div className="max-w-[800px] mx-auto px-6 py-9 text-center">
          <p className="text-red-600 text-[14px]">Alliance not found or could not be loaded.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => navigate('/alliances')}>
            Back to Alliances
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const photo1 = alliance.profile1?.photoUrl ?? FALLBACK_PHOTO;
  const photo2 = alliance.profile2?.photoUrl ?? FALLBACK_PHOTO;
  const isActive = alliance.status === AllianceStatus.ACTIVE;

  return (
    <PageWrapper>
      <div className="max-w-[800px] mx-auto px-6 py-9">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate('/alliances')}
          className="flex items-center gap-1.5 text-[12px] transition-colors mb-6"
          style={{ color: C.muted }}
          onMouseEnter={(e) => { e.currentTarget.style.color = C.mid; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
        >
          <ChevronLeft size={14} />
          Back to Alliances
        </button>

        {/* Alliance header — dark crimson card */}
        <div
          className="rounded-[12px] p-6 mb-5 text-center"
          style={{ background: '#2C0F12', border: '1px solid rgba(254,215,184,0.10)' }}
        >
          <div className="flex items-center justify-center gap-5 mb-4">
            {/* Party 1 */}
            <div className="text-center">
              <div className="w-[64px] h-[64px] rounded-full overflow-hidden mx-auto mb-2" style={{ border: '2px solid rgba(254,215,184,0.35)' }}>
                <img src={photo1} alt={alliance.profile1?.fullName} className="w-full h-full object-cover object-top" />
              </div>
              <p className="font-display text-[17px]" style={{ color: '#fed7b8' }}>
                {alliance.profile1?.fullName ?? '—'}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(254,215,184,0.55)' }}>
                {alliance.church1?.name ?? '—'}
              </p>
            </div>

            <div className="text-[28px] flex-shrink-0" style={{ opacity: 0.85 }}>💍</div>

            {/* Party 2 */}
            <div className="text-center">
              <div className="w-[64px] h-[64px] rounded-full overflow-hidden mx-auto mb-2" style={{ border: '2px solid rgba(254,215,184,0.35)' }}>
                <img src={photo2} alt={alliance.profile2?.fullName} className="w-full h-full object-cover object-top" />
              </div>
              <p className="font-display text-[17px]" style={{ color: '#fed7b8' }}>
                {alliance.profile2?.fullName ?? '—'}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(254,215,184,0.55)' }}>
                {alliance.church2?.name ?? '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Pill variant={alliance.status === 'ACTIVE' ? 'active' : alliance.status === 'COMPLETED' ? 'completed' : 'dissolved'}>
              {alliance.status}
            </Pill>
            <span className="text-[11px]" style={{ color: 'rgba(254,215,184,0.50)' }}>
              Opened:{' '}
              {new Date(alliance.openedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Pipeline tracker */}
        <div className="mb-5">
          <AlliancePipeline alliance={alliance} compact={false} />
        </div>

        {/* Action buttons */}
        {isActive && (
          <div className="flex gap-3 mb-7">
            {alliance.stage < 5 && (
              <Button variant="primary" size="sm" onClick={() => setShowAdvance(true)}>
                Advance Stage
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={() => setShowDissolve(true)}>
              Dissolve
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs tabs={DETAIL_TABS} defaultTab="notes" onChange={setActiveTab}>
          <TabPanel id="notes" activeTab={activeTab}>
            <NotesTab allianceId={alliance.id} />
          </TabPanel>
          <TabPanel id="schedule" activeTab={activeTab}>
            <ScheduleTab allianceId={alliance.id} />
          </TabPanel>
          <TabPanel id="counselling" activeTab={activeTab}>
            <CounsellingTab alliance={alliance} />
          </TabPanel>
        </Tabs>
      </div>

      <AdvanceModal
        open={showAdvance}
        onClose={() => setShowAdvance(false)}
        loading={advanceMutation.isPending}
        onConfirm={(note) => advanceMutation.mutate({ note })}
      />
      <DissolveDialog
        open={showDissolve}
        onClose={() => setShowDissolve(false)}
        loading={dissolveMutation.isPending}
        onConfirm={() => dissolveMutation.mutate()}
      />
    </PageWrapper>
  );
}
