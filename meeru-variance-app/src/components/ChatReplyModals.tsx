import { useState } from 'react';
import { useToasts } from '../store';
import { Icon } from '../icons';

/**
 * Shared modal shell — click-outside + Esc close handled by caller.
 */
function ModalShell({ title, subtitle, onClose, children, width = 480 }: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <div className="fixed inset-0 z-[150] bg-black/50 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-surface border border-rule rounded-xl shadow-e3 w-full anim-fade-up"
        style={{ maxWidth: width }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-rule">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
            {subtitle && <div className="text-[12px] text-muted mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded grid place-items-center text-faint hover:text-ink hover:bg-surface-soft" aria-label="Close">
            <Icon.X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ==============================================================
// Share Modal
// ==============================================================
export function ShareModal({ answerText, question, onClose }: {
  answerText: string;
  question: string;
  onClose: () => void;
}) {
  const { push } = useToasts();
  const shortId = Math.random().toString(36).slice(2, 10);
  const shareUrl = `https://app.meeru.ai/chat/${shortId}`;
  const [access, setAccess] = useState<'team' | 'org' | 'specific'>('team');
  const [recipients, setRecipients] = useState('');

  const copyLink = () => {
    try { navigator.clipboard?.writeText(shareUrl); } catch { /* ignore */ }
    push({ kind: 'ok', title: 'Link copied', sub: shareUrl });
  };

  const sendVia = (channel: 'slack' | 'email' | 'teams') => {
    const dest = recipients.trim() || (access === 'team' ? 'Finance team' : access === 'org' ? 'Contoso Org' : 'selected people');
    push({
      kind: 'ok',
      title: `Sent via ${channel === 'slack' ? 'Slack' : channel === 'email' ? 'Email' : 'Teams'}`,
      sub: `${dest} · ${shareUrl}`,
    });
    onClose();
  };

  return (
    <ModalShell title="Share this reply" subtitle={`“${truncate(question, 80)}”`} onClose={onClose}>
      <div className="p-5 space-y-4">
        {/* Preview */}
        <div className="bg-surface-alt border border-rule rounded-lg p-3">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-faint mb-1">Preview</div>
          <div className="text-[12px] text-ink leading-relaxed line-clamp-4">{answerText}</div>
        </div>

        {/* URL */}
        <div>
          <label className="text-[10px] font-semibold tracking-wider uppercase text-faint">Shareable link</label>
          <div className="flex gap-2 mt-1">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-rule bg-surface-alt text-[12px] text-ink num font-mono"
            />
            <button onClick={copyLink} className="px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-brand text-white hover:opacity-90 inline-flex items-center gap-1.5">
              <Icon.Check className="w-3.5 h-3.5" />
              Copy link
            </button>
          </div>
        </div>

        {/* Access */}
        <div>
          <label className="text-[10px] font-semibold tracking-wider uppercase text-faint">Who can view</label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {(['team', 'org', 'specific'] as const).map(o => (
              <button
                key={o}
                onClick={() => setAccess(o)}
                className={`px-3 py-2 rounded-lg border text-[12px] font-medium capitalize transition-all ${access === o ? 'border-brand bg-brand-tint text-brand' : 'border-rule text-muted hover:bg-surface-soft'}`}
              >
                {o === 'team' ? 'My team' : o === 'org' ? 'Entire org' : 'Specific people'}
              </button>
            ))}
          </div>
          {access === 'specific' && (
            <input
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
              placeholder="e.g. sue@contoso.com, finance-leads"
              className="w-full mt-2 px-2.5 py-1.5 rounded-lg border border-rule bg-surface text-[12px] text-ink outline-none focus:border-brand"
            />
          )}
        </div>

        {/* Send via */}
        <div>
          <label className="text-[10px] font-semibold tracking-wider uppercase text-faint">Send via</label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <button onClick={() => sendVia('slack')}  className="px-3 py-2 rounded-lg border border-rule bg-surface hover:border-brand hover:bg-brand-tint text-[12px] font-medium text-ink inline-flex items-center justify-center gap-1.5">
              <Icon.Slack className="w-3.5 h-3.5 text-[#4A154B]" /> Slack
            </button>
            <button onClick={() => sendVia('email')}  className="px-3 py-2 rounded-lg border border-rule bg-surface hover:border-brand hover:bg-brand-tint text-[12px] font-medium text-ink inline-flex items-center justify-center gap-1.5">
              <Icon.Email className="w-3.5 h-3.5 text-brand" /> Email
            </button>
            <button onClick={() => sendVia('teams')}  className="px-3 py-2 rounded-lg border border-rule bg-surface hover:border-brand hover:bg-brand-tint text-[12px] font-medium text-ink inline-flex items-center justify-center gap-1.5">
              <Icon.IM className="w-3.5 h-3.5 text-positive" /> Teams
            </button>
          </div>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-rule bg-surface-alt flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-rule text-[12px] font-medium text-muted hover:bg-surface-soft">Cancel</button>
      </div>
    </ModalShell>
  );
}

// ==============================================================
// Fact-check Modal
// ==============================================================
function deriveCitations(answerText: string) {
  // Pick a relevant set based on keywords in the answer
  const lower = answerText.toLowerCase();
  const sources: { title: string; source: string; detail: string; confidence: number; asOf: string }[] = [];
  if (lower.includes('churn') || lower.includes('nrr')) {
    sources.push({ title: 'Salesforce Renewals — Q1 FY26',   source: 'ERP',        detail: '3 closed-lost renewals, 2 at-risk flagged by retention model',          confidence: 96, asOf: '2026-04-17 08:12 UTC' });
    sources.push({ title: 'Renewal Risk Model v5',           source: 'ML Model',   detail: 'Trained on 4-quarter rolling window; scored 312 accounts',               confidence: 87, asOf: '2026-04-17 06:00 UTC' });
    sources.push({ title: 'NRR Quarterly Trend Report',      source: 'Report',     detail: 'System-of-record: FP&A canonical — quarterly snapshot',                  confidence: 99, asOf: '2026-04-14 21:00 UTC' });
  }
  if (lower.includes('california') || lower.includes('labor')) {
    sources.push({ title: 'Workforce Planning — CA Retail',  source: 'ERP',        detail: 'Time & Attendance export — 14-day OT hours by store',                    confidence: 98, asOf: '2026-04-17 04:30 UTC' });
    sources.push({ title: 'Labor Margin ML Model v3',        source: 'ML Model',   detail: 'Projects -2% to -4% margin erosion without staffing adjustment',        confidence: 94, asOf: '2026-04-17 06:00 UTC' });
    sources.push({ title: 'NY Q1 2024 Wage Adj. Postmortem', source: 'Prior Quarter', detail: 'Comparable intervention outcome used as benchmark',                confidence: 82, asOf: '2024-04-10' });
  }
  if (lower.includes('cloud') || lower.includes('cost')) {
    sources.push({ title: 'AWS Cost Explorer export',        source: 'Dashboard',  detail: 'Daily cloud spend by service and workload',                               confidence: 99, asOf: '2026-04-17 02:00 UTC' });
    sources.push({ title: 'FinOps Reservation Model',        source: 'ML Model',   detail: '60-day commitment scenario against workload stability',                  confidence: 88, asOf: '2026-04-16 14:00 UTC' });
  }
  if (lower.includes('recon') || lower.includes('variance') || lower.includes('ar aging')) {
    sources.push({ title: 'GL — Account 1200 AR Aging',      source: 'GL',         detail: 'Reconciled snapshot from Oracle GL as of close Day 4',                    confidence: 100, asOf: '2026-04-17 00:30 UTC' });
    sources.push({ title: 'Subledger — AR Open Invoices',    source: 'ERP',        detail: 'Open invoice totals from AR module',                                      confidence: 100, asOf: '2026-04-17 00:30 UTC' });
  }
  if (sources.length === 0) {
    sources.push({ title: 'Current Workbench Dataset',       source: 'Report',     detail: 'Canonical data set loaded for this workbench view',                       confidence: 94, asOf: '2026-04-17 08:00 UTC' });
    sources.push({ title: 'Persona Context',                 source: 'Dashboard',  detail: 'Persona-specific KPIs and scope used to rank commentary',                 confidence: 90, asOf: 'live' });
  }
  return sources;
}

const SOURCE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  GL:               Icon.File,
  Report:           Icon.File,
  ERP:              Icon.Open,
  Dashboard:        Icon.Chart,
  'Prior Quarter':  Icon.Calendar,
  'ML Model':       Icon.Sparkle,
};

export function FactCheckModal({ answerText, question, onClose }: {
  answerText: string;
  question: string;
  onClose: () => void;
}) {
  const citations = deriveCitations(answerText);
  const overall = Math.round(citations.reduce((s, c) => s + c.confidence, 0) / citations.length);

  return (
    <ModalShell title="Fact-check · source citations" subtitle={`For: “${truncate(question, 80)}”`} onClose={onClose} width={560}>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between p-3 bg-surface-alt border border-rule rounded-lg">
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-faint">Overall confidence</div>
            <div className={`text-[22px] font-semibold num mt-0.5 ${overall >= 90 ? 'text-positive' : overall >= 75 ? 'text-warning' : 'text-negative'}`}>{overall}%</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-faint">Sources</div>
            <div className="text-[22px] font-semibold text-ink num mt-0.5">{citations.length}</div>
          </div>
        </div>

        <div className="space-y-2">
          {citations.map((c, i) => {
            const Ic = SOURCE_ICON[c.source] ?? Icon.File;
            return (
              <div key={i} className="border border-rule rounded-lg p-3 hover:bg-surface-soft transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded grid place-items-center bg-brand-tint text-brand shrink-0">
                    <Ic className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[12px] font-semibold text-ink">{c.title}</div>
                      <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${c.confidence >= 90 ? 'bg-positive-weak text-positive' : c.confidence >= 75 ? 'bg-warning-weak text-warning' : 'bg-negative-weak text-negative'}`}>{c.confidence}%</span>
                    </div>
                    <div className="text-[11px] text-muted mt-0.5">{c.detail}</div>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-faint">
                      <span className="px-1.5 py-0.5 rounded bg-surface-soft border border-rule font-semibold">{c.source}</span>
                      <span>As of {c.asOf}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-muted italic border-t border-rule pt-3">
          Confidence is derived from source freshness, authority tier, and cross-source agreement. Click a source to open its lineage trace (prototype — not wired).
        </div>
      </div>
    </ModalShell>
  );
}

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
