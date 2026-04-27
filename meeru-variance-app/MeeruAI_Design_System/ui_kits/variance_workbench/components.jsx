// Variance Workbench UI Kit — components
// Global-scoped styles use `vwStyles` to avoid collisions.

const { useState } = React;
const D = window.KITDATA;

// ————————————————————————————————————————————————————————————————
// Icons — Lucide-style inline strokes (stroke-width 2, round caps)
// ————————————————————————————————————————————————————————————————
const Ic = {
  Home: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  Chart: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  Calendar: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Bolt: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  File: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Settings: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Menu: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Moon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sparkle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>,
  Send: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Pin: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1V4H8v2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>,
  Mail: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Clock: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Slack: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="8" height="2" rx="1"/><rect x="13" y="11" width="8" height="2" rx="1"/><rect x="11" y="3" width="2" height="8" rx="1"/><rect x="11" y="13" width="2" height="8" rx="1"/></svg>,
  Search: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  ChevDown: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Refresh: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

// ————————————————————————————————————————————————————————————————
// Icon Sidebar
// ————————————————————————————————————————————————————————————————
function IconSidebar({ active, onNavigate }) {
  const items = [
    { key: 'home', Ic: Ic.Home, title: 'Workspace' },
    { key: 'variance', Ic: Ic.Chart, title: 'Decision Intelligence' },
    { key: 'close', Ic: Ic.Calendar, title: 'Close Intelligence' },
    { key: 'automation', Ic: Ic.Bolt, title: 'Automation' },
    { key: 'reports', Ic: Ic.File, title: 'Reports' },
  ];
  return (
    <aside className="vw-sidebar">
      {items.map(it => (
        <button key={it.key} title={it.title} onClick={() => onNavigate?.(it.key)}
          className={`vw-side-btn ${active === it.key ? 'is-active' : ''}`}>
          <it.Ic width={20} height={20} />
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button title="Settings" className="vw-side-btn"><Ic.Settings width={20} height={20} /></button>
    </aside>
  );
}

// ————————————————————————————————————————————————————————————————
// App Header
// ————————————————————————————————————————————————————————————————
function AppHeader() {
  return (
    <header className="vw-header">
      <div className="vw-header-left">
        <button className="vw-icon-btn"><Ic.Menu width={16} height={16} /></button>
        <img src="../../assets/meeru-logo.png" alt="MeeruAI" className="vw-logo" />
      </div>
      <div className="vw-header-right">
        <button className="vw-context-switcher">
          <Ic.Chart width={14} height={14} style={{ color: 'var(--text-muted)' }}/>
          <span className="vw-ctx-label">Performance</span>
          <span className="vw-ctx-dot">·</span>
          <span className="vw-ctx-persona">CFO</span>
          <Ic.ChevDown width={12} height={12} style={{ color: 'var(--text-faint)' }}/>
        </button>
        <button className="vw-icon-btn vw-sparkle-btn" title="AI panel"><Ic.Sparkle width={16} height={16} /></button>
        <button className="vw-icon-btn" title="Theme"><Ic.Moon width={16} height={16} /></button>
        <button className="vw-profile">
          <div className="vw-avatar">{D.persona.init}</div>
          <div className="vw-profile-meta">
            <div className="vw-profile-name">{D.persona.name}</div>
            <div className="vw-profile-role">{D.persona.role}</div>
          </div>
          <Ic.ChevDown width={12} height={12} style={{ color: 'var(--text-faint)' }}/>
        </button>
      </div>
    </header>
  );
}

// ————————————————————————————————————————————————————————————————
// Workbench tabs row
// ————————————————————————————————————————————————————————————————
function WorkbenchTabs({ active, onChange }) {
  const tabs = [
    { key: 'performance', label: 'Performance', Ic: Ic.Chart },
    { key: 'margin', label: 'Margin', Ic: Ic.Chart },
    { key: 'flux', label: 'Flux', Ic: Ic.Chart },
  ];
  return (
    <div className="vw-tabs">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange?.(t.key)}
          className={`vw-tab ${active === t.key ? 'is-active' : ''}`}>
          <t.Ic width={14} height={14} />
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Top nav (breadcrumb + scope)
// ————————————————————————————————————————————————————————————————
function TopNav({ scope }) {
  return (
    <div className="vw-topnav">
      <div className="vw-topnav-left">
        <div className="vw-eyebrow">Performance Intelligence</div>
        <div className="vw-topnav-title">Good morning, {D.persona.name.split(' ')[0]}.</div>
      </div>
      <div className="vw-scope">
        <Ic.Refresh width={12} height={12} />
        <span>{scope}</span>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Left rail — regions + segments with delta
// ————————————————————————————————————————————————————————————————
function LeftRail({ regionKey, onRegion }) {
  return (
    <aside className="vw-rail">
      <div className="vw-rail-lbl">Regions</div>
      {D.regions.map(r => (
        <button key={r.key} onClick={() => onRegion?.(r.key)}
          className={`vw-rail-item ${regionKey === r.key ? 'is-active' : ''}`}>
          <span>{r.label}</span>
          <span className={`vw-rail-delta vw-tone-${r.tone}`}>{r.delta}</span>
        </button>
      ))}
      <div className="vw-rail-lbl" style={{ marginTop: 14 }}>Segments</div>
      {D.segments.map(s => (
        <button key={s.key} className="vw-rail-item">
          <span>{s.label}</span>
          <span className={`vw-rail-delta vw-tone-${s.tone}`}>{s.delta}</span>
        </button>
      ))}
    </aside>
  );
}

// ————————————————————————————————————————————————————————————————
// KPI Row
// ————————————————————————————————————————————————————————————————
function KpiRow({ kpis }) {
  return (
    <div className="vw-kpi-row">
      {kpis.map((k, i) => (
        <div key={i} className={`vw-kpi ${k.watch ? 'vw-kpi-watch' : ''}`}>
          <div className="vw-kpi-head">
            <div className="vw-kpi-label">{k.lbl}</div>
            {k.watch && (
              <span className="vw-watch-tag"><span className="vw-dot" /> Watch</span>
            )}
          </div>
          <div className="vw-kpi-value num">{k.val}</div>
          <div className={`vw-kpi-delta vw-tone-${k.tone}`}>{k.delta}</div>
        </div>
      ))}
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Variance Chart (inline SVG, hand-rolled)
// ————————————————————————————————————————————————————————————————
function VarianceChart({ title, bars }) {
  const W = 720, H = 170, pad = 32;
  const max = Math.max(...bars.map(b => Math.abs(b.a)), ...bars.map(b => Math.abs(b.p)));
  const hasNeg = bars.some(b => b.a < 0);
  const mid = hasNeg ? H / 2 : H - pad;
  const usableH = hasNeg ? (H / 2 - 20) : (H - pad - 20);
  const slot = (W - pad * 2) / bars.length;
  const bw = Math.min(26, slot * 0.38);
  const toneColor = (t) => t === 'neg' ? 'var(--negative)' : t === 'pos' ? 'var(--positive)' : t === 'warn' ? 'var(--warning)' : 'var(--primary)';

  return (
    <div className="vw-card">
      <div className="vw-chart-head">
        <div className="vw-card-title">{title}</div>
        <div className="vw-legend">
          <span><span className="vw-sq" style={{ background: 'var(--primary)' }} />Actual</span>
          <span><span className="vw-sq" style={{ background: 'var(--rule)' }} />Plan</span>
          <span><span className="vw-sq" style={{ backgroundImage: 'repeating-linear-gradient(45deg,var(--primary),var(--primary) 2px,transparent 2px,transparent 4px)' }} />Forecast</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 180 }}>
        <defs>
          {bars.map((b, i) => b.forecast && (
            <pattern key={i} id={`fx-${i}`} width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill={toneColor(b.tone)} opacity="0.35" />
              <path d="M0,4 L4,0" stroke={toneColor(b.tone)} strokeWidth="1" />
            </pattern>
          ))}
        </defs>
        <line x1={pad} y1={mid} x2={W - pad} y2={mid} stroke="var(--rule)" strokeWidth="1" />
        {bars.map((b, i) => {
          const x = pad + slot * i + slot / 2;
          const ha = (Math.abs(b.a) / max) * usableH;
          const hp = (Math.abs(b.p) / max) * usableH;
          const aY = b.a >= 0 ? mid - ha : mid;
          const pY = b.p >= 0 ? mid - hp : mid;
          const fill = b.forecast ? `url(#fx-${i})` : toneColor(b.tone);
          const labelY = b.a >= 0 ? aY - 5 : aY + ha + 12;
          return (
            <g key={i}>
              <rect x={x - bw - 1} y={pY} width={bw} height={hp} fill="var(--rule)" rx={2} opacity={0.6} />
              <rect x={x - 1} y={aY} width={bw} height={ha} fill={fill} rx={2} />
              <text x={x - 1 + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--text-faint)">{b.w}</text>
              <text x={x - 1 + bw / 2} y={labelY} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{b.a}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// AI Commentary
// ————————————————————————————————————————————————————————————————
function Commentary({ items, persona }) {
  return (
    <div className="vw-card">
      <div className="vw-chart-head">
        <div className="vw-card-title">AI Commentary — Ranked by Impact</div>
        <div className="vw-ranked-for">Ranked for {persona}</div>
      </div>
      {items.map(it => (
        <div key={it.rank} className="vw-comment-row">
          <div className="vw-rank">{it.rank}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="vw-comment-title">
              {it.title} <span className="vw-comment-delta">— {it.delta}</span>
            </div>
            <div className="vw-comment-body">{it.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Next Best Action strip
// ————————————————————————————————————————————————————————————————
function NextBestAction({ items, onSend, sentIdx }) {
  const iconFor = (k) => ({ mail: Ic.Mail, pin: Ic.Pin, slack: Ic.Slack, clock: Ic.Clock }[k] || Ic.Send);
  return (
    <div className="vw-nba-wrap">
      <div className="vw-nba-eyebrow">▸ Next Best Action · ranked for CFO</div>
      <div className="vw-nba-scroll">
        {items.map((it, i) => {
          const IcK = iconFor(it.icon);
          const isSent = sentIdx === i;
          return (
            <div key={i} className="vw-nba-card">
              <span className="vw-nba-accent" style={{ background: it.accent }} />
              <div className="vw-nba-head"><IcK width={12} height={12} /><span>{it.channel}</span></div>
              <div className="vw-nba-body">{it.body}</div>
              <div className="vw-nba-ft">
                <button className="vw-nba-edit">Edit</button>
                <button onClick={() => onSend?.(i)}
                  className={`vw-nba-send ${isSent ? 'is-sent' : ''}`}>
                  {isSent ? '✓ Sent' : 'Send'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Chat panel (right side)
// ————————————————————————————————————————————————————————————————
function ChatPanel({ messages, onSend, value, onChange }) {
  return (
    <div className="vw-chat">
      <div className="vw-chat-head">
        <Ic.Sparkle width={14} height={14} style={{ color: 'var(--primary)' }} />
        <div className="vw-chat-title">Meeru</div>
        <span className="vw-chat-status"><span className="vw-dot" /> Active</span>
      </div>
      <div className="vw-chat-body">
        <div className="vw-chat-scope">{D.scope}</div>
        {messages.map((m, i) => (
          <div key={i} className={`vw-msg vw-msg-${m.who}`}>
            {m.who === 'ai' && <div className="vw-msg-avatar">M</div>}
            <div className="vw-msg-bubble">
              <div className="vw-msg-body">{m.body}</div>
              <div className="vw-msg-time">{m.time}</div>
            </div>
          </div>
        ))}
      </div>
      <form className="vw-chat-composer" onSubmit={(e) => { e.preventDefault(); onSend?.(); }}>
        <input value={value} onChange={e => onChange?.(e.target.value)}
          placeholder="Ask Meeru about this variance…" className="vw-chat-input" />
        <button type="submit" className="vw-chat-send"><Ic.Send width={14} height={14} /></button>
      </form>
    </div>
  );
}

// Expose to other scripts
Object.assign(window, {
  Ic, IconSidebar, AppHeader, WorkbenchTabs, TopNav, LeftRail,
  KpiRow, VarianceChart, Commentary, NextBestAction, ChatPanel,
});
