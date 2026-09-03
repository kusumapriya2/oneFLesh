// ============================================================
// OneFlesh — Alliances List Page (Crimson Velvet + White)
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import type { Alliance, PaginatedResponse } from '@oneflesh/shared';
import { AllianceStatus } from '@oneflesh/shared';
import { alliancesApi } from '../../services/api.js';
import { AlliancePipeline } from '../../components/alliances/AlliancePipeline.js';
import { PageWrapper } from '../../components/layout/PageWrapper.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Tabs, TabPanel } from '../../components/ui/Tabs.js';

const C = {
  dark: '#2C0F12',
  mid: '#6B1E23',
  muted: '#9a6060',
  border: 'rgba(107,30,35,0.12)',
  inputBorder: 'rgba(107,30,35,0.18)',
  inputFocus: 'rgba(107,30,35,0.50)',
  inputBorderError: 'rgba(239,68,68,0.60)',
} as const;

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
    if (!note.trim()) {
      setError('A note is required to advance the stage.');
      return;
    }
    setError('');
    onConfirm(note.trim());
  };

  const handleClose = () => {
    setNote('');
    setError('');
    onClose();
  };

  const borderColor = error ? C.inputBorderError : C.inputBorder;

  return (
    <Modal open={open} onClose={handleClose} title="Advance Stage" maxWidth="max-w-[480px]">
      <div className="px-6 pb-6 pt-4">
        <p className="text-[13px] mb-4" style={{ color: C.muted }}>
          Please add a note describing the progress before advancing to the next stage.
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
            style={{
              background: '#ffffff',
              border: `1px solid ${borderColor}`,
              color: C.dark,
            }}
            onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = C.inputFocus; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = error ? C.inputBorderError : C.inputBorder; }}
          />
          {error && <p className="text-red-600 text-[11px] mt-1">{error}</p>}
        </div>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" className="flex-1" onClick={handleConfirm} loading={loading}>
            Advance Stage
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
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
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Alliance Card ─────────────────────────────────────────────
interface AllianceCardProps {
  alliance: Alliance;
  onAdvance: (id: string) => void;
  onDissolve: (id: string) => void;
}

function AllianceCard({ alliance, onAdvance, onDissolve }: AllianceCardProps) {
  const navigate = useNavigate();
  const isActive = alliance.status === AllianceStatus.ACTIVE;

  return (
    <div className="cursor-pointer" onClick={() => navigate(`/alliances/${alliance.id}`)}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div onClick={(e) => e.stopPropagation()}>
        <AlliancePipeline
          alliance={alliance}
          onAdvance={isActive && alliance.stage < 5 ? () => onAdvance(alliance.id) : undefined}
          onDissolve={isActive ? () => onDissolve(alliance.id) : undefined}
        />
      </div>
    </div>
  );
}

// ─── Tabs config ──────────────────────────────────────────────
type TabId = 'all' | 'active' | 'completed' | 'dissolved';

const TAB_DEFS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'dissolved', label: 'Dissolved' },
] as const;

function filterAlliances(alliances: Alliance[], tab: TabId): Alliance[] {
  if (tab === 'all') return alliances;
  return alliances.filter((a) => a.status.toLowerCase() === tab);
}

// ─── Main Page ─────────────────────────────────────────────────
export default function AlliancesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [dissolvingId, setDissolvingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['alliances'],
    queryFn: () => alliancesApi.list().then((r) => r.data as { data: PaginatedResponse<Alliance> }),
  });

  const alliances = (data?.data?.items as Alliance[]) ?? [];
  const displayed = filterAlliances(alliances, activeTab);

  const advanceMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => alliancesApi.advance(id, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alliances'] });
      setAdvancingId(null);
    },
  });

  const dissolveMutation = useMutation({
    mutationFn: (id: string) => alliancesApi.dissolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alliances'] });
      setDissolvingId(null);
    },
  });

  const tabs = TAB_DEFS.map((t) => ({
    id: t.id,
    label: t.label,
    badge:
      t.id !== 'all'
        ? alliances.filter((a) => a.status.toLowerCase() === t.id).length
        : undefined,
  }));

  return (
    <PageWrapper>
      <div className="max-w-[860px] mx-auto px-6 py-9">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <h1 className="font-display text-[32px] font-normal" style={{ color: C.dark }}>
            My Alliances
          </h1>
          <Button variant="primary" size="sm" onClick={() => navigate('/profiles')}>
            <Plus size={14} />
            New Alliance
          </Button>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} defaultTab="all" onChange={(id) => setActiveTab(id as TabId)}>
          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="rounded-[10px] h-[200px] animate-pulse"
                  style={{ background: 'rgba(107,30,35,0.07)', border: `1px solid ${C.border}` }}
                />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <p className="text-red-600 text-[13px] py-8 text-center">
              Could not load alliances. Please try again.
            </p>
          )}

          {/* Empty */}
          {!isLoading && !isError && displayed.length === 0 && (
            <div className="text-center py-16">
              <div className="font-display text-[44px] mb-3" style={{ color: 'rgba(107,30,35,0.15)' }}>💍</div>
              <p className="font-display text-[20px] mb-2" style={{ color: C.dark }}>No alliances yet</p>
              <p className="text-[13px]" style={{ color: C.muted }}>
                Express interest in a profile to begin an alliance.
              </p>
            </div>
          )}

          {/* Alliance list */}
          {!isLoading && !isError && displayed.length > 0 && (
            <div className="space-y-5">
              {TAB_DEFS.map((tab) => (
                <TabPanel key={tab.id} id={tab.id} activeTab={activeTab}>
                  {filterAlliances(alliances, tab.id as TabId).map((alliance) => (
                    <div key={alliance.id} className="mb-5">
                      <AllianceCard
                        alliance={alliance}
                        onAdvance={setAdvancingId}
                        onDissolve={setDissolvingId}
                      />
                    </div>
                  ))}
                </TabPanel>
              ))}
            </div>
          )}
        </Tabs>
      </div>

      <AdvanceModal
        open={advancingId !== null}
        onClose={() => setAdvancingId(null)}
        loading={advanceMutation.isPending}
        onConfirm={(note) => { if (advancingId) advanceMutation.mutate({ id: advancingId, note }); }}
      />

      <DissolveDialog
        open={dissolvingId !== null}
        onClose={() => setDissolvingId(null)}
        loading={dissolveMutation.isPending}
        onConfirm={() => { if (dissolvingId) dissolveMutation.mutate(dissolvingId); }}
      />
    </PageWrapper>
  );
}
