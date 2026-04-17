import { useToasts } from '../store';
import { Icon } from '../icons';

export function ToastHost() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="fixed top-14 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const borderCls = t.kind === 'warn' ? 'border-l-warning' : t.kind === 'info' ? 'border-l-brand' : 'border-l-positive';
        const iconColor = t.kind === 'warn' ? 'text-warning' : t.kind === 'info' ? 'text-brand' : 'text-positive';
        return (
          <div
            key={t.id}
            className={`pointer-events-auto bg-surface border border-rule rounded-lg shadow-e2 px-3.5 py-2.5 text-[12px] min-w-[260px] flex items-start gap-2 border-l-[3px] ${borderCls} anim-slide-in`}
          >
            <span className={iconColor}>
              {t.kind === 'ok'   && <Icon.Check   className="w-4 h-4" />}
              {t.kind === 'warn' && <Icon.Alert   className="w-4 h-4" />}
              {t.kind === 'info' && <Icon.Info    className="w-4 h-4" />}
            </span>
            <div className="flex-1">
              <div className="font-semibold text-ink">{t.title}</div>
              {t.sub && <div className="text-[11px] text-muted mt-0.5 leading-relaxed">{t.sub}</div>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-faint hover:text-ink">
              <Icon.X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
