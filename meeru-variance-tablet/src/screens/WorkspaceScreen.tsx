import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline } from 'react-native-svg';
import { useAuth } from '../store';
import { LIVE_PINS, WATCHLIST } from '../data';
import type { LivePin } from '../types';
import { Icon } from '../components/icons';
import { Logo } from '../components/Logo';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

function Sparkline({ points, tone }: { points: number[]; tone: LivePin['tone'] }) {
  if (!points.length) return null;
  const W = 80, H = 24;
  const min = Math.min(...points), max = Math.max(...points);
  const dx = W / (points.length - 1 || 1);
  const norm = (v: number) => H - ((v - min) / (max - min || 1)) * H;
  const pts = points.map((v, i) => `${i * dx},${norm(v)}`).join(' ');
  const stroke = tone === 'pos' ? '#16A34A' : tone === 'neg' ? '#DC2626' : '#D97706';
  return (
    <Svg width={W} height={H}>
      <Polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.8} />
    </Svg>
  );
}

export default function WorkspaceScreen() {
  const { user } = useAuth();
  const nav = useNavigation<NavigationProp<any>>();

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {/* Header: logo + greeting */}
        <View className="mt-4 mb-5 flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-[13px] tracking-wider uppercase text-muted">My Workspace</Text>
            <Text className="text-2xl font-semibold text-ink tracking-tight mt-1">
              {greet}, {user.name.split(' ')[0]}.
            </Text>
            <Text className="text-sm text-muted mt-1">
              Tuesday · Week 10 · Global — 3 items need your attention before Thursday.
            </Text>
          </View>
          <Logo height={24} style={{ marginTop: 4 }} />
        </View>

        {/* Live pins (2 × 2 grid) */}
        <Text className="text-[14px] font-semibold tracking-wider uppercase text-muted mb-2">Live Pins</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {LIVE_PINS.map((p, i) => {
            const deltaColor = p.tone === 'pos' ? '#16A34A' : p.tone === 'neg' ? '#DC2626' : '#D97706';
            return (
              <View
                key={i}
                className="bg-surface rounded-2xl p-4"
                style={{ width: '48%', borderWidth: 1, borderColor: '#E2E8F0' }}
              >
                <Text className="text-[14px] tracking-wider uppercase text-muted font-semibold">{p.label}</Text>
                <View className="flex-row items-end justify-between mt-2">
                  <View>
                    <Text className="text-2xl font-semibold text-ink tracking-tight">{p.value}</Text>
                    <Text style={{ fontSize: 11, color: deltaColor, marginTop: 2 }}>{p.delta}</Text>
                  </View>
                  <Sparkline points={p.sparkline} tone={p.tone} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Watchlist */}
        <Text className="text-[14px] font-semibold tracking-wider uppercase text-muted mb-2">Watchlist</Text>
        <View className="bg-surface rounded-2xl p-4 mb-6" style={{ borderWidth: 1, borderColor: '#E2E8F0' }}>
          {WATCHLIST.map((w, i) => (
            <View
              key={i}
              className={`flex-row items-center py-2.5 ${i < WATCHLIST.length - 1 ? 'border-b border-rule' : ''}`}
            >
              <View className="flex-1">
                <Text className="text-sm font-semibold text-ink">{w.entity}</Text>
                <Text className="text-xs text-muted mt-0.5">{w.kind} · {w.metric}</Text>
              </View>
              <Text
                className="text-sm font-semibold"
                style={{ color: w.tone === 'neg' ? '#DC2626' : '#D97706' }}
              >
                {w.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick access tiles */}
        <Text className="text-[14px] font-semibold tracking-wider uppercase text-muted mb-2">Jump to workbench</Text>
        <View className="flex-row flex-wrap gap-3">
          <Pressable
            onPress={() => nav.navigate('Variance' as never)}
            className="bg-surface rounded-2xl p-4 active:opacity-70"
            style={{ width: '48%', borderWidth: 1, borderColor: '#E2E8F0' }}
          >
            <Icon.Chart color="#FE9519" size={22} />
            <Text className="text-sm font-semibold text-ink mt-2">Variance</Text>
            <Text className="text-[13px] text-muted">Performance · Margin · Flux</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate('Close' as never)}
            className="bg-surface rounded-2xl p-4 active:opacity-70"
            style={{ width: '48%', borderWidth: 1, borderColor: '#E2E8F0' }}
          >
            <Icon.Calendar color="#FE9519" size={22} />
            <Text className="text-sm font-semibold text-ink mt-2">Close</Text>
            <Text className="text-[13px] text-muted">Day 4 / 5 · 2 blockers</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
