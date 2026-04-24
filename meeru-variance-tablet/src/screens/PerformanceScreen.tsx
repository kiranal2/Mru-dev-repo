import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useIndustryData } from '../store';
import { WorkbenchShell } from '../components/WorkbenchShell';
import { LeftRail, RailGroup } from '../components/LeftRail';
import { TopNav } from '../components/TopNav';
import { CommentaryPanel } from '../components/CommentaryPanel';
import { CommandCenter } from '../components/CommandCenter';
import { KpiRow } from '../components/KpiCard';
import { VarianceChart } from '../components/VarianceChart';
import { StatusChip } from '../components/StatusChip';
import { AISummaryCallout } from '../components/AISummaryCallout';
import {
  DrillDownView, ExceptionsView, SignalsView, HistoryView,
} from '../components/subviews';
import { filterCommentaryByDriver } from '../industry-presets';

const TOP_TABS = [
  { k: 'analysis',   n: 'Analysis'   },
  { k: 'drilldown',  n: 'Drill-Down' },
  { k: 'exceptions', n: 'Exceptions' },
  { k: 'signals',    n: 'Signals'    },
  { k: 'history',    n: 'History'    },
];

export default function PerformanceScreen() {
  const industry = useIndustryData();
  const [region, setRegion] = useState<string>(industry.regions[0]?.k ?? 'global');
  const [driver, setDriver] = useState<string | null>(null);
  const [topTab, setTopTab] = useState('analysis');

  // Reset region + driver when industry changes (preset keys differ).
  useEffect(() => {
    setRegion(industry.regions[0]?.k ?? 'global');
    setDriver(null);
  }, [industry.meta.key]);

  const slice = industry.regional[region] ?? Object.values(industry.regional)[0];
  const regionLabel = industry.regions.find((r) => r.k === region)?.n ?? 'Global';
  const bridge = industry.bridges[region];
  const driverLabel = driver ? (industry.segments.find((s) => s.k === driver)?.n ?? null) : null;
  const commentary = filterCommentaryByDriver(
    slice?.commentary ?? [],
    driver,
    industry.segmentKeywords,
  );
  // Lookup sparklines for the right-panel commentary rows by segment name
  const sparkByName = Object.fromEntries(
    industry.drilldown.map((d) => [d.customer, d.spark]),
  );

  const drillRows = region === industry.regions[0]?.k
    ? industry.drilldown
    : industry.drilldown.filter((d) => d.region === regionLabel).length
      ? industry.drilldown.filter((d) => d.region === regionLabel)
      : industry.drilldown;

  return (
    <WorkbenchShell
      leftRail={
        <LeftRail>
          <RailGroup
            label="Regions"
            items={industry.regions}
            active={region}
            onSelect={setRegion}
          />
          <RailGroup
            label="Segments"
            items={industry.segments}
            active={driver ?? undefined}
            onSelect={(k) => setDriver((prev) => (prev === k ? null : k))}
          />
        </LeftRail>
      }
      topNav={
        <TopNav
          tabs={TOP_TABS}
          active={topTab}
          onChange={setTopTab}
          dots={{ exceptions: industry.exceptions.filter((e) => e.severity === 'critical').length }}
          right={
            <Text className="text-[11px] text-muted">
              {industry.meta.periodLabel} · {regionLabel}
            </Text>
          }
        />
      }
      commentary={
        <CommentaryPanel
          items={commentary}
          headline={
            driverLabel
              ? `${regionLabel} · ${driverLabel}`
              : `Drivers of ${industry.meta.periodLabel} variance — ${regionLabel}`
          }
          sparkByName={sparkByName}
        />
      }
      dock={<CommandCenter />}
    >
      {/* Title row */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[16px] font-semibold text-ink flex-1" numberOfLines={1}>
          Performance Intelligence · {industry.meta.periodLabel} · {regionLabel}
        </Text>
        {slice?.statusChip && (
          <StatusChip kind={slice.statusChip.kind}>{slice.statusChip.text}</StatusChip>
        )}
      </View>

      {/* AI Summary callout (Analysis tab only) */}
      {topTab === 'analysis' && bridge && (
        <AISummaryCallout
          parts={bridge.aha}
          storageKey={`meeru.perf.aiSummaryOpen.${industry.meta.key}`}
        />
      )}

      {/* Segment filter indicator */}
      {driverLabel && topTab === 'analysis' && (
        <View className="mb-3 flex-row items-center gap-2 px-3 py-2 rounded-lg border border-rule bg-brand-tint/40">
          <Text className="text-[12px] text-muted">Segment filter:</Text>
          <Text className="text-[12px] font-semibold text-brand">{driverLabel}</Text>
          <View className="flex-1" />
          <Text className="text-[11px] text-muted" onPress={() => setDriver(null)}>Clear</Text>
        </View>
      )}

      {/* Tab content */}
      {topTab === 'analysis' && slice && (
        <>
          <KpiRow kpis={slice.kpis} />
          <VarianceChart title={slice.chartTitle} bars={slice.chart} />
        </>
      )}
      {topTab === 'drilldown' && <DrillDownView rows={drillRows} />}
      {topTab === 'exceptions' && <ExceptionsView items={industry.exceptions} />}
      {topTab === 'signals' && <SignalsView items={industry.signals} />}
      {topTab === 'history' && <HistoryView rows={industry.history} />}
    </WorkbenchShell>
  );
}
