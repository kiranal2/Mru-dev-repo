import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store';
import { PERSONAS } from '../data';
import type { Role } from '../types';
import { Icon } from '../icons';
import { Logo } from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const pick = (role: Role) => {
    login(role);
    nav('/workspace');
  };

  const cards: { role: Role; tagline: string; accent: string }[] = [
    { role: 'CFO',        tagline: 'Executive rollup. Approvals. Board prep.', accent: 'from-blue-500 to-indigo-700' },
    { role: 'CONTROLLER', tagline: 'Close orchestration. Reconciliations. Review queue.', accent: 'from-emerald-500 to-teal-700' },
    { role: 'STAFF',      tagline: 'Worklist. Investigations. Evidence uploads.', accent: 'from-amber-500 to-orange-700' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt p-6">
      <div className="max-w-[900px] w-full">
        <div className="flex items-center gap-4 mb-8">
          <Logo className="h-8 w-auto object-contain select-none" />
          <div className="h-8 w-px bg-rule" />
          <div>
            <div className="text-[14px] font-semibold text-ink">Variance Workbench</div>
            <div className="text-[12px] text-muted">Pick a persona to explore</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map(c => {
            const P = PERSONAS[c.role];
            return (
              <button
                key={c.role}
                onClick={() => pick(c.role)}
                className="group bg-surface border border-rule rounded-2xl p-5 text-left hover:shadow-e3 hover:-translate-y-1 transition-all"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${c.accent} text-white grid place-items-center text-[18px] font-semibold mb-3.5`}>{P.init}</div>
                <div className="text-[15px] font-semibold text-ink mb-0.5">{P.name}</div>
                <div className="text-[12px] text-muted mb-3">{P.role}</div>
                <div className="text-[12px] text-ink leading-relaxed mb-4">{c.tagline}</div>
                <div className="flex items-center gap-1 text-[12px] font-medium text-brand group-hover:gap-2 transition-all">
                  <span>Enter workspace</span>
                  <Icon.Send className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center text-[11px] text-faint">
          Prototype · No credentials needed · Persona selection stored locally and can be switched from the header
        </div>
      </div>
    </div>
  );
}
