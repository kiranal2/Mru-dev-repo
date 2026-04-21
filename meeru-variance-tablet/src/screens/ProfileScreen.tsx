import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../store';
import { PERSONAS } from '../data';
import type { Role } from '../types';
import { Icon } from '../components/icons';

export default function ProfileScreen() {
  const { user, logout, login } = useAuth();
  if (!user) return null;

  const statColor =
    user.quickStat?.tone === 'neg' ? '#DC2626' :
    user.quickStat?.tone === 'warn' ? '#D97706' :
    user.quickStat?.tone === 'pos' ? '#16A34A' : '#0F172A';

  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Logo */}
        <View className="mb-3">
          <Image
            source={require('../../assets/meeru-logo.png')}
            style={{ width: 96, height: 24, resizeMode: 'contain' }}
          />
        </View>

        {/* Header card */}
        <View
          className="rounded-2xl p-5 mb-3"
          style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }}
        >
          <View className="flex-row items-center gap-3 mb-3">
            <LinearGradient
              colors={['#6366F1', '#1E40AF']}
              style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="text-white text-lg font-semibold">{user.init}</Text>
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-base font-semibold text-ink">{user.name}</Text>
              <Text className="text-xs text-muted">{user.role}</Text>
              <Text className="text-[11px] text-faint mt-0.5">{user.email}</Text>
            </View>
          </View>

          {user.quickStat && (
            <View
              className="flex-row justify-between items-center px-3 py-2 rounded-lg"
              style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
            >
              <Text className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                {user.quickStat.label}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: statColor }}>{user.quickStat.value}</Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View
          className="rounded-2xl p-4 mb-3"
          style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }}
        >
          <Text className="text-[10px] tracking-wider uppercase text-faint font-semibold mb-2">Details</Text>
          <DetailRow k="Department" v={user.department ?? '—'} />
          <DetailRow k="Reports to" v={user.reportsTo ?? '—'} />
          <DetailRow k="Team size"  v={user.teamSize?.toString() ?? '—'} />
          <DetailRow k="Location"   v={user.location ?? '—'} />
          <DetailRow k="Timezone"   v={user.timezone ?? '—'} />
        </View>

        {/* Focus areas */}
        {user.focusAreas && (
          <View
            className="rounded-2xl p-4 mb-3"
            style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }}
          >
            <Text className="text-[10px] tracking-wider uppercase text-faint font-semibold mb-2">Focus areas</Text>
            <View className="flex-row flex-wrap gap-1.5">
              {user.focusAreas.map((f) => (
                <View
                  key={f}
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '500', color: '#1E40AF' }}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Today */}
        {user.todayAgenda && user.todayAgenda.length > 0 && (
          <View
            className="rounded-2xl p-4 mb-3"
            style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }}
          >
            <Text className="text-[10px] tracking-wider uppercase text-faint font-semibold mb-2">Today</Text>
            {user.todayAgenda.map((a, i) => (
              <View key={i} className="flex-row items-start gap-2 py-1">
                <View className="w-1.5 h-1.5 rounded-full bg-brand mt-2" />
                <Text className="text-sm text-ink flex-1">{a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Switch persona */}
        <View
          className="rounded-2xl mb-3"
          style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }}
        >
          <Text className="text-[10px] tracking-wider uppercase text-faint font-semibold px-4 pt-3 pb-2">
            Switch persona
          </Text>
          {(Object.keys(PERSONAS) as Role[]).map((r, i) => {
            const p = PERSONAS[r];
            const active = r === user.key;
            return (
              <Pressable
                key={r}
                onPress={() => login(r)}
                className="flex-row items-center gap-3 px-4 py-3 active:bg-surface-soft"
                style={i < 2 ? { borderBottomWidth: 1, borderBottomColor: '#E2E8F0' } : undefined}
              >
                <LinearGradient
                  colors={['#6366F1', '#1E40AF']}
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-white text-xs font-semibold">{p.init}</Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-ink">{p.name}</Text>
                  <Text className="text-[11px] text-muted">{p.role}</Text>
                </View>
                {active && <Text className="text-[11px] text-brand font-semibold">Active</Text>}
              </Pressable>
            );
          })}
        </View>

        {/* Logout */}
        <Pressable
          onPress={logout}
          className="flex-row items-center justify-center gap-2 py-3 rounded-2xl active:opacity-70"
          style={{ backgroundColor: '#FEE2E2' }}
        >
          <Icon.LogOut color="#DC2626" size={16} />
          <Text className="text-sm font-semibold" style={{ color: '#DC2626' }}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <View className="flex-row py-1">
      <Text style={{ fontSize: 12, color: '#475569', width: 100 }}>{k}</Text>
      <Text style={{ fontSize: 12, color: '#0F172A', flex: 1 }}>{v}</Text>
    </View>
  );
}
