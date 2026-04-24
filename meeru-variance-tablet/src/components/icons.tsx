import Svg, { Path, Circle, Polyline, Rect, Line, Polygon } from 'react-native-svg';

type P = { color?: string; size?: number };

const base = (s: number) => ({
  width: s, height: s, viewBox: '0 0 24 24', fill: 'none',
  strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
});

export const Icon = {
  Home:    ({ color = '#0F172A', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Svg>
  ),
  Chart:   ({ color = '#0F172A', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}><Path d="M3 3v18h18M8 17l4-8 4 5 4-9" /></Svg>
  ),
  Calendar: ({ color = '#0F172A', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Rect x="3" y="4" width="18" height="18" rx="2" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8"  y1="2" x2="8"  y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
  ),
  File:    ({ color = '#0F172A', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Polyline points="14 2 14 8 20 8" />
    </Svg>
  ),
  User:    ({ color = '#0F172A', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  ),
  Sparkle: ({ color = '#F16922', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}><Polygon points="12 2 15 9 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 9 12 2" /></Svg>
  ),
  Send:    ({ color = '#FFFFFF', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Line x1="22" y1="2" x2="11" y2="13" />
      <Polygon points="22 2 15 22 11 13 2 9 22 2" />
    </Svg>
  ),
  Mic:     ({ color = '#0F172A', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Line x1="12" y1="19" x2="12" y2="23" />
      <Line x1="8"  y1="23" x2="16" y2="23" />
    </Svg>
  ),
  Slack:   ({ color = '#4A154B', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Rect x="3"  y="11" width="8" height="2" rx="1" />
      <Rect x="13" y="11" width="8" height="2" rx="1" />
      <Rect x="11" y="3"  width="2" height="8" rx="1" />
      <Rect x="11" y="13" width="2" height="8" rx="1" />
    </Svg>
  ),
  Email:   ({ color = '#F16922', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <Polyline points="22,6 12,13 2,6" />
    </Svg>
  ),
  Pin:     ({ color = '#D97706', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Line x1="12" y1="17" x2="12" y2="22" />
      <Path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1V4H8v2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </Svg>
  ),
  Remind:  ({ color = '#8B5CF6', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Circle cx="12" cy="12" r="10" />
      <Polyline points="12 6 12 12 16 14" />
    </Svg>
  ),
  Share:   ({ color = '#475569', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Circle cx="18" cy="5" r="3" />
      <Circle cx="6" cy="12" r="3" />
      <Circle cx="18" cy="19" r="3" />
      <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </Svg>
  ),
  Check:   ({ color = '#16A34A', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}><Polyline points="20 6 9 17 4 12" /></Svg>
  ),
  Alert:   ({ color = '#DC2626', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <Line x1="12" y1="9" x2="12" y2="13" />
      <Line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  ),
  X:       ({ color = '#475569', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Line x1="18" y1="6" x2="6"  y2="18" />
      <Line x1="6"  y1="6" x2="18" y2="18" />
    </Svg>
  ),
  Flag:    ({ color = '#D97706', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Svg>
  ),
  LogOut:  ({ color = '#DC2626', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Polyline points="16 17 21 12 16 7" />
      <Line x1="21" y1="12" x2="9" y2="12" />
    </Svg>
  ),
  // ----- Header controls for ChatSheet -----
  // `fill` is optional so we can render an outline (default) or a solid star
  // by passing `fill="currentColor"`-equivalent hex.
  Star:    ({ color = '#64748B', size = 20, fill = 'none' }: P & { fill?: string }) => (
    <Svg {...base(size)} stroke={color}>
      <Polygon
        fill={fill}
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      />
    </Svg>
  ),
  Pencil:  ({ color = '#475569', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Path d="M12 20h9" />
      <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Svg>
  ),
  Maximize: ({ color = '#475569', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Polyline points="15 3 21 3 21 9" />
      <Polyline points="9 21 3 21 3 15" />
      <Line x1="21" y1="3" x2="14" y2="10" />
      <Line x1="3" y1="21" x2="10" y2="14" />
    </Svg>
  ),
  Minimize: ({ color = '#475569', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Polyline points="4 14 10 14 10 20" />
      <Polyline points="20 10 14 10 14 4" />
      <Line x1="14" y1="10" x2="21" y2="3" />
      <Line x1="3" y1="21" x2="10" y2="14" />
    </Svg>
  ),
  ChevDown: ({ color = '#475569', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}><Polyline points="6 9 12 15 18 9" /></Svg>
  ),
  Sun:     ({ color = '#0F172A', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Circle cx="12" cy="12" r="4" />
      <Line x1="12" y1="2"  x2="12" y2="4" />
      <Line x1="12" y1="20" x2="12" y2="22" />
      <Line x1="4.93" y1="4.93"   x2="6.34" y2="6.34" />
      <Line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <Line x1="2"  y1="12" x2="4"  y2="12" />
      <Line x1="20" y1="12" x2="22" y2="12" />
      <Line x1="4.93" y1="19.07"  x2="6.34" y2="17.66" />
      <Line x1="17.66" y1="6.34"  x2="19.07" y2="4.93" />
    </Svg>
  ),
  Moon:    ({ color = '#0F172A', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  ),
  Settings: ({ color = '#0F172A', size = 20 }: P) => (
    <Svg {...base(size)} stroke={color}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  ),
};

export function iconForActionKind(kind: string) {
  const map: Record<string, (props: P) => JSX.Element> = {
    slack: Icon.Slack, email: Icon.Email, im: Icon.Slack, pin: Icon.Pin,
    remind: Icon.Remind, share: Icon.Share, approve: Icon.Check,
    whatif: Icon.Chart, open: Icon.File, investigate: Icon.Alert,
  };
  return map[kind] ?? Icon.Send;
}
