import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/icons';

const STATUS = [
  { key: 'done',        label: 'Done',        count: 5,  color: '#16A34A' },
  { key: 'in_progress', label: 'In Progress', count: 4,  color: '#1E40AF' },
  { key: 'blocked',     label: 'Blocked',     count: 2,  color: '#DC2626' },
  { key: 'not_started', label: 'Not Started', count: 1,  color: '#475569' },
];

const TASKS = [
  { name: 'Bank reconciliation — operating',         status: 'done' },
  { name: 'AR aging reconciliation',                  status: 'blocked', blocker: 'Missing Voltair remittance' },
  { name: 'Intercompany elimination',                 status: 'in_progress' },
  { name: 'FX remeasurement (EUR, GBP, JPY)',         status: 'in_progress' },
  { name: 'Accrued payroll (including bonuses)',      status: 'done' },
  { name: 'Deferred revenue roll-forward',            status: 'done' },
  { name: 'Fixed asset rollforward',                  status: 'blocked', blocker: 'Q1 depreciation schedule missing from tax' },
  { name: 'Goodwill impairment test',                 status: 'not_started' },
];

export default function CloseScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface-alt" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="mb-4 flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-[10px] tracking-wider uppercase text-muted">Close Workbench</Text>
            <Text className="text-xl font-semibold text-ink mt-1">Day 4 / 5 · Period-End Close</Text>
            <Text className="text-xs text-muted mt-1">Target close: Day 5 EOD. 2 blockers open.</Text>
          </View>
          <Image
            source={require('../../assets/meeru-logo.png')}
            style={{ width: 96, height: 24, resizeMode: 'contain', marginTop: 4 }}
          />
        </View>

        <View className="flex-row flex-wrap gap-3 mb-4">
          {STATUS.map((s) => (
            <View
              key={s.key}
              className="bg-surface rounded-2xl p-3"
              style={{ width: '48%', borderWidth: 1, borderColor: '#E2E8F0' }}
            >
              <Text className="text-[10px] tracking-wider uppercase text-muted font-semibold">{s.label}</Text>
              <Text style={{ fontSize: 22, color: s.color, fontWeight: '600', marginTop: 4 }}>{s.count}</Text>
            </View>
          ))}
        </View>

        <View className="bg-surface rounded-2xl" style={{ borderWidth: 1, borderColor: '#E2E8F0' }}>
          {TASKS.map((t, i) => {
            const s = STATUS.find((x) => x.key === t.status)!;
            return (
              <View
                key={i}
                className="p-3"
                style={i < TASKS.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#E2E8F0' } : undefined}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      {t.status === 'done' && <Icon.Check size={12} color="#16A34A" />}
                      {t.status === 'blocked' && <Icon.Alert size={12} color="#DC2626" />}
                      <Text className="text-sm font-semibold text-ink flex-1">{t.name}</Text>
                    </View>
                    {t.blocker && (
                      <Text className="text-xs mt-1" style={{ color: '#DC2626' }}>⚑ {t.blocker}</Text>
                    )}
                  </View>
                  <View
                    className="px-2 py-0.5 rounded"
                    style={{ backgroundColor: s.color + '22' }}
                  >
                    <Text style={{ fontSize: 10, color: s.color, fontWeight: '600' }}>{s.label}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
