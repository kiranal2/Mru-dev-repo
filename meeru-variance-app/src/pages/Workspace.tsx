import { Link, useNavigate } from 'react-router-dom';
import { LIVE_PINS, WATCHLIST, ACTIVITY, MISSIONS } from '../data';
import { useAuth, useMission, useToasts, useChat } from '../store';
import { StatusChip, Card, Eyebrow } from '../components/ui';
import { Icon } from '../icons';

function Sparkline({ points }: { points: number[] }) {
  if (!points.length) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const W = 80, H = 22;
  const dx = W / (points.length - 1 || 1);
  const norm = (v: number) => H - ((v - min) / (max - min || 1)) * H;
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * dx} ${norm(v)}`).join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  const trendColor = last > first ? 'var(--positive)' : last < first ? 'var(--negative)' : 'var(--text-faint)';
  return (
    <svg width={W} height={H}>
      <path d={d} fill="none" stroke={trendColor} strokeWidth="1.5" />
    </svg>
  );
}

export default function Workspace() {
  const { user } = useAuth();
  const { start } = useMission();
  const { push } = useToasts();
  const { pinned, removePinned } = useChat();
  const nav = useNavigate();

  const greetingHour = new Date().getHours();
  const greet = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  const startMyMission = () => {
    const m = MISSIONS.find(x => x.persona === user?.key) ?? MISSIONS[0];
    if (m.startPath) nav(m.startPath);
    start(m);
  };

  return (
    <div className="flex-1 overflow-auto bg-surface-alt p-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Greeting */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[11px] text-muted tracking-wider uppercase">My Workspace</div>
            <h1 className="text-[24px] font-semibold text-ink tracking-tight mt-0.5">{greet}, {user?.name.split(' ')[0]}.</h1>
            <p className="text-[13px] text-muted mt-1">Tuesday · Week 10 · Global — 3 items need your attention before Thursday.</p>
          </div>
          <button onClick={startMyMission} className="px-4 py-2 rounded-lg text-white text-[12px] font-semibold inline-flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
            <Icon.Flag className="w-3.5 h-3.5" />
            <span>Start today's mission</span>
          </button>
        </div>

        {/* Live pins */}
        <Eyebrow>Live Pins</Eyebrow>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 mt-1">
          {LIVE_PINS.map((p, i) => (
            <Card key={i} className="p-4 hover:-translate-y-0.5 hover:shadow-e2 transition-all cursor-pointer">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-muted">{p.label}</div>
              <div className="flex items-end justify-between mt-1.5">
                <div>
                  <div className="text-[22px] font-semibold num text-ink tracking-tight">{p.value}</div>
                  <div className={`text-[11px] mt-0.5 ${p.tone === 'pos' ? 'text-positive' : p.tone === 'neg' ? 'text-negative' : 'text-warning'}`}>{p.delta}</div>
                </div>
                <Sparkline points={p.sparkline} />
              </div>
            </Card>
          ))}
        </div>

        {/* Two columns: Watchlist + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 lg:col-span-2">
            <div className="flex justify-between items-center mb-3">
              <div className="text-[13px] font-semibold text-ink">Watchlist</div>
              <StatusChip kind="warn">5 tracked</StatusChip>
            </div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] tracking-wider uppercase text-muted">
                  <th className="text-left pb-2 font-semibold">Entity</th>
                  <th className="text-left pb-2 font-semibold">Kind</th>
                  <th className="text-left pb-2 font-semibold">Metric</th>
                  <th className="text-right pb-2 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {WATCHLIST.map((w, i) => (
                  <tr key={i} className={`border-t border-rule ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'}`}>
                    <td className="py-2 font-semibold text-ink">{w.entity}</td>
                    <td className="py-2 text-muted">{w.kind}</td>
                    <td className="py-2 text-muted">{w.metric}</td>
                    <td className={`py-2 text-right num font-medium ${w.tone === 'neg' ? 'text-negative' : 'text-warning'}`}>{w.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="p-4">
            <div className="text-[13px] font-semibold text-ink mb-3">Recent Activity</div>
            <div className="space-y-2.5">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-surface-soft grid place-items-center shrink-0 text-[10px] font-semibold text-ink">
                    {a.who === 'Meeru AI' ? <Icon.Sparkle className="w-3.5 h-3.5 text-brand" /> : a.who.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-ink">{a.who}</div>
                    <div className="text-[11px] text-muted leading-snug">{a.what}</div>
                    <div className="text-[10px] text-faint mt-0.5">{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Pinned AI replies */}
        {pinned.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <Eyebrow>Pinned from AI</Eyebrow>
              <Link to="/notebook" className="text-[11px] text-brand hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pinned.slice(0, 4).map(p => (
                <Card key={p.id} className="p-3.5 hover:shadow-e2 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="text-[11px] font-semibold text-ink line-clamp-1 flex-1">{p.question}</div>
                    <button
                      onClick={() => removePinned(p.id)}
                      title="Remove"
                      className="p-0.5 rounded text-faint hover:text-negative hover:bg-negative-weak shrink-0"
                    >
                      <Icon.X className="w-3 h-3" />
                    </button>
                  </div>
                  <div
                    className="text-[11px] text-muted leading-relaxed line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: p.answerHtml }}
                  />
                  <div className="flex items-center gap-2 text-[10px] text-faint mt-2">
                    <Icon.Pin className="w-2.5 h-2.5 text-warning" />
                    <span>{p.scope}</span>
                    <span>·</span>
                    <span>{p.persona}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick-access */}
        <Eyebrow>Jump to workbench</Eyebrow>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
          <Link to="/variance/performance" className="bg-surface border border-rule rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-e2 transition-all">
            <Icon.Chart className="w-6 h-6 text-brand mb-2" />
            <div className="text-[13px] font-semibold text-ink">Performance Intelligence</div>
            <div className="text-[11px] text-muted mt-0.5">ARR · Churn · Retention</div>
          </Link>
          <Link to="/variance/margin" className="bg-surface border border-rule rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-e2 transition-all">
            <Icon.Trend className="w-6 h-6 text-brand mb-2" />
            <div className="text-[13px] font-semibold text-ink">Margin Intelligence</div>
            <div className="text-[11px] text-muted mt-0.5">GM · OM · By Product</div>
          </Link>
          <Link to="/variance/flux" className="bg-surface border border-rule rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-e2 transition-all">
            <Icon.Sheet className="w-6 h-6 text-brand mb-2" />
            <div className="text-[13px] font-semibold text-ink">Flux Intelligence</div>
            <div className="text-[11px] text-muted mt-0.5">IS · BS · Cash Flow</div>
          </Link>
          <Link to="/close" className="bg-surface border border-rule rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-e2 transition-all">
            <Icon.Calendar className="w-6 h-6 text-brand mb-2" />
            <div className="text-[13px] font-semibold text-ink">Close Workbench</div>
            <div className="text-[11px] text-muted mt-0.5">Day 4 / 5 · 2 blockers</div>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => push({ kind: 'info', title: 'Dynamic Sheets coming soon', sub: 'This is where the spreadsheet-style editor would live.' })} className="text-[11px] text-faint hover:text-brand">
            Try Dynamic Sheets →
          </button>
        </div>
      </div>
    </div>
  );
}
