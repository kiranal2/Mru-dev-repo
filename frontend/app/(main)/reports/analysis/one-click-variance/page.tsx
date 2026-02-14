'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Breadcrumb from '@/components/layout/breadcrumb';

const ENTITIES = ['All Entities', 'US-Parent', 'EMEA-GmbH', 'APAC-Pte'];
const CUSTOMERS = [
  'Acme Retail', 'Globex Corp', 'Initech', 'Umbrella Health', 'Hooli Cloud',
  'Soylent Foods', 'Stark Industries', 'Wayne Enterprises', 'Wonka Brands',
  'Cyberdyne Systems', 'Tyrell Bio', 'Duff Beverage', 'Oscorp', 'Aperture Labs'
];
const PRODUCTS = ['Subscriptions', 'Services', 'Hardware', 'Support', 'Training'];
const REGIONS = ['Americas', 'EMEA', 'APAC'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Transaction {
  date: Date;
  entity: string;
  customer: string;
  product: string;
  region: string;
  amount: number;
}

interface GroupedData {
  key: string;
  current: number;
  prior: number;
  varDollar: number;
  varPct: number;
}

const rnd = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateSyntheticData = (): Transaction[] => {
  const facts: Transaction[] = [];
  const today = new Date();

  for (let i = 0; i < 24; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const rows = rnd(60, 90);

    for (let j = 0; j < rows; j++) {
      const monthsBack = today.getFullYear() * 12 + today.getMonth() - (d.getFullYear() * 12 + d.getMonth());
      const base = 2000 + monthsBack * rnd(10, 40);
      const amt = Math.max(50, Math.round((base + rnd(-800, 1200)) / 10) * 10);

      facts.push({
        date: new Date(d.getFullYear(), d.getMonth(), rnd(1, 28)),
        entity: pick(ENTITIES.slice(1)),
        customer: pick(CUSTOMERS),
        product: pick(PRODUCTS),
        region: pick(REGIONS),
        amount: amt
      });
    }
  }

  return facts;
};

export default function OneClickVariancePage() {
  const [facts] = useState<Transaction[]>(() => generateSyntheticData());

  const today = new Date();
  const defaultMonth = today.getMonth();
  const defaultYear = today.getFullYear();

  const [entity, setEntity] = useState('All Entities');
  const [customerFilter, setCustomerFilter] = useState('');
  const [month, setMonth] = useState(String(defaultMonth));
  const [year, setYear] = useState(String(defaultYear));
  const [mode, setMode] = useState<'MoM' | 'QoQ' | 'YoY'>('MoM');
  const [groupBy, setGroupBy] = useState<'customer' | 'entity' | 'product' | 'region'>('customer');
  const [hasRun, setHasRun] = useState(false);

  const years = useMemo(() => {
    const uniqueYears = new Set(facts.map(f => f.date.getFullYear()));
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [facts]);

  const getPriorPeriod = (y: number, m: number, analysisMode: 'MoM' | 'QoQ' | 'YoY') => {
    if (analysisMode === 'MoM') {
      const p = new Date(y, m - 1, 1);
      return { y: p.getFullYear(), m: p.getMonth() };
    }
    if (analysisMode === 'QoQ') {
      const p = new Date(y, m - 3, 1);
      return { y: p.getFullYear(), m: p.getMonth() };
    }
    return { y: y - 1, m };
  };

  const analysis = useMemo(() => {
    if (!hasRun) return null;

    const y = Number(year);
    const m = Number(month);

    let curMonths: Array<{y: number, m: number}> = [];
    let priMonths: Array<{y: number, m: number}> = [];

    if (mode === 'QoQ') {
      curMonths = [0, 1, 2].map(k => {
        const d = new Date(y, m - k, 1);
        return { y: d.getFullYear(), m: d.getMonth() };
      });
      const pp = getPriorPeriod(y, m, mode);
      priMonths = [0, 1, 2].map(k => {
        const d = new Date(pp.y, pp.m - k, 1);
        return { y: d.getFullYear(), m: d.getMonth() };
      });
    } else {
      curMonths = [{ y, m }];
      const pp = getPriorPeriod(y, m, mode);
      priMonths = [{ y: pp.y, m: pp.m }];
    }

    const curSet = new Set(curMonths.map(x => `${x.y}-${x.m}`));
    const priSet = new Set(priMonths.map(x => `${x.y}-${x.m}`));

    const filtered = facts.filter(f => {
      const periodKey = `${f.date.getFullYear()}-${f.date.getMonth()}`;
      const matchesEntity = entity === 'All Entities' || f.entity === entity;
      const matchesCustomer = !customerFilter || f.customer.toLowerCase().includes(customerFilter.toLowerCase());
      const matchesPeriod = curSet.has(periodKey) || priSet.has(periodKey);

      return matchesEntity && matchesCustomer && matchesPeriod;
    });

    const grouped = new Map<string, { cur: number; pri: number }>();

    filtered.forEach(f => {
      const periodKey = `${f.date.getFullYear()}-${f.date.getMonth()}`;
      const key = f[groupBy];

      if (!grouped.has(key)) {
        grouped.set(key, { cur: 0, pri: 0 });
      }

      const slot = grouped.get(key)!;
      if (curSet.has(periodKey)) {
        slot.cur += f.amount;
      } else if (priSet.has(periodKey)) {
        slot.pri += f.amount;
      }
    });

    const results: GroupedData[] = Array.from(grouped.entries()).map(([key, value]) => ({
      key,
      current: value.cur,
      prior: value.pri,
      varDollar: value.cur - value.pri,
      varPct: value.pri === 0 ? (value.cur > 0 ? Infinity : 0) : (value.cur - value.pri) / value.pri
    }));

    const detailRows = filtered.filter(f => {
      const periodKey = `${f.date.getFullYear()}-${f.date.getMonth()}`;
      return curSet.has(periodKey);
    });

    return {
      groups: results,
      detailRows,
      totals: {
        current: results.reduce((sum, g) => sum + g.current, 0),
        prior: results.reduce((sum, g) => sum + g.prior, 0)
      }
    };
  }, [facts, entity, customerFilter, month, year, mode, groupBy, hasRun]);

  const handleRun = () => {
    setHasRun(true);
    toast.success('Analysis complete');
  };

  const handleDownloadCSV = () => {
    if (!analysis) {
      toast.error('Run analysis first');
      return;
    }

    const rows = analysis.detailRows;
    const header = ['Date', 'Entity', 'Customer', 'Product', 'Region', 'Amount'];
    const csvRows = [header.join(',')];

    rows.forEach(r => {
      const values = [
        r.date.toISOString().slice(0, 10),
        r.entity,
        r.customer,
        r.product,
        r.region,
        r.amount
      ];
      csvRows.push(values.map(v => String(v).includes(',') ? `"${v}"` : v).join(','));
    });

    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `variance-${mode}-${MONTH_NAMES[Number(month)]}-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('CSV downloaded');
  };

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const fmtPct = (n: number) => {
    if (!isFinite(n)) return '-';
    return `${(n * 100).toFixed(1)}%`;
  };

  const topMovers = analysis?.groups
    .filter(g => g.varDollar > 0)
    .sort((a, b) => b.varDollar - a.varDollar)
    .slice(0, 10) || [];

  const bottomMovers = analysis?.groups
    .filter(g => g.varDollar < 0)
    .sort((a, b) => a.varDollar - b.varDollar)
    .slice(0, 10) || [];

  const totals = analysis?.totals || { current: 0, prior: 0 };
  const totalVarDollar = totals.current - totals.prior;
  const totalVarPct = totals.prior === 0 ? 0 : totalVarDollar / totals.prior;

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="reports/analysis/one-click-variance" className="mb-1.5" />
        <h1 className="text-2xl font-bold text-[#000000] mt-2">One-Click Variance</h1>
        <p className="text-sm text-[#606060]">Pull cross-system data by entity, customer, and period. Choose MoM, QoQ, or YoY and get instant variance results with top and bottom movers. Download details to CSV.</p>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-[320px] flex-shrink-0 overflow-y-auto scrollbar-hide py-6 pl-6">
          <Card className="p-4">
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-4">Controls</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="entity" className="text-xs text-slate-600 mb-2 block">Entity</Label>
                  <Select value={entity} onValueChange={setEntity}>
                    <SelectTrigger id="entity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITIES.map(e => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="customer" className="text-xs text-slate-600 mb-2 block">Customer name - optional</Label>
                  <Input
                    id="customer"
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    placeholder="Search customer..."
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-600 mb-2 block">Period</Label>
                  <div className="flex gap-2">
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_NAMES.map((m, idx) => (
                          <SelectItem key={idx} value={String(idx)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(y => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Current period. Prior period is derived from the analysis mode.</p>
                </div>

                <div>
                  <Label className="text-xs text-slate-600 mb-2 block">Analysis mode</Label>
                  <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)}>
                    <div className="flex gap-2">
                      <div className="flex items-center space-x-2 border border-slate-200 rounded-full px-3 py-1.5">
                        <RadioGroupItem value="MoM" id="mom" />
                        <Label htmlFor="mom" className="cursor-pointer text-sm">MoM</Label>
                      </div>
                      <div className="flex items-center space-x-2 border border-slate-200 rounded-full px-3 py-1.5">
                        <RadioGroupItem value="QoQ" id="qoq" />
                        <Label htmlFor="qoq" className="cursor-pointer text-sm">QoQ</Label>
                      </div>
                      <div className="flex items-center space-x-2 border border-slate-200 rounded-full px-3 py-1.5">
                        <RadioGroupItem value="YoY" id="yoy" />
                        <Label htmlFor="yoy" className="cursor-pointer text-sm">YoY</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="groupBy" className="text-xs text-slate-600 mb-2 block">Group by</Label>
                  <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                    <SelectTrigger id="groupBy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="entity">Entity</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="region">Region</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleRun} className="flex-1">
                    Run Analysis
                  </Button>
                  <Button onClick={handleDownloadCSV} variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-xs text-slate-500">Data is synthetic. Buttons simulate one-click actions.</p>
              </div>
            </Card>
          </aside>

          <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
            <div className="max-w-[1280px] space-y-4">
              <div className="grid grid-cols-4 gap-3">
              <Card className="p-4 border-slate-200">
                <div className="text-xs text-slate-600 mb-1">Current Period Total</div>
                <div className="text-xl font-bold">${fmt(totals.current)}</div>
              </Card>
              <Card className="p-4 border-slate-200">
                <div className="text-xs text-slate-600 mb-1">Prior Period Total</div>
                <div className="text-xl font-bold">${fmt(totals.prior)}</div>
              </Card>
              <Card className="p-4 border-slate-200">
                <div className="text-xs text-slate-600 mb-1">$ Variance</div>
                <div className={cn("text-xl font-bold", totalVarDollar >= 0 ? "text-green-600" : "text-red-600")}>
                  {totalVarDollar >= 0 ? '+' : ''} ${fmt(Math.abs(totalVarDollar))}
                </div>
              </Card>
              <Card className="p-4 border-slate-200">
                <div className="text-xs text-slate-600 mb-1">% Variance</div>
                <div className={cn("text-xl font-bold", totalVarPct >= 0 ? "text-green-600" : "text-red-600")}>
                  {totalVarPct >= 0 ? '+' : ''}{fmtPct(totalVarPct)}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Top 10 by $ increase</h3>
                  <Badge variant="outline">{topMovers.length} of {analysis?.groups.length || 0}</Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Group</TableHead>
                        <TableHead className="text-xs text-right">Current</TableHead>
                        <TableHead className="text-xs text-right">Prior</TableHead>
                        <TableHead className="text-xs text-right">$ Var</TableHead>
                        <TableHead className="text-xs text-right">% Var</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topMovers.map((g, idx) => (
                        <TableRow key={idx} className="text-xs">
                          <TableCell className="font-medium">{g.key}</TableCell>
                          <TableCell className="text-slate-600">{groupBy}</TableCell>
                          <TableCell className="text-right">${fmt(g.current)}</TableCell>
                          <TableCell className="text-right">${fmt(g.prior)}</TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              +${fmt(g.varDollar)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-green-600">+{fmtPct(g.varPct)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              <Card className="p-4 border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Bottom 10 by $ decrease</h3>
                  <Badge variant="outline">{bottomMovers.length} of {analysis?.groups.length || 0}</Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Group</TableHead>
                        <TableHead className="text-xs text-right">Current</TableHead>
                        <TableHead className="text-xs text-right">Prior</TableHead>
                        <TableHead className="text-xs text-right">$ Var</TableHead>
                        <TableHead className="text-xs text-right">% Var</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bottomMovers.map((g, idx) => (
                        <TableRow key={idx} className="text-xs">
                          <TableCell className="font-medium">{g.key}</TableCell>
                          <TableCell className="text-slate-600">{groupBy}</TableCell>
                          <TableCell className="text-right">${fmt(g.current)}</TableCell>
                          <TableCell className="text-right">${fmt(g.prior)}</TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              -${fmt(Math.abs(g.varDollar))}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-red-600">{fmtPct(g.varPct)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold text-sm">Details</span>
                  <span className="text-slate-500 text-sm ml-2">
                    - {mode} ending {MONTH_NAMES[Number(month)]} {year} - grouped by {groupBy}
                  </span>
                </div>
                <Badge variant="outline">{analysis?.detailRows.length || 0} rows</Badge>
              </div>
              <div className="border rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Entity</TableHead>
                      <TableHead className="text-xs">Customer</TableHead>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs">Region</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis?.detailRows
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .map((r, idx) => (
                        <TableRow key={idx} className="text-xs">
                          <TableCell>{r.date.toISOString().slice(0, 10)}</TableCell>
                          <TableCell>{r.entity}</TableCell>
                          <TableCell>{r.customer}</TableCell>
                          <TableCell>{r.product}</TableCell>
                          <TableCell>{r.region}</TableCell>
                          <TableCell className="text-right font-medium">${fmt(r.amount)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
            </div>
          </div>
        </div>
      </div>
  );
}
