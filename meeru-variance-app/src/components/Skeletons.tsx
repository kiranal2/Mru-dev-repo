import { useLoading } from '../store';

/**
 * Base shimmer block. Uses the existing `.shimmer-bg` keyframe plus a
 * neutral pulse so it reads as a placeholder against both light and dark
 * backgrounds.
 */
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`relative overflow-hidden rounded-md bg-surface-soft ${className}`} style={style}>
    <div className="absolute inset-0 shimmer-bg" />
  </div>;
}

/** Shimmer overlay for a section with existing content (during refresh) */
export function RefreshingOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div className="absolute inset-0 shimmer-bg opacity-60" />
    </div>
  );
}

export function KpiRowSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 mb-3.5">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-surface border border-rule rounded-xl p-3.5 shadow-e1">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-7 w-24 mt-2" />
          <Skeleton className="h-2.5 w-32 mt-2" />
        </div>
      ))}
    </div>
  );
}

export function CommentarySkeleton() {
  return (
    <div className="bg-surface border border-rule rounded-xl p-3.5 shadow-e1 mb-3">
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-2.5 w-40" />
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className={`flex gap-2.5 py-2.5 ${i > 0 ? 'border-t border-rule' : ''}`}>
          <div className="w-6 h-6 rounded-full bg-surface-soft shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-5/6" />
            <div className="flex gap-1 pt-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-surface border border-rule rounded-xl p-3.5 shadow-e1 mb-3">
      <div className="flex justify-between items-baseline mb-3">
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="flex items-end justify-between gap-2 h-[180px] px-4">
        {[60, 50, 45, 80, 35, 70].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <Skeleton className="w-full rounded-sm" style={{ height: `${h}%` }} />
            <Skeleton className="h-2 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-surface border border-rule rounded-xl p-0 overflow-hidden shadow-e1">
      {/* Header */}
      <div className="bg-brand px-4 py-2.5 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 bg-white/30" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={`px-4 py-2.5 flex gap-4 border-t border-rule ${r % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'}`}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListCardSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-surface border border-rule rounded-xl p-4 shadow-e1">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-soft shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-5/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Global top-of-page loading bar. Slides in when any async fetch is in
 * flight, fades out when they all finish. Always mounted; controlled
 * by `useLoading()`.
 */
export function LoadingBar() {
  const { isLoading } = useLoading();
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[200] h-0.5 pointer-events-none transition-opacity ${isLoading ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className="h-full bg-gradient-to-r from-transparent via-brand to-transparent"
        style={{
          width: '33%',
          animation: isLoading ? 'loading-sweep 1.1s linear infinite' : 'none',
        }}
      />
    </div>
  );
}
