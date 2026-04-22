import type { SVGProps } from 'react';

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

type P = SVGProps<SVGSVGElement>;

export const Icon = {
  Home: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>),
  Chart: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 3v18h18M8 17l4-8 4 5 4-9"/></svg>),
  Calendar: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
  Bolt: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>),
  File: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>),
  Settings: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  Bars: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>),
  Trend: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>),
  Sheet: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>),
  Sparkle: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polygon points="12 2 15 9 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 9 12 2"/></svg>),
  Send: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  Plus: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  Slack: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><rect x="3" y="11" width="8" height="2" rx="1"/><rect x="13" y="11" width="8" height="2" rx="1"/><rect x="11" y="3" width="2" height="8" rx="1"/><rect x="11" y="13" width="2" height="8" rx="1"/></svg>),
  Email: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>),
  IM: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  Pin: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1V4H8v2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>),
  Remind: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  Share: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>),
  Approve: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polyline points="20 6 9 17 4 12"/></svg>),
  WhatIf: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>),
  Open: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>),
  Search: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  Moon: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>),
  Sun: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>),
  Refresh: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>),
  Check: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polyline points="20 6 9 17 4 12"/></svg>),
  Alert: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>),
  DownRight: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>),
  Info: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>),
  X: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Flag: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
  LogOut: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
  Menu: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>),
  Bell: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>),
  ChevLeft: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polyline points="15 18 9 12 15 6"/></svg>),
  ChevRight: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polyline points="9 18 15 12 9 6"/></svg>),
  ChevDown: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polyline points="6 9 12 15 18 9"/></svg>),
  ChevUp: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polyline points="18 15 12 9 6 15"/></svg>),
  Pencil: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>),
  Star: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  Bulb: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.7.5 1 1.3 1 2.1V18h6v-1.2c0-.8.3-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>),
  History: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 3v5h5"/><path d="M3.05 13a9 9 0 1 0 2.13-6.36L3 8"/><polyline points="12 7 12 12 15.5 13.5"/></svg>),
  Target: (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>),
};

export function getActionIcon(kind: string) {
  const map: Record<string, React.FC<P>> = {
    slack: Icon.Slack, email: Icon.Email, im: Icon.IM, pin: Icon.Pin,
    remind: Icon.Remind, share: Icon.Share, approve: Icon.Approve,
    whatif: Icon.WhatIf, open: Icon.Open, investigate: Icon.Search,
  };
  return map[kind] || Icon.Send;
}
