import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PERSONAS } from '../data';
import { useAuth } from '../store';
import type { Role } from '../types';
import { Icon } from '../components/icons';
import { Logo } from '../components/Logo';

const CARD_ACCENTS: Record<Role, readonly [string, string]> = {
  CFO:        ['#FF9B6C', '#7A2E10'],
  CONTROLLER: ['#10B981', '#0F766E'],
  STAFF:   ['#F59E0B', '#C2410C'],
};

const TAGLINES: Record<Role, string> = {
  CFO:        'Executive rollup. Approvals. Board prep.',
  CONTROLLER: 'Close orchestration. Reconciliations. Review queue.',
  STAFF:   'Worklist. Investigations. Evidence uploads.',
};

export default function LoginScreen() {
  const { login } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-surface-alt">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View className="mb-8 mt-4">
          <Logo height={40} />
          <Text className="text-xs text-muted mt-2">
            Variance Workbench — pick a persona to explore
          </Text>
        </View>

        <View className="gap-3">
          {(Object.keys(PERSONAS) as Role[]).map((role) => {
            const p = PERSONAS[role];
            const [c1, c2] = CARD_ACCENTS[role];
            return (
              <Pressable
                key={role}
                onPress={() => login(role)}
                className="bg-surface rounded-2xl p-5 active:opacity-80"
                style={{ borderWidth: 1, borderColor: '#E2E8F0' }}
              >
                <LinearGradient
                  colors={[c1, c2]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}
                >
                  <Text className="text-white text-lg font-semibold">{p.init}</Text>
                </LinearGradient>

                <Text className="text-[13px] font-semibold text-ink">{p.name}</Text>
                <Text className="text-xs text-muted mb-2">{p.role}</Text>
                <Text className="text-sm text-ink leading-relaxed mb-3">{TAGLINES[role]}</Text>

                <View className="flex-row items-center gap-1">
                  <Text className="text-[13px] font-medium text-brand">Enter workspace</Text>
                  <Icon.Send color="#F16922" size={14} />
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text className="text-center text-[13px] text-faint mt-8">
          Prototype · No credentials · Persona stored locally, switchable from Profile
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
