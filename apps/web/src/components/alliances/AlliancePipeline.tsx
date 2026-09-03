// ============================================================
// OneFlesh — Alliance Pipeline (5-stage visual tracker)
// ============================================================

import React from 'react';
import { ALLIANCE_STAGE_LABELS } from '@oneflesh/shared';
import type { Alliance } from '@oneflesh/shared';
import { Button } from '../ui/Button.js';
import { Pill } from '../ui/Badge.js';

interface AlliancePipelineProps {
  alliance: Alliance;
  onAdvance?: () => void;
  onDissolve?: () => void;
  compact?: boolean;
}

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80';

// Palette — matches the crimson-velvet+white system
const C = {
  white:    '#ffffff',
  dark:     '#2C0F12',
  mid:      '#6B1E23',
  accent:   '#fed7b8',
  border:   'rgba(107,30,35,0.12)',
  muted:    '#9a6060',
  heading:  '#2C0F12',
  shadow:   '0 2px 12px rgba(44,15,18,0.07)',
} as const;

export const AlliancePipeline: React.FC<AlliancePipelineProps> = ({
  alliance,
  onAdvance,
  onDissolve,
  compact = false,
}) => {
  const stages = [1, 2, 3, 4, 5];
  const photo1 = alliance.profile1?.photoUrl ?? FALLBACK_PHOTO;
  const photo2 = alliance.profile2?.photoUrl ?? FALLBACK_PHOTO;

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: C.shadow,
      }}
    >
      {/* Parties */}
      {!compact && (
        <div className="flex items-center gap-4 mb-5">
          {/* Party 1 */}
          <div className="text-center flex-1">
            <div
              className="w-[52px] h-[52px] rounded-full overflow-hidden mx-auto mb-1.5"
              style={{ border: `2px solid ${C.border}` }}
            >
              <img src={photo1} alt={alliance.profile1?.fullName} className="w-full h-full object-cover object-top" />
            </div>
            <div className="font-display text-[15px]" style={{ color: C.heading }}>
              {alliance.profile1?.fullName ?? '—'}
            </div>
            <div className="text-[11px]" style={{ color: C.muted }}>
              {alliance.church1?.name ?? '—'}
            </div>
          </div>

          <div className="text-[22px] flex-shrink-0">💍</div>

          {/* Party 2 */}
          <div className="text-center flex-1">
            <div
              className="w-[52px] h-[52px] rounded-full overflow-hidden mx-auto mb-1.5"
              style={{ border: `2px solid ${C.border}` }}
            >
              <img src={photo2} alt={alliance.profile2?.fullName} className="w-full h-full object-cover object-top" />
            </div>
            <div className="font-display text-[15px]" style={{ color: C.heading }}>
              {alliance.profile2?.fullName ?? '—'}
            </div>
            <div className="text-[11px]" style={{ color: C.muted }}>
              {alliance.church2?.name ?? '—'}
            </div>
          </div>
        </div>
      )}

      {/* Status + opened date */}
      {!compact && (
        <div className="flex justify-between items-center mb-4">
          <div className="text-[11px]" style={{ color: C.muted }}>
            Opened:{' '}
            {new Date(alliance.openedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <Pill variant={alliance.status === 'ACTIVE' ? 'active' : 'completed'}>
            {alliance.status}
          </Pill>
        </div>
      )}

      {/* Pipeline stages */}
      <div className="flex items-start">
        {stages.map((stageNum, i) => {
          const done   = stageNum < alliance.stage;
          const active = stageNum === alliance.stage;
          const label  = ALLIANCE_STAGE_LABELS[stageNum] ?? '';

          return (
            <div key={stageNum} className="flex-1 text-center relative">
              {/* Connector line */}
              {i < stages.length - 1 && (
                <div
                  className="absolute top-3 left-1/2 right-[-50%] h-0.5 z-0"
                  style={{ background: done ? C.mid : C.border }}
                />
              )}

              {/* Dot */}
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] mx-auto mb-1 relative z-10"
                style={{
                  background: done
                    ? C.mid
                    : active
                    ? '#c9a84c'
                    : C.white,
                  borderColor: done
                    ? C.mid
                    : active
                    ? '#c9a84c'
                    : C.border,
                  color: done
                    ? '#fff'
                    : active
                    ? C.dark
                    : C.muted,
                  fontWeight: active ? 700 : 400,
                }}
              >
                {done ? '✓' : stageNum}
              </div>

              {/* Label */}
              <div className="text-[9px] leading-tight px-1" style={{ color: C.muted, letterSpacing: '0.03em' }}>
                {label.split(' ')[0]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {(onAdvance ?? onDissolve) && !compact && (
        <div className="flex gap-2.5 mt-5">
          {onAdvance && alliance.stage < 5 && alliance.status === 'ACTIVE' && (
            <Button variant="primary" size="sm" onClick={onAdvance} className="flex-1">
              Advance Stage
            </Button>
          )}
          {onDissolve && alliance.status === 'ACTIVE' && (
            <Button variant="danger" size="sm" onClick={onDissolve}>
              Dissolve
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
