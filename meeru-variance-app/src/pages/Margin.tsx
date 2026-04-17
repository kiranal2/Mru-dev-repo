import { useMemo, useState } from 'react';
import { WorkbenchShell } from '../components/WorkbenchShell';
import { RailGroup } from '../components/LeftRail';
import { TopNav } from '../components/TopNav';
import { KpiRow } from '../components/KpiRow';
import { Commentary } from '../components/Commentary';
import { StatusChip } from '../components/ui';
import { WaterfallView, ProductMixView, CostsView, SensitivityView } from '../components/subviews';
import {
  MARGIN_PRODUCTS, MARGIN_CHANNELS, MARGIN_PERIODS,
  WORKBENCHES,
  MARGIN_PRODUCT_MIX, MARGIN_COSTS, MARGIN_SENSITIVITY,
  MARGIN_BY_PRODUCT, adjustMarginDeltaByPeriod,
} from '../data';
import { usePersona } from '../components/AppShell';

export default function Margin() {
  const persona = usePersona();
  const [product, setProduct]   = useState('all');
  const [channel, setChannel]   = useState('all');
  const [period, setPeriod]     = useState('qtd');
  const [topTab, setTopTab]     = useState('waterfall');

  const productLabel = MARGIN_PRODUCTS.find(p => p.k === product)?.n ?? 'All Products';
  const channelLabel = MARGIN_CHANNELS.find(c => c.k === channel)?.n ?? 'All Channels';
  const periodLabel  = MARGIN_PERIODS.find(p => p.k === period)?.n  ?? 'Quarter-to-Date';

  // --- Derived data that responds to left rail ---
  const slice = MARGIN_BY_PRODUCT[product] ?? MARGIN_BY_PRODUCT.all;
  const kpis = useMemo(() => adjustMarginDeltaByPeriod(slice.kpis, period), [slice, period]);

  // Product Mix view: when a product is selected, mark that row visually (still show all for comparison)
  const mixRows = useMemo(() => {
    if (product === 'all') return MARGIN_PRODUCT_MIX;
    // Sort the selected product to top
    const idx = MARGIN_PRODUCT_MIX.findIndex(r => r.product.toLowerCase() === product);
    if (idx === -1) return MARGIN_PRODUCT_MIX;
    const copy = [...MARGIN_PRODUCT_MIX];
    const picked = copy.splice(idx, 1)[0];
    return [picked, ...copy];
  }, [product]);

  const costRows = useMemo(() => {
    // Channel filter — when channel is anything other than 'all', trim some rows
    // (This is a light touch; no separate per-channel data defined.)
    if (channel === 'all') return MARGIN_COSTS;
    // Online and Partner channels have lower direct labor footprint → hide warehouse/overhead
    if (channel === 'online' || channel === 'partner') {
      return MARGIN_COSTS.filter(r => !r.category.includes('Direct labor') && !r.category.includes('Overhead'));
    }
    return MARGIN_COSTS;
  }, [channel]);

  const tabSub: Record<string, string> = {
    waterfall:   `${productLabel} · GM bridge · ${periodLabel}`,
    productmix:  `5 products · revenue & margin share · ${periodLabel}`,
    costs:       `COGS decomposition · ${channelLabel}`,
    sensitivity: '5 scenarios modeled',
  };

  return (
    <WorkbenchShell
      workbench="margin"
      scopeLabel={`${WORKBENCHES.margin.label} · ${periodLabel} · ${productLabel} · ${channelLabel}`}
      leftRail={
        <>
          <RailGroup label="Product" items={MARGIN_PRODUCTS} active={product} onSelect={setProduct} groupKey="product" />
          <RailGroup label="Channel" items={MARGIN_CHANNELS} active={channel} onSelect={setChannel} groupKey="channel" />
          <RailGroup label="Period"  items={MARGIN_PERIODS}  active={period}  onSelect={setPeriod}  groupKey="period" />
        </>
      }
      topNav={<TopNav tabs={WORKBENCHES.margin.topTabs} active={topTab} onChange={setTopTab} />}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-semibold text-ink tracking-tight">Margin Intelligence · {productLabel}</h1>
          <p className="text-[11px] text-faint mt-0.5">{tabSub[topTab]} · {persona.role}</p>
        </div>
        <StatusChip kind={slice.statusChip.kind}>{slice.statusChip.text}</StatusChip>
      </div>

      {topTab === 'waterfall' && (
        <>
          <KpiRow kpis={kpis} />
          <WaterfallView steps={slice.waterfall} />
          <div className="mt-3"><Commentary items={slice.commentary} title={`${productLabel} — ranked drivers`} /></div>
        </>
      )}

      {topTab === 'productmix'  && <ProductMixView rows={mixRows} />}
      {topTab === 'costs'       && <CostsView rows={costRows} />}
      {topTab === 'sensitivity' && <SensitivityView scenarios={MARGIN_SENSITIVITY} />}
    </WorkbenchShell>
  );
}
