import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../store';
import type { IndustryKey, Density } from '../store';
import { useTheme } from '../theme';
import type { Theme } from '../theme';
import { INDUSTRY_PRESETS, INDUSTRY_LIST } from '../industry-presets';
import { Icon } from '../components/icons';

export default function SettingsScreen() {
  const { settings, update } = useSettings();
  const { theme, setTheme } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-surface-alt">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, alignSelf: 'center', width: '100%' }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-[14px] font-semibold tracking-wider uppercase text-muted">Settings</Text>
          <Text className="text-[22px] font-semibold text-ink mt-0.5">Adaptive preferences</Text>
          <Text className="text-[14px] text-muted mt-1">
            Changes apply immediately and persist to device storage.
          </Text>
        </View>

        {/* Industry preset */}
        <SectionCard>
          <Eyebrow>Industry data</Eyebrow>
          <Text className="text-[13px] text-muted mt-1.5 mb-2.5">
            Switch the data lens. Regions, segments, commentary, exceptions, signals, and history across the Performance workbench rebuild from the chosen preset.
          </Text>
          {INDUSTRY_LIST.map((k) => {
            const preset = INDUSTRY_PRESETS[k];
            const active = settings.industry === k;
            return (
              <Pressable
                key={k}
                onPress={() => update({ industry: k as IndustryKey })}
                className={`mt-2 p-3.5 rounded-lg border ${
                  active ? 'border-brand bg-brand-tint' : 'border-rule'
                }`}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className={`text-[13px] font-semibold ${active ? 'text-brand' : 'text-ink'}`}>
                    {preset.meta.label}
                  </Text>
                  {active && (
                    <View className="px-1.5 py-0.5 bg-brand rounded">
                      <Text className="text-[13px] font-bold uppercase tracking-wider text-white">
                        Active
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-[13px] text-muted mb-2">{preset.meta.tagline}</Text>
                <View className="flex-row gap-1 flex-wrap">
                  <Tag>{preset.meta.periodLabel}</Tag>
                  <Tag>Metric: {preset.meta.metricLabel}</Tag>
                </View>
              </Pressable>
            );
          })}
        </SectionCard>

        {/* Theme */}
        <SectionCard>
          <Eyebrow>Appearance</Eyebrow>
          <View className="flex-row gap-2 mt-2.5">
            {(['light', 'dark'] as const).map((t) => {
              const active = theme === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTheme(t as Theme)}
                  className={`flex-1 px-4 py-3 rounded-lg border ${
                    active ? 'border-brand bg-brand-tint' : 'border-rule'
                  }`}
                >
                  <View className="flex-row items-center justify-center gap-2">
                    {t === 'light' ? <Icon.Sun size={14} /> : <Icon.Moon size={14} />}
                    <Text className={`text-[14px] font-medium capitalize ${active ? 'text-brand' : 'text-muted'}`}>
                      {t} mode {active ? '·  active' : ''}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {/* Density */}
        <SectionCard>
          <Eyebrow>Density</Eyebrow>
          <View className="flex-row gap-2 mt-2.5">
            {(['comfortable', 'compact'] as const).map((d) => {
              const active = settings.density === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => update({ density: d as Density })}
                  className={`flex-1 px-4 py-3 rounded-lg border ${
                    active ? 'border-brand bg-brand-tint' : 'border-rule'
                  }`}
                >
                  <Text className={`text-[14px] font-medium capitalize text-center ${active ? 'text-brand' : 'text-muted'}`}>
                    {d} {active ? '· active' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {/* Show workbench tabs */}
        <SectionCard>
          <Eyebrow>Navigation</Eyebrow>
          <Pressable
            onPress={() => update({ showWorkbenchTabs: !settings.showWorkbenchTabs })}
            className="mt-2 flex-row items-center justify-between p-2 rounded"
          >
            <View className="flex-1 pr-4">
              <Text className="text-[13px] text-ink">Show workbench tabs</Text>
              <Text className="text-[13px] text-muted mt-0.5">
                Reveal the Performance / Margin / Flux tab bar at the top of the workbench.
              </Text>
            </View>
            <Toggle on={settings.showWorkbenchTabs} />
          </Pressable>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helpers -----------------------------------------------------------------

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-surface rounded-xl border border-rule p-4 mb-4">{children}</View>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-[14px] font-semibold tracking-widest uppercase text-faint">
      {children}
    </Text>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <View className="px-1.5 py-0.5 bg-surface-alt border border-rule rounded">
      <Text className="text-[13px] uppercase tracking-wider text-muted">{children}</Text>
    </View>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <View
      className={`w-10 h-5 rounded-full px-0.5 justify-center ${on ? 'bg-brand' : 'bg-surface-soft'}`}
    >
      <View
        className="w-4 h-4 rounded-full bg-surface"
        style={{ alignSelf: on ? 'flex-end' : 'flex-start' }}
      />
    </View>
  );
}
