import { useEffect } from 'react';
import { useMission, useToasts } from '../store';
import { MISSIONS, PERSONAS } from '../data';
import { useAuth } from '../store';
import { useNavigate } from 'react-router-dom';

export function MarinGuide() {
  const { mission, step, currentBeat, advance, skip } = useMission();

  // Apply .glow class to matching selectors whenever beat changes
  useEffect(() => {
    const clean = () => document.querySelectorAll('.glow').forEach(n => n.classList.remove('glow'));
    clean();
    if (!mission || !currentBeat?.glow) return;
    const apply = () => {
      try {
        document.querySelectorAll(currentBeat.glow!).forEach(n => n.classList.add('glow'));
      } catch { /* bad selector — ignore */ }
    };
    // Delay to let page render
    const t1 = setTimeout(apply, 200);
    // Re-apply if DOM updates (simple retry at 600/1200ms)
    const t2 = setTimeout(apply, 700);
    return () => { clearTimeout(t1); clearTimeout(t2); clean(); };
  }, [mission, currentBeat, step]);

  if (!mission || !currentBeat) return null;
  const total = mission.beats.length;

  return (
    <div className="fixed bottom-[104px] right-5 z-[90] w-[300px] bg-surface border border-rule rounded-xl shadow-e3 p-3.5 anim-slide-in">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full text-white grid place-items-center text-[11px] font-semibold" style={{ background: 'linear-gradient(135deg,#475569,#0F172A)' }}>MA</div>
        <div>
          <div className="text-[12px] font-semibold text-ink">Marin</div>
          <div className="text-[10px] text-muted">Your analyst · here to help</div>
        </div>
      </div>
      <div
        className="text-[12px] leading-relaxed text-ink mb-2.5"
        dangerouslySetInnerHTML={{ __html: currentBeat.body }}
      />
      <div className="flex justify-between items-center">
        <button onClick={skip} className="text-[10px] text-faint hover:text-muted">Skip mission</button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-faint">Step {step + 1} / {total}</span>
          <button onClick={advance} className="px-3 py-1 bg-ink text-surface text-[11px] font-medium rounded-md hover:opacity-90">
            {currentBeat.final ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MissionEndCard() {
  const { ended, dismissEnded, start } = useMission();
  const { user } = useAuth();
  const { push } = useToasts();
  const nav = useNavigate();

  if (!ended) return null;

  const onTryAnother = () => {
    // Launch a different-persona mission
    const nextPersona = user?.key === 'CFO' ? 'CONTROLLER' : user?.key === 'CONTROLLER' ? 'PREPARER' : 'CFO';
    const m = MISSIONS.find(x => x.persona === nextPersona);
    if (!m) return;
    localStorage.setItem('meeru.user', nextPersona);
    dismissEnded();
    push({ kind: 'info', title: `Switched to ${PERSONAS[nextPersona].role}`, sub: 'Notice how the action strip re-orders for the new role.' });
    setTimeout(() => {
      if (m.startPath) nav(m.startPath);
      start(m);
      // Reload so auth context picks up the new persona from localStorage
      window.location.reload();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center z-[200]">
      <div className="bg-surface rounded-2xl p-8 max-w-[480px] w-[90vw] text-center shadow-e3 anim-fade-up">
        <div className="w-14 h-14 mx-auto mb-3.5 rounded-full bg-positive-weak text-positive grid place-items-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="text-[18px] font-semibold text-ink mb-2">Mission complete</h2>
        <p className="text-[13px] text-muted leading-relaxed mb-5">
          Three minutes, zero app-switching. The close-loop is the product.
        </p>
        <div className="flex gap-2 justify-center">
          <button onClick={onTryAnother} className="px-4 py-2 bg-brand text-white text-[12px] font-medium rounded-md hover:opacity-90">Try next mission</button>
          <button onClick={dismissEnded} className="px-4 py-2 border border-rule text-muted text-[12px] font-medium rounded-md hover:bg-surface-soft">Keep exploring</button>
        </div>
      </div>
    </div>
  );
}
