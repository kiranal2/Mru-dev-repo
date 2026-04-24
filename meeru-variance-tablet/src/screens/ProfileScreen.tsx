import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../store';
import { useTheme } from '../theme';
import { PERSONAS } from '../data';
import type { Role } from '../types';
import { Icon } from '../components/icons';
import { Logo } from '../components/Logo';

const TONE_CLASS = {
  pos:  'text-positive',
  neg:  'text-negative',
  warn: 'text-warning',
} as const;

export default function ProfileScreen() {
  const { user, logout, login } = useAuth();
  const { theme, toggle } = useTheme();
  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Top row — logo + theme toggle */}
        <View className="mb-3 flex-row items-center justify-between">
          <Logo height={24} />
          <Pressable
            onPress={toggle}
            className="w-9 h-9 rounded-md bg-surface border border-rule items-center justify-center"
          >
            {theme === 'light' ? <Icon.Moon size={16} color="#475569" /> : <Icon.Sun size={16} color="#CBD5E1" />}
          </Pressable>
        </View>

        {/* Header card */}
        <View className="rounded-2xl bg-surface border border-rule p-5 mb-3">
          <View className="flex-row items-center gap-3 mb-3">
            <LinearGradient
              colors={['#FED5BC', '#F16922']}
              style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="text-white text-lg font-semibold">{user.init}</Text>
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-base font-semibold text-ink">{user.name}</Text>
              <Text className="text-xs text-muted">{user.role}</Text>
              <Text className="text-[13px] text-faint mt-0.5">{user.email}</Text>
            </View>
          </View>

          {user.quickStat && (
            <View className="flex-row justify-between items-center px-3 py-2 rounded-lg bg-surface-alt border border-rule">
              <Text className="text-[14px] uppercase tracking-wider font-semibold text-muted">
                {user.quickStat.label}
              </Text>
              <Text className={`text-[14px] font-semibold ${user.quickStat.tone ? TONE_CLASS[user.quickStat.tone] : 'text-ink'}`}>
                {user.quickStat.value}
              </Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View className="rounded-2xl bg-surface border border-rule p-4 mb-3">
          <Text className="text-[14px] tracking-wider uppercase text-faint font-semibold mb-2">Details</Text>
          <DetailRow k="Department" v={user.department ?? '—'} />
          <DetailRow k="Reports to" v={user.reportsTo ?? '—'} />
          <DetailRow k="Team size"  v={user.teamSize?.toString() ?? '—'} />
          <DetailRow k="Location"   v={user.location ?? '—'} />
          <DetailRow k="Timezone"   v={user.timezone ?? '—'} />
        </View>

        {/* Focus areas */}
        {user.focusAreas && (
          <View className="rounded-2xl bg-surface border border-rule p-4 mb-3">
            <Text className="text-[14px] tracking-wider uppercase text-faint font-semibold mb-2">Focus areas</Text>
            <View className="flex-row flex-wrap gap-1.5">
              {user.focusAreas.map((f) => (
                <View
                  key={f}
                  className="px-2 py-1 rounded-full bg-brand-tint border border-brand-weak"
                >
                  <Text className="text-[13px] font-medium text-brand">{f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Today */}
        {user.todayAgenda && user.todayAgenda.length > 0 && (
          <View className="rounded-2xl bg-surface border border-rule p-4 mb-3">
            <Text className="text-[14px] tracking-wider uppercase text-faint font-semibold mb-2">Today</Text>
            {user.todayAgenda.map((a, i) => (
              <View key={i} className="flex-row items-start gap-2 py-1">
                <View className="w-1.5 h-1.5 rounded-full bg-brand mt-2" />
                <Text className="text-sm text-ink flex-1">{a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Switch persona */}
        <View className="rounded-2xl bg-surface border border-rule mb-3">
          <Text className="text-[14px] tracking-wider uppercase text-faint font-semibold px-4 pt-3 pb-2">
            Switch persona
          </Text>
          {(Object.keys(PERSONAS) as Role[]).map((r, i) => {
            const p = PERSONAS[r];
            const active = r === user.key;
            return (
              <Pressable
                key={r}
                onPress={() => login(r)}
                className={`flex-row items-center gap-3 px-4 py-3 active:bg-surface-soft ${i < 2 ? 'border-b border-rule' : ''}`}
              >
                <LinearGradient
                  colors={['#FED5BC', '#F16922']}
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-white text-xs font-semibold">{p.init}</Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-ink">{p.name}</Text>
                  <Text className="text-[13px] text-muted">{p.role}</Text>
                </View>
                {active && <Text className="text-[13px] text-brand font-semibold">Active</Text>}
              </Pressable>
            );
          })}
        </View>

        {/* Logout */}
        <Pressable
          onPress={logout}
          className="flex-row items-center justify-center gap-2 py-3 rounded-2xl bg-negative-weak active:opacity-70"
        >
          <Icon.LogOut color="#DC2626" size={16} />
          <Text className="text-sm font-semibold text-negative">Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <View className="flex-row py-1">
      <Text className="text-[14px] text-muted" style={{ width: 100 }}>{k}</Text>
      <Text className="text-[14px] text-ink flex-1">{v}</Text>
    </View>
  );
}
