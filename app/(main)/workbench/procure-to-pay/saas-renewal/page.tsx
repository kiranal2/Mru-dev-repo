'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bar, Doughnut } from 'react-chartjs-2';
import Breadcrumb from '@/components/layout/Breadcrumb';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface SaaSRecord {
  id: number;
  exec: string;
  vendor: string;
  app: string;
  renewalDays: number;
  renewal: string;
  provisioned: number;
  active90: number;
  t12mSpend: number;
  ppau: number;
  dupRisk: boolean;
  shadow: boolean;
}

const SYNTHETIC_DATA: SaaSRecord[] = [
  {"id": 1, "exec": "CFO", "vendor": "Anaplan", "app": "Anaplan", "renewalDays": 175, "renewal": "2026-04-13", "provisioned": 107, "active90": 39, "t12mSpend": 287619, "ppau": 7375, "dupRisk": true, "shadow": false},
  {"id": 2, "exec": "CFO", "vendor": "BlackLine", "app": "BlackLine", "renewalDays": 185, "renewal": "2026-04-23", "provisioned": 429, "active90": 380, "t12mSpend": 607309, "ppau": 1598, "dupRisk": false, "shadow": false},
  {"id": 3, "exec": "CFO", "vendor": "Coupa", "app": "Coupa", "renewalDays": 19, "renewal": "2025-11-08", "provisioned": 97, "active90": 47, "t12mSpend": 163292, "ppau": 3474, "dupRisk": false, "shadow": true},
  {"id": 4, "exec": "CFO", "vendor": "Workiva", "app": "Workiva", "renewalDays": 62, "renewal": "2025-12-21", "provisioned": 416, "active90": 214, "t12mSpend": 1170843, "ppau": 5471, "dupRisk": false, "shadow": false},
  {"id": 5, "exec": "CFO", "vendor": "Stripe", "app": "Stripe", "renewalDays": 13, "renewal": "2025-11-02", "provisioned": 438, "active90": 365, "t12mSpend": 791382, "ppau": 2168, "dupRisk": false, "shadow": false},
  {"id": 6, "exec": "CFO", "vendor": "NetSuite", "app": "SuiteAnalytics", "renewalDays": 51, "renewal": "2025-12-10", "provisioned": 160, "active90": 148, "t12mSpend": 252067, "ppau": 1703, "dupRisk": false, "shadow": false},
  {"id": 7, "exec": "CFO", "vendor": "OneStream", "app": "OneStream", "renewalDays": 36, "renewal": "2025-11-25", "provisioned": 233, "active90": 200, "t12mSpend": 406907, "ppau": 2035, "dupRisk": false, "shadow": false},
  {"id": 8, "exec": "CFO", "vendor": "Planful", "app": "Planful", "renewalDays": 149, "renewal": "2026-03-18", "provisioned": 113, "active90": 106, "t12mSpend": 181055, "ppau": 1708, "dupRisk": true, "shadow": false},
  {"id": 9, "exec": "CTO", "vendor": "Atlassian", "app": "Jira", "renewalDays": 170, "renewal": "2026-04-08", "provisioned": 820, "active90": 731, "t12mSpend": 854436, "ppau": 1169, "dupRisk": true, "shadow": false},
  {"id": 10, "exec": "CTO", "vendor": "GitHub", "app": "GitHub", "renewalDays": 32, "renewal": "2025-11-21", "provisioned": 556, "active90": 484, "t12mSpend": 688126, "ppau": 1422, "dupRisk": false, "shadow": false},
  {"id": 11, "exec": "CTO", "vendor": "Datadog", "app": "Datadog", "renewalDays": 102, "renewal": "2026-01-30", "provisioned": 509, "active90": 383, "t12mSpend": 2302162, "ppau": 6011, "dupRisk": false, "shadow": false},
  {"id": 12, "exec": "CTO", "vendor": "Snowflake", "app": "Snowflake", "renewalDays": 30, "renewal": "2025-11-19", "provisioned": 430, "active90": 344, "t12mSpend": 534010, "ppau": 1552, "dupRisk": false, "shadow": false},
  {"id": 13, "exec": "CTO", "vendor": "Okta", "app": "Okta", "renewalDays": 175, "renewal": "2026-04-13", "provisioned": 529, "active90": 486, "t12mSpend": 736621, "ppau": 1516, "dupRisk": false, "shadow": false},
  {"id": 14, "exec": "CTO", "vendor": "Postman", "app": "Postman", "renewalDays": 20, "renewal": "2025-11-09", "provisioned": 726, "active90": 429, "t12mSpend": 763585, "ppau": 1780, "dupRisk": false, "shadow": false},
  {"id": 15, "exec": "CTO", "vendor": "Linear", "app": "Linear", "renewalDays": 157, "renewal": "2026-03-26", "provisioned": 724, "active90": 346, "t12mSpend": 911972, "ppau": 2636, "dupRisk": false, "shadow": false},
  {"id": 16, "exec": "CTO", "vendor": "Sentry", "app": "Sentry", "renewalDays": 48, "renewal": "2025-12-07", "provisioned": 622, "active90": 270, "t12mSpend": 856863, "ppau": 3174, "dupRisk": false, "shadow": false},
  {"id": 17, "exec": "CMO", "vendor": "Salesforce", "app": "Marketing Cloud", "renewalDays": 161, "renewal": "2026-03-30", "provisioned": 259, "active90": 230, "t12mSpend": 915347, "ppau": 3980, "dupRisk": true, "shadow": false},
  {"id": 18, "exec": "CMO", "vendor": "HubSpot", "app": "HubSpot", "renewalDays": 142, "renewal": "2026-03-11", "provisioned": 292, "active90": 118, "t12mSpend": 507406, "ppau": 4300, "dupRisk": true, "shadow": false},
  {"id": 19, "exec": "CMO", "vendor": "Figma", "app": "Figma", "renewalDays": 186, "renewal": "2026-04-24", "provisioned": 256, "active90": 181, "t12mSpend": 514000, "ppau": 2840, "dupRisk": true, "shadow": false},
  {"id": 20, "exec": "CMO", "vendor": "Canva", "app": "Canva", "renewalDays": 76, "renewal": "2026-01-04", "provisioned": 323, "active90": 114, "t12mSpend": 735334, "ppau": 6450, "dupRisk": false, "shadow": false},
  {"id": 21, "exec": "CMO", "vendor": "Marketo", "app": "Marketo", "renewalDays": 80, "renewal": "2026-01-08", "provisioned": 433, "active90": 166, "t12mSpend": 1418724, "ppau": 8547, "dupRisk": true, "shadow": false},
  {"id": 22, "exec": "CMO", "vendor": "Braze", "app": "Braze", "renewalDays": 79, "renewal": "2026-01-07", "provisioned": 296, "active90": 239, "t12mSpend": 623419, "ppau": 2608, "dupRisk": false, "shadow": false},
  {"id": 23, "exec": "CMO", "vendor": "Segment", "app": "Segment", "renewalDays": 172, "renewal": "2026-04-10", "provisioned": 192, "active90": 164, "t12mSpend": 404377, "ppau": 2466, "dupRisk": false, "shadow": true},
  {"id": 24, "exec": "CMO", "vendor": "Miro", "app": "Miro", "renewalDays": 107, "renewal": "2026-02-04", "provisioned": 430, "active90": 192, "t12mSpend": 1048317, "ppau": 5460, "dupRisk": false, "shadow": false}
];

export default function SaaSRenewalWorkbenchPage() {
  const [execFilter, setExecFilter] = useState<string>('ALL');
  const [renewalFilter, setRenewalFilter] = useState<string>('ALL');
  const [dupToggle, setDupToggle] = useState(false);
  const [shadowToggle, setShadowToggle] = useState(false);
  const [lowUtilToggle, setLowUtilToggle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<SaaSRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const formatCurrency = (n: number) => {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };

  const utilizationPercent = (r: SaaSRecord) => {
    return r.active90 && r.provisioned ? Math.round((r.active90 / r.provisioned) * 100) : 0;
  };

  const badgeRenewal = (days: number) => {
    let colorClass = 'bg-emerald-100 text-emerald-700';
    if (days <= 30) colorClass = 'bg-rose-100 text-rose-700';
    else if (days <= 60) colorClass = 'bg-amber-100 text-amber-700';
    else if (days <= 90) colorClass = 'bg-yellow-100 text-yellow-700';
    else if (days <= 120) colorClass = 'bg-lime-100 text-lime-700';
    return colorClass;
  };

  const filtered = useMemo(() => {
    return SYNTHETIC_DATA.filter(r => {
      if (execFilter !== 'ALL' && r.exec !== execFilter) return false;
      if (renewalFilter !== 'ALL' && r.renewalDays > Number(renewalFilter)) return false;
      if (dupToggle && !r.dupRisk) return false;
      if (shadowToggle && !r.shadow) return false;
      if (lowUtilToggle && utilizationPercent(r) >= 70) return false;
      const q = searchQuery.trim().toLowerCase();
      if (q && !(r.vendor.toLowerCase().includes(q) || r.app.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [execFilter, renewalFilter, dupToggle, shadowToggle, lowUtilToggle, searchQuery]);

  const kpis = useMemo(() => {
    const spend = filtered.reduce((a, r) => a + r.t12mSpend, 0);
    const wasteSeats = filtered.reduce((a, r) => a + Math.max(0, (r.provisioned - r.active90)), 0);
    const renewals90 = filtered.filter(r => r.renewalDays <= 90).length;
    const shadowCount = filtered.filter(r => r.shadow).length;
    return { spend, wasteSeats, renewals90, shadowCount };
  }, [filtered]);

  const topApps = useMemo(() => {
    return [...filtered]
      .sort((a, b) => (b.active90 / b.provisioned) - (a.active90 / a.provisioned))
      .slice(0, 7);
  }, [filtered]);

  const renewalBuckets = useMemo(() => {
    const buckets: Record<string, number> = { '≤30': 0, '≤60': 0, '≤90': 0, '≤120': 0, '≤180': 0 };
    filtered.forEach(r => {
      if (r.renewalDays <= 30) buckets['≤30']++;
      else if (r.renewalDays <= 60) buckets['≤60']++;
      else if (r.renewalDays <= 90) buckets['≤90']++;
      else if (r.renewalDays <= 120) buckets['≤120']++;
      else if (r.renewalDays <= 180) buckets['≤180']++;
    });
    return buckets;
  }, [filtered]);

  const recommendedAction = (r: SaaSRecord) => {
    const util = utilizationPercent(r);
    const acts = [];
    if (util < 70) acts.push('Rightsize commit to active90 + 15%');
    if (r.dupRisk) acts.push('Consolidate overlapping tools');
    if (r.ppau > 5000) acts.push('Reprice: reset rate card');
    if (r.shadow) acts.push('Bring under SSO & contract');
    if (acts.length === 0) acts.push('Hold: maintain terms');
    return acts.join(' · ');
  };

  const handleReset = () => {
    setExecFilter('ALL');
    setRenewalFilter('ALL');
    setDupToggle(false);
    setShadowToggle(false);
    setLowUtilToggle(false);
    setSearchQuery('');
  };

  const openBrief = (r: SaaSRecord) => {
    setSelectedRecord(r);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col bg-white" style={{ height: '100%', minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/procure-to-pay/saas-renewal" className="mb-1.5" />
        <h1 className="text-2xl font-bold text-[#000000] mt-2">SaaS Renewal</h1>
        <p className="text-sm text-[#606060]">Monitor and optimize SaaS subscriptions</p>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="p-6">
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <Card className="lg:col-span-3 p-6">
            <div className="space-y-4">
              <div className="flex items-end gap-3">
                <div>
                  <label className="text-sm text-slate-600 block mb-2">Executive</label>
                  <div className="flex items-center gap-3">
                    <Select value={execFilter} onValueChange={setExecFilter}>
                      <SelectTrigger className="w-56 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Executives</SelectItem>
                        <SelectItem value="CFO">CFO</SelectItem>
                        <SelectItem value="CTO">CTO</SelectItem>
                        <SelectItem value="CMO">CMO</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm px-4 h-11 flex items-center border border-slate-200 rounded-md whitespace-nowrap text-slate-700">
                      Org scope: 2 levels
                    </span>
                  </div>
                </div>
                <div className="ml-8">
                  <label className="text-sm text-slate-600 block mb-2">Renewal window</label>
                  <Select value={renewalFilter} onValueChange={setRenewalFilter}>
                    <SelectTrigger className="w-64 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="180">≤ 180 days</SelectItem>
                      <SelectItem value="120">≤ 120 days</SelectItem>
                      <SelectItem value="90">≤ 90 days</SelectItem>
                      <SelectItem value="60">≤ 60 days</SelectItem>
                      <SelectItem value="30">≤ 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={dupToggle} onCheckedChange={(checked) => setDupToggle(!!checked)} />
                    <span className="text-slate-700">Duplicate tool risk</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={shadowToggle} onCheckedChange={(checked) => setShadowToggle(!!checked)} />
                    <span className="text-slate-700">Shadow IT only</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={lowUtilToggle} onCheckedChange={(checked) => setLowUtilToggle(!!checked)} />
                    <span className="text-slate-700">Utilization &lt; 70%</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search vendor or app..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-80 h-11"
                    />
                  </div>
                  <Button variant="outline" onClick={handleReset} className="h-11 px-6">
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-500">T12M SaaS spend</div>
              <div className="text-xl font-semibold">{formatCurrency(kpis.spend)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Waste (est.)</div>
              <div className="text-xl font-semibold">{kpis.wasteSeats.toLocaleString()} seats</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Renewals ≤ 90d</div>
              <div className="text-xl font-semibold">{kpis.renewals90}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Shadow IT vendors</div>
              <div className="text-xl font-semibold">{kpis.shadowCount}</div>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Utilization vs Provisioned (Top Apps)</h3>
              <span className="text-xs text-slate-500">Active90 / Provisioned seats</span>
            </div>
            <Bar
              data={{
                labels: topApps.map(r => r.app),
                datasets: [{
                  label: 'Utilization %',
                  data: topApps.map(r => utilizationPercent(r)),
                  backgroundColor: '#60A5FA',
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100 } }
              }}
              height={120}
            />
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Renewal Buckets</h3>
              <span className="text-xs text-slate-500">Count by window</span>
            </div>
            <Doughnut
              data={{
                labels: Object.keys(renewalBuckets),
                datasets: [{
                  data: Object.values(renewalBuckets),
                  backgroundColor: ['#3B82F6', '#F87171', '#FBBF24', '#FCD34D', '#34D399'],
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'bottom' } }
              }}
              height={120}
            />
          </Card>
        </section>

        <Card>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold">Renewal Watchlist (SaaS)</h3>
            <div className="text-xs text-slate-500">Click a row for a negotiation brief</div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exec</TableHead>
                  <TableHead>Vendor / App</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead className="text-right">Provisioned</TableHead>
                  <TableHead className="text-right">Active90</TableHead>
                  <TableHead className="text-right">Util%</TableHead>
                  <TableHead className="text-right">T12M Spend</TableHead>
                  <TableHead className="text-right">$/Active</TableHead>
                  <TableHead className="text-center">Dup</TableHead>
                  <TableHead className="text-center">Shadow</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => {
                  const util = utilizationPercent(r);
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => openBrief(r)}
                    >
                      <TableCell>{r.exec}</TableCell>
                      <TableCell>
                        <div className="font-medium">{r.vendor}</div>
                        <div className="text-xs text-slate-500">{r.app}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-full", badgeRenewal(r.renewalDays))}>
                          {r.renewalDays}d
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{r.provisioned.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.active90.toLocaleString()}</TableCell>
                      <TableCell className={cn("text-right", util < 70 ? "text-rose-600 font-semibold" : "")}>
                        {util}%
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(r.t12mSpend)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.ppau)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("rounded-full", r.dupRisk ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600")}>
                          {r.dupRisk ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("rounded-full", r.shadow ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600")}>
                          {r.shadow ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">{recommendedAction(r)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-lg">
                  {selectedRecord ? `${selectedRecord.vendor} — ${selectedRecord.app}` : 'Negotiation Brief'}
                </DialogTitle>
                {selectedRecord && (
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedRecord.exec} · Renewal in {selectedRecord.renewalDays} days · {new Date(selectedRecord.renewal).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Rightsize target</div>
                  <div className="font-semibold">{Math.ceil(selectedRecord.active90 * 1.15)} seats (active90 + 15%)</div>
                </Card>
                <Card className="bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Waste est.</div>
                  <div className="font-semibold">
                    {Math.max(0, selectedRecord.provisioned - selectedRecord.active90).toLocaleString()} seats · {formatCurrency((selectedRecord.t12mSpend / (selectedRecord.active90 || 1)) * Math.max(0, selectedRecord.provisioned - selectedRecord.active90))}
                  </div>
                </Card>
                <Card className="bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">$/Active vs last</div>
                  <div className="font-semibold">{formatCurrency(selectedRecord.ppau)} (est.)</div>
                </Card>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Recommended actions</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {recommendedAction(selectedRecord).split(' · ').map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">De‑provision list (inactive ≥90d)</h4>
                <div className="text-sm text-slate-700">
                  {Array.from({ length: Math.min(8, Math.max(2, selectedRecord.provisioned - selectedRecord.active90)) })
                    .map((_, i) => `user${i + 1}@example.com`)
                    .join(', ')}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setModalOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
