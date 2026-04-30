import { useEffect, useState } from 'react';
import { Icon } from '../icons';
import { useToasts } from '../store';
import type { Severity } from './AISummaryPanel';

/* ------------------------------------------------------------------ */
/* Shared chrome — centered, compact dialog (max-w 560px)              */
/* ------------------------------------------------------------------ */

function ModalShell({
  title, subtitle, icon, severity, onClose, children, footer,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  severity?: Severity;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const sev = severity === 'critical' ? { dot: 'bg-negative', txt: 'text-negative', label: 'Critical' }
            : severity === 'warning'  ? { dot: 'bg-warning',  txt: 'text-warning',  label: 'Warning'  }
            : severity === 'note'     ? { dot: 'bg-positive', txt: 'text-muted',    label: 'Note'     }
            : null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-slate-900/55 backdrop-blur-[2px] anim-fade-up"
      />
      <div className="fixed inset-0 z-[101] grid place-items-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-[560px] max-h-[85vh] flex flex-col bg-surface border border-rule rounded-xl shadow-e3 overflow-hidden anim-fade-up pointer-events-auto"
        >
          <header className="flex items-start gap-2.5 px-4 py-3 border-b border-rule shrink-0">
            <div className="w-7 h-7 rounded-md bg-brand-tint grid place-items-center text-brand shrink-0 mt-0.5">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-semibold text-ink tracking-tight truncate">{title}</h2>
                {sev && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase ${sev.txt}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                    {sev.label}
                  </span>
                )}
              </div>
              {subtitle && <div className="text-[10.5px] text-faint mt-0.5 truncate">{subtitle}</div>}
            </div>
            <button
              onClick={onClose}
              title="Close"
              aria-label="Close"
              className="w-7 h-7 rounded-md grid place-items-center text-faint hover:text-ink hover:bg-surface-soft shrink-0"
            >
              <Icon.X className="w-4 h-4" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-3 bg-surface-alt/30">
            {children}
          </div>
          <footer className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-rule shrink-0 bg-surface">
            {footer}
          </footer>
        </div>
      </div>
    </>
  );
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between mb-1.5 gap-2">
        <span className="text-[10px] font-bold tracking-wider uppercase text-faint">{label}</span>
        {hint && <span className="text-[10px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Route to Controller modal                                            */
/* ------------------------------------------------------------------ */

interface RouteProps {
  severity: Severity;
  scopeLabel: string;
  varianceDelta?: string;
  onClose: () => void;
}

const CONTROLLERS = [
  { id: 'raj',    name: 'Raj Patel',     role: 'Corporate Controller', avg: '4h avg' },
  { id: 'sasha',  name: 'Sasha Wei',     role: 'Assistant Controller', avg: '6h avg' },
  { id: 'denise', name: 'Denise Owino',  role: 'Regional Controller — APAC', avg: '12h avg' },
];

export function RouteToControllerModal({ severity, scopeLabel, varianceDelta, onClose }: RouteProps) {
  const { push } = useToasts();
  const [assignee, setAssignee] = useState('raj');
  const initialPriority: 'low' | 'medium' | 'high' = severity === 'critical' ? 'high' : severity === 'warning' ? 'medium' : 'low';
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initialPriority);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    if (severity !== 'critical') {
      d.setDate(d.getDate() + (severity === 'warning' ? 1 : 3));
    }
    return d.toISOString().slice(0, 10);
  });
  const [message, setMessage] = useState(
    `${scopeLabel} is tracking ${varianceDelta ?? '−$38M vs Plan'}. Drivers: China macro (−$22M), local competition (−$16M), soft Premium (−$10M); Germany FX (+$3M) partial offset. Need Controller review and JE recommendation.`
  );
  const [evidence, setEvidence] = useState({ aiDiagnosis: true, varianceBridge: true, gltrail: true });
  const [sending, setSending] = useState(false);

  const ctl = CONTROLLERS.find(c => c.id === assignee)!;
  const evidenceCount = Object.values(evidence).filter(Boolean).length;

  const onSend = () => {
    setSending(true);
    setTimeout(() => {
      push({
        kind: 'ok',
        title: `Routed to ${ctl.name}`,
        sub: `Priority ${priority.toUpperCase()} · Due ${dueDate} · ${evidenceCount} evidence attached`,
      });
      onClose();
    }, 500);
  };

  const priorityCls = (p: typeof priority) =>
    priority === p
      ? p === 'high' ? 'bg-negative-weak text-negative border-negative'
        : p === 'medium' ? 'bg-warning-weak text-warning border-warning'
        : 'bg-positive-weak text-positive border-positive'
      : 'border-rule text-muted hover:border-ink hover:text-ink';

  return (
    <ModalShell
      title="Route to Controller"
      subtitle={`${scopeLabel} · ${varianceDelta ?? '−$38M vs Plan'}`}
      icon={<Icon.Share className="w-3.5 h-3.5" />}
      severity={severity}
      onClose={onClose}
      footer={
        <>
          <span className="text-[10.5px] text-faint mr-auto truncate">
            → {ctl.name} · {evidenceCount} evidence
          </span>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-md text-[12px] text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={sending}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold text-white bg-brand hover:opacity-90 disabled:opacity-60"
          >
            {sending ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Routing…
              </>
            ) : (
              <>
                <Icon.Send className="w-3 h-3" />
                Send
              </>
            )}
          </button>
        </>
      }
    >
      <FieldGroup label="Assignee">
        <div className="space-y-1">
          {CONTROLLERS.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setAssignee(c.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md border text-left transition-colors ${
                assignee === c.id ? 'border-brand bg-brand-tint' : 'border-rule hover:border-brand-weak'
              }`}
            >
              <div className="w-6 h-6 rounded-full text-white grid place-items-center text-[9px] font-semibold shrink-0" style={{ background: 'linear-gradient(135deg,#E8C5A8,#B64D1D)' }}>
                {c.name.split(' ').map(s => s[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] font-semibold text-ink truncate">{c.name}</div>
                <div className="text-[10px] text-muted truncate">{c.role}</div>
              </div>
              <span className="text-[10px] text-faint shrink-0">{c.avg}</span>
              {assignee === c.id && <Icon.Check className="w-3.5 h-3.5 text-brand shrink-0" />}
            </button>
          ))}
        </div>
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Priority">
          <div className="flex gap-1">
            {(['high', 'medium', 'low'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 px-2 py-1 rounded-md border text-[11px] font-medium capitalize transition-colors ${priorityCls(p)}`}
              >
                {p}
              </button>
            ))}
          </div>
        </FieldGroup>
        <FieldGroup label="Due date">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full text-[12px] text-ink bg-surface border border-rule focus:border-brand rounded-md px-2 py-1 outline-none"
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Message">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full text-[12px] text-ink bg-surface border border-rule focus:border-brand rounded-md px-2.5 py-2 outline-none resize-none leading-snug"
        />
      </FieldGroup>

      <FieldGroup label="Evidence" hint={`${evidenceCount} attached`}>
        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
          {[
            { k: 'aiDiagnosis',    l: 'AI diagnosis' },
            { k: 'varianceBridge', l: 'Variance bridge' },
            { k: 'gltrail',        l: 'GL trail' },
          ].map(item => {
            const checked = (evidence as Record<string, boolean>)[item.k];
            return (
              <label
                key={item.k}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                  checked ? 'border-brand bg-brand-tint text-brand' : 'border-rule text-muted hover:border-ink'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setEvidence(s => ({ ...s, [item.k]: e.target.checked }))}
                  className="accent-brand"
                />
                <span className="truncate">{item.l}</span>
              </label>
            );
          })}
        </div>
      </FieldGroup>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Add to watchlist modal — compact                                     */
/* ------------------------------------------------------------------ */

interface WatchProps {
  scopeLabel: string;
  onClose: () => void;
}

export function AddToWatchlistModal({ scopeLabel, onClose }: WatchProps) {
  const { push } = useToasts();
  const [threshold, setThreshold] = useState('1');
  const [frequency, setFrequency] = useState<'realtime' | 'daily' | 'weekly'>('daily');
  const [channel, setChannel] = useState<'email' | 'slack' | 'inapp'>('inapp');

  const onSave = () => {
    push({
      kind: 'ok',
      title: 'Added to watchlist',
      sub: `${scopeLabel} · alert if Δ > $${threshold}M · ${frequency} via ${channel}`,
    });
    onClose();
  };

  const pillCls = (active: boolean) =>
    active
      ? 'border-brand bg-brand-tint text-brand'
      : 'border-rule text-muted hover:border-ink hover:text-ink';

  return (
    <ModalShell
      title="Add to watchlist"
      subtitle={scopeLabel}
      icon={<Icon.Pin className="w-3.5 h-3.5" />}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-2.5 py-1 rounded-md text-[12px] text-muted hover:text-ink">Cancel</button>
          <button
            onClick={onSave}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold text-white bg-brand hover:opacity-90"
          >
            <Icon.Pin className="w-3 h-3" />
            Save
          </button>
        </>
      }
    >
      <FieldGroup label="Alert threshold">
        <div className="flex items-center gap-2 text-[12px] text-ink">
          <span className="text-muted">Notify if Δ &gt;</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-20 text-[12px] text-ink bg-surface border border-rule focus:border-brand rounded-md px-2 py-1 outline-none"
          />
          <span className="text-muted">$M</span>
        </div>
      </FieldGroup>
      <FieldGroup label="Frequency">
        <div className="flex gap-1">
          {(['realtime', 'daily', 'weekly'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFrequency(f)}
              className={`flex-1 px-2 py-1 rounded-md border text-[11px] font-medium capitalize ${pillCls(frequency === f)}`}
            >
              {f}
            </button>
          ))}
        </div>
      </FieldGroup>
      <FieldGroup label="Notify via">
        <div className="flex gap-1">
          {(['inapp', 'email', 'slack'] as const).map(c => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`flex-1 px-2 py-1 rounded-md border text-[11px] font-medium capitalize ${pillCls(channel === c)}`}
            >
              {c === 'inapp' ? 'In-app' : c}
            </button>
          ))}
        </div>
      </FieldGroup>
    </ModalShell>
  );
}
