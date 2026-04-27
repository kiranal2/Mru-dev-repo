// Mock data for the Variance Workbench UI kit — lifted/adapted from the real app.
window.KITDATA = {
  persona: { init: 'MC', name: 'Mai Chen', role: 'CFO', email: 'mai@meeruai.com' },
  scope: 'Tuesday · Week 10 · Global · Q1 FY2026',
  regions: [
    { key: 'global', label: 'Global', delta: '-$4.2M', tone: 'neg' },
    { key: 'na', label: 'North America', delta: '-$1.1M', tone: 'warn' },
    { key: 'latam', label: 'LATAM', delta: '-$2.4M', tone: 'neg' },
    { key: 'emea', label: 'EMEA', delta: '+$0.3M', tone: 'pos' },
    { key: 'apac', label: 'APAC', delta: '-$0.9M', tone: 'warn' },
  ],
  segments: [
    { key: 'grocery', label: 'Grocery', delta: '-$2.1M', tone: 'neg' },
    { key: 'pharmacy', label: 'Pharmacy', delta: 'flat', tone: 'faint' },
    { key: 'conv', label: 'Convenience', delta: '-$0.9M', tone: 'warn' },
    { key: 'specialty', label: 'Specialty', delta: '+$0.4M', tone: 'pos' },
  ],
  kpis: [
    { lbl: 'Total Variance', val: '-$4.2M', delta: '-8.2% vs Plan', tone: 'neg', watch: true },
    { lbl: 'Segments Flagged', val: '3 / 4', delta: '2 at-risk', tone: 'warn' },
    { lbl: 'Top Driver', val: 'Grocery', delta: '-$2.1M', tone: 'neg' },
  ],
  bars: [
    { w: 'W1', a: -38, p: -28, tone: 'neg' },
    { w: 'W2', a: -30, p: -22, tone: 'warn' },
    { w: 'W3', a: 18, p: 14, tone: 'pos' },
    { w: 'W4', a: -42, p: -30, tone: 'neg' },
    { w: 'W5', a: -32, p: -25, tone: 'neg', forecast: true },
    { w: 'W6', a: -24, p: -20, tone: 'warn', forecast: true },
  ],
  commentary: [
    { rank: 1, title: 'Grocery LATAM', delta: '-$2.1M', text: 'Category demand softened after promo pull-forward. Margin pressure persists through W6; expect rebound as inventory normalizes.' },
    { rank: 2, title: 'Convenience APAC', delta: '-$0.9M', text: 'Channel mix shift — fewer basket add-ons vs plan. Recommend re-pricing top-20 SKUs by Thursday.' },
    { rank: 3, title: 'Labor — CA Retail', delta: '-$0.6M', text: 'Overtime drift of +18% WoW. Flagged for shift-mix review; Marin has drafted the proposal.' },
  ],
  nba: [
    { channel: 'Board · Ops Committee', accent: '#FE8953', icon: 'mail', body: 'Flag -$4.2M variance; propose labor plan review before Thu close.' },
    { channel: 'Workspace · Pin', accent: '#D97706', icon: 'pin', body: 'Pin CA Retail labor analysis to my workspace.' },
    { channel: '#fp-a & ops', accent: '#4A154B', icon: 'slack', body: 'Share variance summary to Slack channel with threaded notes.' },
    { channel: 'Reminder', accent: '#475569', icon: 'clock', body: 'Remind me Thursday 9 AM to review close packet.' },
  ],
  chat: [
    { who: 'ai', time: 'just now', body: 'Enterprise churn spiked — three logos did not renew: Voltair, Meridian, Cinder. Combined ARR impact -$2.1M. Confidence 94%.' },
    { who: 'user', time: '2m ago', body: 'Why is Grocery LATAM off plan?' },
  ],
};
