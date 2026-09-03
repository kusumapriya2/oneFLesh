// ============================================================
// OneFlesh — AI Pastoral Assistant Panel
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Mail, BookOpen, BarChart3, CheckSquare, MessageCircle, User, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiApi } from '../../services/api.js';
import type { AIChatMessage } from '@oneflesh/shared';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_ACTIONS = [
  {
    icon: <Search size={18} color="#00ffff" strokeWidth={2} />,
    neon: '#00ffff',
    title: 'Smart Match',
    desc: 'Rank compatible profiles',
    prompt: 'Show me top AI-ranked matches for the current candidate profiles.',
  },
  {
    icon: <Mail size={18} color="#facc15" strokeWidth={2} />,
    neon: '#facc15',
    title: 'Draft Letter',
    desc: 'Pastoral intro letter',
    prompt: 'Draft a pastoral introduction letter for a new alliance.',
  },
  {
    icon: <BookOpen size={18} color="#4ade80" strokeWidth={2} />,
    neon: '#4ade80',
    title: 'Session Prep',
    desc: 'Counselling questions',
    prompt: 'Generate discussion questions for pre-marital counselling Session 3 on Communication & Conflict.',
  },
  {
    icon: <BarChart3 size={18} color="#fb923c" strokeWidth={2} />,
    neon: '#fb923c',
    title: 'Alliance',
    desc: 'Status & next steps',
    prompt: 'Summarise the current active alliances and suggest next pastoral steps.',
  },
  {
    icon: <CheckSquare size={18} color="#34d399" strokeWidth={2} />,
    neon: '#34d399',
    title: 'Checklist',
    desc: 'Church verification',
    prompt: 'Give me the checklist for verifying a new Reformed church application.',
  },
  {
    icon: <MessageCircle size={18} color="#bf5fff" strokeWidth={2} />,
    neon: '#bf5fff',
    title: 'Advice',
    desc: 'Pastoral wisdom',
    prompt: 'What are best practices for a pastor managing multiple alliances at once?',
  },
];

const MIN_W = 340;
const MAX_W = 960;
const MIN_H = 520;
const MAX_H = 1200;

export const AIPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Grace and peace! I'm your AI Pastoral Assistant. I can help with smart matching, drafting letters, counselling questions, and alliance summaries. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dims, setDims] = useState({ width: 420, height: 700 });
  // ghost = proposed size shown while rubber-banding; null when not resizing
  const [ghost, setGhost] = useState<{ w: number; h: number } | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll only within the messages container — never the page
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // ── Rubber-band resize ────────────────────────────────────────
  // Phase 1 (drag): only the ghost outline grows — panel stays put.
  // Phase 2 (release): panel snaps to the ghost size.
  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Lock cursor to resize arrow for the whole drag
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = dims.width;
    const startH = dims.height;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setGhost({
        w: Math.max(MIN_W, Math.min(MAX_W, startW + dx)),
        h: Math.max(MIN_H, Math.min(MAX_H, startH + dy)),
      });
    };

    const onUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Snap panel to ghost on release
      setGhost((prev) => {
        if (prev) setDims({ width: prev.w, height: prev.h });
        return null;
      });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const sendMessage = async (text?: string) => {
    const userMessage = text ?? input.trim();
    if (!userMessage || loading) return;

    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const history: AIChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await aiApi.chat({ message: userMessage, history });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const reply = (response.data?.data?.response as string) ?? 'I could not process that request.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      toast.error('AI assistant unavailable. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I apologise, I am unable to process that request at the moment. Please try again shortly.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    // Wrapper: position:relative + overflow:visible so the rubber-band ghost
    // can extend beyond the current panel boundary.
    <div style={{ position: 'relative', width: dims.width }}>

      {/* ── Main panel — flex column so only the chat area stretches ── */}
      <div
        className="relative bg-gradient-to-br from-[#1a0508] via-[#2d0a14] to-[#1a0508] rounded-xl p-5 select-none flex flex-col"
        style={{ width: dims.width, height: dims.height, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.75)' }}
      >
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-radial-gradient pointer-events-none opacity-10" />

        {/* ── Fixed section (never grows/shrinks) ── */}
        <div className="flex-shrink-0">
          {/* Header badge */}
          <style>{`
            @keyframes starShine {
              0%   { transform: scale(1)    rotate(0deg);   opacity: 0.6; filter: none; }
              20%  { transform: scale(1.6)  rotate(20deg);  opacity: 1;   filter: drop-shadow(0 0 5px #fff) drop-shadow(0 0 10px #facc15) brightness(2.5); }
              40%  { transform: scale(0.9)  rotate(-10deg); opacity: 0.5; filter: none; }
              60%  { transform: scale(1.4)  rotate(15deg);  opacity: 1;   filter: drop-shadow(0 0 4px #fff) drop-shadow(0 0 8px #fff) brightness(2); }
              80%  { transform: scale(1)    rotate(0deg);   opacity: 0.7; filter: none; }
              100% { transform: scale(1)    rotate(0deg);   opacity: 0.6; filter: none; }
            }
            .star-shine {
              display: inline-block;
              animation: starShine 2.4s ease-in-out infinite;
              transform-origin: center;
            }
          `}</style>
          <div className="inline-flex items-center gap-1.5 bg-gold/15 text-gold-light text-[10px] font-semibold tracking-[0.12em] uppercase px-3 py-1 rounded-xl mb-2.5" style={{ border: '1.5px solid rgba(255,255,255,0.75)' }}>
            <span className="star-shine" style={{ fontSize: 11 }}>✦</span>
            AI Pastoral Assistant
          </div>

          <h2 className="font-display text-[20px] font-normal text-white mb-1">
            Your Pastoral Co-Pilot
          </h2>
          <p className="text-[12px] text-white/70 font-light leading-relaxed mb-3">
            Powered by Claude AI. Matching, letters, counselling &amp; alliances.
          </p>

          {/* Quick actions 2×3 grid — fixed, never resizes */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.title}
                onClick={() => void sendMessage(action.prompt)}
                className="bg-white/4 rounded-lg p-2.5 text-left transition-all duration-200 hover:bg-white/8 cursor-pointer select-none"
              style={{ border: '1.5px solid rgba(255,255,255,0.75)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ffffff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.75)'; }}
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center mb-1.5"
                  style={{
                    background: `${action.neon}18`,
                    border: `1px solid ${action.neon}40`,
                    filter: `drop-shadow(0 0 5px ${action.neon}80)`,
                  }}
                >
                  {action.icon}
                </div>
                <div className="text-[11px] font-medium text-gold-light mb-0.5 leading-tight">{action.title}</div>
                <div className="text-[10px] text-white/55 font-light leading-snug">{action.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat box — flex-1 so it fills all remaining height ── */}
        <div className="bg-black/30 rounded-lg p-2.5 flex flex-col flex-1 min-h-0" style={{ border: '1.5px solid rgba(255,255,255,0.75)' }}>
          {/* Messages — flex-1 fills whatever the chat box has left after the input row */}
          <div
            ref={messagesContainerRef}
            className="overflow-y-auto mb-2.5 space-y-2 flex-1 min-h-0"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar icon */}
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mb-0.5"
                  style={
                    msg.role === 'user'
                      ? { background: 'rgba(201,168,76,0.20)', border: '1px solid rgba(201,168,76,0.50)' }
                      : { background: 'rgba(0,255,255,0.12)', border: '1px solid rgba(0,255,255,0.50)', filter: 'drop-shadow(0 0 5px rgba(0,255,255,0.7))' }
                  }
                >
                  {msg.role === 'user'
                    ? <User size={12} color="#facc15" strokeWidth={2} />
                    : <Sparkles size={12} color="#00ffff" strokeWidth={2} />
                  }
                </div>

                {/* Bubble */}
                <div
                  className={[
                    'inline-block px-3 py-1.5 text-[12px] max-w-[80%] leading-relaxed select-text',
                    msg.role === 'user'
                      ? 'bg-gold/18 text-gold-light text-right'
                      : 'bg-white/7 text-white/90',
                  ].join(' ')}
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\n/g, '<br/>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
                  }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex gap-1 px-3 py-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input — fixed, never grows */}
          <div className="flex gap-1.5 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about matches, letters, counselling…"
              disabled={loading}
              className="flex-1 rounded-md px-3 py-2 text-[12px] text-white placeholder:text-white/30 outline-none transition-colors disabled:opacity-50 select-text"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.75)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#ffffff'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.75)'; }}
            />
            <button
              onClick={() => void sendMessage()}
              disabled={loading || !input.trim()}
              className="px-3.5 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-1"
              style={{
                background: '#2C0F12',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 14px rgba(44,15,18,0.50)',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#3d1015'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2C0F12'; }}
            >
              <Send size={12} />
              Ask ✦
            </button>
          </div>
        </div>

        {/* ── Resize handle (bottom-right corner) ─────────────── */}
        <div
          onMouseDown={onResizeStart}
          className="absolute bottom-0 right-0 z-20 group cursor-nwse-resize"
          style={{ padding: '6px' }}
        >
          {/* Visible grip tile */}
          <div
            className="flex items-center justify-center rounded-md transition-all duration-200"
            style={{
              width: 28,
              height: 28,
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.30)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(201,168,76,0.25)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,168,76,0.65)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(201,168,76,0.12)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,168,76,0.30)';
            }}
          >
            {/* 3×3 dot grid — standard resize grip */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              {[4, 8, 12].map((x) =>
                [4, 8, 12].map((y) => (
                  <circle
                    key={`${x}-${y}`}
                    cx={x} cy={y} r="1.2"
                    fill="rgba(255,255,255,0.90)"
                    className="group-hover:fill-white transition-colors"
                  />
                ))
              )}
            </svg>
          </div>

          {/* Tooltip — appears above the handle on hover */}
          <div
            className="pointer-events-none absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ whiteSpace: 'nowrap' }}
          >
            <div
              style={{
                background: 'rgba(26,5,8,0.95)',
                border: '1px solid rgba(201,168,76,0.35)',
                borderRadius: 6,
                padding: '4px 9px',
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(201,168,76,0.95)',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              ↔ Drag to resize
            </div>
            {/* Arrow pointing down toward the handle */}
            <div
              style={{
                position: 'absolute',
                bottom: -5,
                right: 10,
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid rgba(201,168,76,0.35)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Rubber-band ghost (shown while dragging) ─────────── */}
      {ghost && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ghost.w,
            height: ghost.h,
            border: '2px dashed rgba(255,255,255,0.65)',
            borderRadius: 0,
            pointerEvents: 'none',
            zIndex: 50,
            background: 'rgba(201,168,76,0.035)',
            boxShadow: '0 0 0 1px rgba(201,168,76,0.15)',
          }}
        >
          {/* Size readout in the ghost's bottom-right corner */}
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              right: 14,
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(201,168,76,0.9)',
              background: 'rgba(26,5,8,0.88)',
              padding: '2px 7px',
              borderRadius: 4,
              letterSpacing: '0.04em',
              border: '1px solid rgba(201,168,76,0.25)',
            }}
          >
            {ghost.w} × {ghost.h}
          </div>
        </div>
      )}
    </div>
  );
};
