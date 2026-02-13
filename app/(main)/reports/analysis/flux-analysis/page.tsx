"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Breadcrumb from "@/components/layout/Breadcrumb";

const DATA = {
  is: [
    {
      acct: "4000",
      name: "Revenue",
      base: 48.2,
      actual: 52.9,
      driver: "Price/Volume/Mix",
      owner: "Sales Ops",
      evidence: false,
      status: "Open",
    },
    {
      acct: "5000",
      name: "COGS",
      base: 30.4,
      actual: 32.6,
      driver: "Input costs/Volume",
      owner: "Supply Chain",
      evidence: true,
      status: "In Review",
    },
    {
      acct: "5200",
      name: "Gross Margin",
      base: 17.8,
      actual: 20.3,
      driver: "Price > COGS",
      owner: "FP&A",
      evidence: true,
      status: "Closed",
    },
    {
      acct: "6100",
      name: "R&D",
      base: 6.2,
      actual: 6.8,
      driver: "Headcount Rate",
      owner: "FP&A",
      evidence: false,
      status: "Open",
    },
    {
      acct: "6200",
      name: "S&M",
      base: 5.5,
      actual: 5.9,
      driver: "Programs",
      owner: "Marketing",
      evidence: true,
      status: "Closed",
    },
    {
      acct: "6300",
      name: "G&A",
      base: 3.1,
      actual: 3.0,
      driver: "One-time/Timing",
      owner: "Controller",
      evidence: true,
      status: "Closed",
    },
    {
      acct: "7000",
      name: "Other Inc/Exp",
      base: -0.2,
      actual: -0.1,
      driver: "FX Gain/Loss",
      owner: "Treasury",
      evidence: false,
      status: "Open",
    },
  ],
  bs: [
    {
      acct: "1100",
      name: "Cash & Equivalents",
      base: 14.0,
      actual: 15.1,
      driver: "Operating CF",
      owner: "Treasury",
      evidence: true,
      status: "Closed",
    },
    {
      acct: "1200",
      name: "Accounts Receivable",
      base: 18.4,
      actual: 19.2,
      driver: "Collections/DSO",
      owner: "AR Lead",
      evidence: false,
      status: "Open",
    },
    {
      acct: "1300",
      name: "Prepaids & Other",
      base: 2.9,
      actual: 3.0,
      driver: "Timing",
      owner: "Accounting",
      evidence: false,
      status: "Open",
    },
    {
      acct: "1400",
      name: "Inventory",
      base: 9.8,
      actual: 9.2,
      driver: "Usage/Reserves",
      owner: "Ops Finance",
      evidence: false,
      status: "Open",
    },
    {
      acct: "2000",
      name: "Accounts Payable",
      base: 12.1,
      actual: 12.9,
      driver: "Payment Terms",
      owner: "AP Lead",
      evidence: true,
      status: "In Review",
    },
    {
      acct: "2300",
      name: "Accrued Expenses",
      base: 7.2,
      actual: 6.5,
      driver: "Bonus Accrual",
      owner: "Payroll",
      evidence: true,
      status: "Closed",
    },
    {
      acct: "2400",
      name: "Deferred Revenue",
      base: 11.3,
      actual: 12.1,
      driver: "Billings > Rev",
      owner: "RevOps",
      evidence: false,
      status: "Open",
    },
  ],
  bsRoll: [
    {
      acct: "1200 AR",
      open: 18.4,
      activity: 0.8,
      close: 19.2,
      notes: "Collections slower; DSO 43 → 45",
    },
    {
      acct: "1400 Inventory",
      open: 9.8,
      activity: -0.6,
      close: 9.2,
      notes: "Scrap improved; DOH down 4d",
    },
    { acct: "2000 AP", open: 12.1, activity: 0.8, close: 12.9, notes: "Terms extended by 5d" },
    {
      acct: "2400 Deferred Rev",
      open: 11.3,
      activity: 0.8,
      close: 12.1,
      notes: "Strong billings; recognition lag",
    },
    {
      acct: "2300 Accrued Exp",
      open: 7.2,
      activity: -0.7,
      close: 6.5,
      notes: "Bonus payout timing",
    },
  ],
  drivers: [
    { driver: "Price", impact: 2.1, confidence: "High" },
    { driver: "Volume", impact: 1.8, confidence: "High" },
    { driver: "Mix", impact: 1.4, confidence: "Med" },
    { driver: "FX", impact: -0.6, confidence: "Med" },
    { driver: "New Logos", impact: 0.9, confidence: "Med" },
    { driver: "Churn", impact: -0.9, confidence: "High" },
    { driver: "Timing (AP)", impact: 0.8, confidence: "High" },
    { driver: "Inventory Usage", impact: -0.6, confidence: "Med" },
  ],
  cf: [
    { label: "Net Income", val: 6.8 },
    { label: "Depreciation & Non‑cash", val: 1.1 },
    { label: "AR (Increase)", val: -0.8 },
    { label: "Inventory (Decrease)", val: 0.6 },
    { label: "AP (Increase)", val: 0.8 },
    { label: "Other WC", val: 0.9 },
  ],
  aiExplanations: [
    {
      acct: "4000 Revenue",
      delta: 4.7,
      driver: "Price ↑ / Volume ↑",
      conf: "High",
      owner: "Sales Ops",
      evidence: true,
      status: "Draft",
    },
    {
      acct: "1200 AR",
      delta: 0.8,
      driver: "Collections timing",
      conf: "Med",
      owner: "AR Lead",
      evidence: false,
      status: "Open",
    },
    {
      acct: "2400 Deferred Rev",
      delta: 0.8,
      driver: "Billings > Rev",
      conf: "High",
      owner: "RevOps",
      evidence: false,
      status: "Open",
    },
    {
      acct: "1400 Inventory",
      delta: -0.6,
      driver: "Usage/Obsolescence",
      conf: "Med",
      owner: "Ops Finance",
      evidence: true,
      status: "In Review",
    },
  ],
};

export default function FluxAnalysisPage() {
  const [materiality, setMateriality] = useState("default");
  const [excludeNoise, setExcludeNoise] = useState(false);
  const [activeView, setActiveView] = useState("is");
  const [aiMode, setAiMode] = useState("exec");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponses, setAiResponses] = useState<any[]>([]);
  const [priceSlider, setPriceSlider] = useState([1]);
  const [volumeSlider, setVolumeSlider] = useState([2]);
  const [fxSlider, setFxSlider] = useState([0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fmtMoney = (n: number) => `$${Math.abs(n).toFixed(1)}M`;
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;

  const getMaterialityThreshold = () => {
    if (materiality === "tight") return { amt: 0.25, pct: 0.03 };
    if (materiality === "loose") return { amt: 0.05, pct: 0.08 };
    return { amt: 0.1, pct: 0.05 };
  };

  const filterData = (rows: any[]) => {
    const mat = getMaterialityThreshold();
    return rows.filter((r) => {
      const d = r.actual - r.base;
      const pct = r.base ? d / r.base : 0;
      const isNoise = Math.abs(d) < mat.amt && Math.abs(pct) < mat.pct;
      return !excludeNoise || !isNoise;
    });
  };

  const getAIBullets = () => {
    if (aiMode === "exec") {
      return [
        {
          tone: "good",
          text: "Q3 up 9.8% ($4.7M); margin expanded; WC improved via AP terms and lower inventory.",
        },
        { tone: "bad", text: "AR grew +$0.8M; cash drag partly offset by AP +$0.8M." },
        { tone: "neu", text: "Focus: retention (churn -$0.9M) and EMEA FX (-$0.6M)." },
      ];
    } else if (aiMode === "analyst") {
      return [
        {
          tone: "neu",
          text: "Price realization +4.4%; elasticity stable; mix skew to Alpha/Beta.",
        },
        { tone: "good", text: "Inventory DOH ↓ 4d; usage variance favorable." },
        { tone: "bad", text: "Partner channel softness; monitor pipeline concentration." },
      ];
    } else {
      return [
        { tone: "neu", text: "Require evidence before closing items >$100k or >5%." },
        { tone: "good", text: "Auto-assign AR variance to AR Lead; due E+3." },
        { tone: "neu", text: "Enable policy check: repeat one-time flags in >2 periods." },
      ];
    }
  };

  const handleAsk = () => {
    if (!aiPrompt.trim()) return;
    const response = generateAIResponse(aiPrompt);
    setAiResponses([{ q: aiPrompt, a: response }, ...aiResponses]);
    setAiPrompt("");
  };

  const generateAIResponse = (q: string) => {
    if (/ar|receivable/i.test(q))
      return "AR increased $0.8M due to slower collections (DSO 43 → 45). Cash impact -$0.8M; trigger dunning on 7 accounts.";
    if (/price.*flat/i.test(q))
      return "Holding price flat reduces uplift by ~$2.1M; net would be +$2.6M (+5.4%) vs +$4.7M (+9.8%).";
    if (/bridge|working capital/i.test(q))
      return "WC bridge: AR -$0.8M, Inventory +$0.6M, AP +$0.8M → Net +$0.6M to CFO.";
    return "Key drivers: Price, Volume, Mix uplift; headwinds from FX and churn. Tighten collections and extend AP terms selectively.";
  };

  const calculateSensitivity = () => {
    const base = 48.2;
    const delta =
      base *
      ((priceSlider[0] / 100) * 0.45 + (volumeSlider[0] / 100) * 0.35 + (fxSlider[0] / 100) * -0.2);
    return delta;
  };

  useEffect(() => {
    if (activeView !== "cf") return;
    // Defer draw until after the "cf" tab is visible and laid out (canvas gets non-zero size)
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (canvasRef.current) drawCFBridge();
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [activeView]);

  const drawCFBridge = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const steps = DATA.cf;
    const pad = 20;
    const barW = ((rect.width - pad * 2) / steps.length) * 0.7;
    const gap = (rect.width - pad * 2) / steps.length - barW;

    let min = 0,
      max = 0,
      cum = 0;
    steps.forEach((s) => {
      cum += s.val;
      min = Math.min(min, cum, s.val < 0 ? cum - s.val : cum);
      max = Math.max(max, cum);
    });

    const range = max - min || 1;
    const y = (v: number) => rect.height - 40 - ((v - min) / range) * (rect.height - 80);

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, y(0));
    ctx.lineTo(rect.width - 16, y(0));
    ctx.stroke();

    cum = 0;
    let x = pad;
    steps.forEach((s) => {
      const from = cum;
      const to = cum + s.val;
      const top = Math.min(y(from), y(to));
      const h = Math.abs(y(from) - y(to));

      ctx.fillStyle = s.val >= 0 ? "#2c7aa1" : "#ef4444";
      roundRect(ctx, x, top, barW, h, 6);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.font = "11px Inter, system-ui";
      ctx.textAlign = "center";
      ctx.fillText(s.label, x + barW / 2, rect.height - 16);

      cum = to;
      x += barW + gap;
    });
  };

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="reports/analysis/flux-analysis" className="mb-1.5" />
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-[#000000] mt-2">Flux Analysis</h1>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              Export
            </Button>
            <Button
              className="text-xs sm:text-sm"
              size="sm"
              onClick={() => toast.success("Watch created for material items")}
            >
              Create Watch
            </Button>
          </div>
        </div>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-blue-100 text-[#205375] border-blue-200 font-bold">
                Flux Analysis
              </Badge>
              <Badge variant="outline" className="text-xs">
                Q2 2025 → Q3 2025
              </Badge>
              <Badge variant="outline" className="text-xs">
                Workspace: Q3 Close
              </Badge>
              <Badge variant="outline" className="text-xs">
                USD
              </Badge>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Label className="text-xs text-slate-600 whitespace-nowrap">Materiality</Label>
              <Select value={materiality} onValueChange={setMateriality}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">&gt;$100k or &gt;5%</SelectItem>
                  <SelectItem value="tight">&gt;$250k or &gt;3%</SelectItem>
                  <SelectItem value="loose">&gt;$50k or &gt;8%</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="noise"
                  checked={excludeNoise}
                  onCheckedChange={(c) => setExcludeNoise(c as boolean)}
                />
                <Label htmlFor="noise" className="text-xs text-slate-600 whitespace-nowrap">
                  Exclude noise
                </Label>
              </div>
            </div>
          </div>

          <main className="w-full py-4 overflow-x-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <Card className="p-4">
                <div className="text-xs text-slate-600 mb-1">Revenue</div>
                <div className="text-2xl font-bold">$52.9M</div>
                <div className="text-xs text-green-600 font-bold flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +9.8%
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-slate-600 mb-1">Gross Margin</div>
                <div className="text-2xl font-bold">$20.3M</div>
                <div className="text-xs text-green-600 font-bold flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +14.0%
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-slate-600 mb-1">Operating Cash Flow</div>
                <div className="text-2xl font-bold">$9.4M</div>
                <div className="text-xs text-green-600 font-bold flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +11.2%
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-slate-600 mb-1">Working Capital Δ</div>
                <div className="text-2xl font-bold">+$1.0M</div>
                <div className="text-xs text-slate-600">AR +$0.8M • Inv -$0.6M • AP +$0.8M</div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.95fr] gap-4">
              <div className="space-y-4 min-w-0">
                <Card className="p-4">
                  <Tabs value={activeView} onValueChange={setActiveView}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                      <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="is" className="text-xs">
                          Income Statement
                        </TabsTrigger>
                        <TabsTrigger value="bs" className="text-xs">
                          Balance Sheet
                        </TabsTrigger>
                        <TabsTrigger value="cf" className="text-xs">
                          Cash Flow Bridge
                        </TabsTrigger>
                      </TabsList>
                      <span className="text-xs text-slate-500">
                        Tip: click a row to drill to docs
                      </span>
                    </div>

                    <TabsContent value="is">
                      <h3 className="text-sm font-semibold text-[#205375] mb-2">IS Coverage</h3>
                      <div className="border rounded-lg overflow-x-auto">
                        <div className="min-w-[800px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="text-xs">Acct</TableHead>
                                <TableHead className="text-xs">Name</TableHead>
                                <TableHead className="text-xs">Base</TableHead>
                                <TableHead className="text-xs">Actual</TableHead>
                                <TableHead className="text-xs">Δ</TableHead>
                                <TableHead className="text-xs">Δ%</TableHead>
                                <TableHead className="text-xs">Driver</TableHead>
                                <TableHead className="text-xs">Owner</TableHead>
                                <TableHead className="text-xs">Evidence</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filterData(DATA.is).map((row, idx) => {
                                const delta = row.actual - row.base;
                                const pct = row.base ? delta / row.base : 0;
                                return (
                                  <TableRow key={idx} className="cursor-pointer hover:bg-slate-50">
                                    <TableCell className="text-xs">{row.acct}</TableCell>
                                    <TableCell className="text-xs">{row.name}</TableCell>
                                    <TableCell className="text-xs">{fmtMoney(row.base)}</TableCell>
                                    <TableCell className="text-xs">
                                      {fmtMoney(row.actual)}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      {delta >= 0 ? "+" : ""}
                                      {fmtMoney(delta)}
                                    </TableCell>
                                    <TableCell className="text-xs">{fmtPct(pct)}</TableCell>
                                    <TableCell className="text-xs">
                                      <Badge variant="outline" className="text-xs">
                                        {row.driver}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">{row.owner}</TableCell>
                                    <TableCell className="text-xs">
                                      {row.evidence ? (
                                        <Badge variant="outline" className="text-xs">
                                          Attached
                                        </Badge>
                                      ) : (
                                        <Button variant="ghost" size="sm" className="h-6 text-xs">
                                          Attach
                                        </Button>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                                        {row.status}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="bs">
                      <h3 className="text-sm font-semibold text-[#205375] mb-2">BS Coverage</h3>
                      <div className="border rounded-lg overflow-x-auto mb-4">
                        <div className="min-w-[800px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="text-xs">Acct</TableHead>
                                <TableHead className="text-xs">Name</TableHead>
                                <TableHead className="text-xs">Base</TableHead>
                                <TableHead className="text-xs">Actual</TableHead>
                                <TableHead className="text-xs">Δ</TableHead>
                                <TableHead className="text-xs">Δ%</TableHead>
                                <TableHead className="text-xs">Driver</TableHead>
                                <TableHead className="text-xs">Owner</TableHead>
                                <TableHead className="text-xs">Evidence</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filterData(DATA.bs).map((row, idx) => {
                                const delta = row.actual - row.base;
                                const pct = row.base ? delta / row.base : 0;
                                return (
                                  <TableRow key={idx} className="cursor-pointer hover:bg-slate-50">
                                    <TableCell className="text-xs">{row.acct}</TableCell>
                                    <TableCell className="text-xs">{row.name}</TableCell>
                                    <TableCell className="text-xs">{fmtMoney(row.base)}</TableCell>
                                    <TableCell className="text-xs">
                                      {fmtMoney(row.actual)}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      {delta >= 0 ? "+" : ""}
                                      {fmtMoney(delta)}
                                    </TableCell>
                                    <TableCell className="text-xs">{fmtPct(pct)}</TableCell>
                                    <TableCell className="text-xs">
                                      <Badge variant="outline" className="text-xs">
                                        {row.driver}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">{row.owner}</TableCell>
                                    <TableCell className="text-xs">
                                      {row.evidence ? (
                                        <Badge variant="outline" className="text-xs">
                                          Attached
                                        </Badge>
                                      ) : (
                                        <Button variant="ghost" size="sm" className="h-6 text-xs">
                                          Attach
                                        </Button>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                                        {row.status}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-[#2c7aa1] mb-2">
                        Balance Sheet Roll-forward (Q2 → Q3)
                      </h3>
                      <div className="border rounded-lg overflow-x-auto">
                        <div className="min-w-[600px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="text-xs">Account</TableHead>
                                <TableHead className="text-xs">Opening</TableHead>
                                <TableHead className="text-xs">Activity</TableHead>
                                <TableHead className="text-xs">Closing</TableHead>
                                <TableHead className="text-xs">Notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {DATA.bsRoll.map((row, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="text-xs">{row.acct}</TableCell>
                                  <TableCell className="text-xs">{fmtMoney(row.open)}</TableCell>
                                  <TableCell className="text-xs">
                                    {row.activity >= 0 ? "+" : ""}
                                    {fmtMoney(row.activity)}
                                  </TableCell>
                                  <TableCell className="text-xs">{fmtMoney(row.close)}</TableCell>
                                  <TableCell className="text-xs text-slate-600">
                                    {row.notes}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="cf">
                      <h3 className="text-sm font-semibold text-[#205375] mb-3">
                        Operating Cash Flow Bridge
                      </h3>
                      <div className="overflow-x-auto mb-3">
                        <canvas
                          ref={canvasRef}
                          className="w-full min-w-[600px] h-[300px] border border-dashed border-blue-200 rounded-lg bg-gradient-to-b from-white to-slate-50"
                        />
                      </div>
                      <div className="border rounded-lg overflow-x-auto">
                        <div className="min-w-[400px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="text-xs">Component</TableHead>
                                <TableHead className="text-xs">Impact ($M)</TableHead>
                                <TableHead className="text-xs">Notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {DATA.cf.map((row, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="text-xs">{row.label}</TableCell>
                                  <TableCell className="text-xs">
                                    {row.val >= 0 ? "+" : ""}
                                    {fmtMoney(row.val)}
                                  </TableCell>
                                  <TableCell className="text-xs"></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>

                <Card className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                    <h3 className="text-sm font-semibold">Top Drivers (All Accounts)</h3>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        Rate × Volume
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Price × Volume × Mix × FX
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Timing / One‑time
                      </Badge>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-x-auto">
                    <div className="min-w-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-xs">Driver</TableHead>
                            <TableHead className="text-xs">Impact ($)</TableHead>
                            <TableHead className="text-xs">Impact (%)</TableHead>
                            <TableHead className="text-xs">Confidence</TableHead>
                            <TableHead className="text-xs">Trend</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {DATA.drivers.map((row, idx) => {
                            const pct = row.impact / 48.2;
                            return (
                              <TableRow key={idx}>
                                <TableCell className="text-xs">{row.driver}</TableCell>
                                <TableCell className="text-xs">
                                  {row.impact >= 0 ? "+" : ""}
                                  {fmtMoney(row.impact)}
                                </TableCell>
                                <TableCell className="text-xs">{fmtPct(pct)}</TableCell>
                                <TableCell className="text-xs">
                                  <Badge variant="outline" className="text-xs">
                                    {row.confidence}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs">
                                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#205375] to-[#2c7aa1]"
                                      style={{ width: `${Math.min(100, Math.abs(pct * 220))}%` }}
                                    />
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </Card>
              </div>

              <aside className="space-y-4 min-w-0">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">AI Analysis – MeeruAI</h3>
                    <div className="flex gap-1">
                      <Button
                        variant={aiMode === "exec" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setAiMode("exec")}
                      >
                        Exec
                      </Button>
                      <Button
                        variant={aiMode === "analyst" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setAiMode("analyst")}
                      >
                        Analyst
                      </Button>
                      <Button
                        variant={aiMode === "controller" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setAiMode("controller")}
                      >
                        Controller
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    {aiResponses.map((resp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex gap-2 items-start">
                          <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                          <div className="text-xs">
                            <strong>Q:</strong> {resp.q}
                          </div>
                        </div>
                        <div className="flex gap-2 items-start">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                          <div className="text-xs">
                            <strong>A:</strong> {resp.a}
                          </div>
                        </div>
                      </div>
                    ))}

                    {getAIBullets().map((bullet, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                            bullet.tone === "good"
                              ? "bg-green-500"
                              : bullet.tone === "bad"
                                ? "bg-red-500"
                                : "bg-slate-400"
                          )}
                        />
                        <div className="text-xs">{bullet.text}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mb-2">
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ask: Explain AR increase and cash impact"
                      className="min-h-[44px] text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAsk();
                        }
                      }}
                    />
                    <Button onClick={handleAsk}>Ask</Button>
                  </div>
                  <div className="text-xs text-slate-500">
                    Examples: "Classify drivers for G&A" • "What if price held flat?" • "Recreate WC
                    bridge"
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3">AI Proposed Explanations</h3>
                  <div className="border rounded-lg overflow-x-auto">
                    <div className="min-w-[700px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-xs">Account</TableHead>
                            <TableHead className="text-xs">Δ$</TableHead>
                            <TableHead className="text-xs">Driver</TableHead>
                            <TableHead className="text-xs">Confidence</TableHead>
                            <TableHead className="text-xs">Owner</TableHead>
                            <TableHead className="text-xs">Evidence</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {DATA.aiExplanations.map((row, idx) => (
                            <TableRow key={idx} className="text-xs">
                              <TableCell>{row.acct}</TableCell>
                              <TableCell>
                                {row.delta >= 0 ? "+" : ""}
                                {fmtMoney(row.delta)}
                              </TableCell>
                              <TableCell>{row.driver}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {row.conf}
                                </Badge>
                              </TableCell>
                              <TableCell>{row.owner}</TableCell>
                              <TableCell>
                                {row.evidence ? (
                                  <Badge variant="outline" className="text-xs">
                                    Attached
                                  </Badge>
                                ) : (
                                  <Button variant="ghost" size="sm" className="h-5 text-xs">
                                    Attach
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" className="h-5 text-xs">
                                  Mark done
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Sensitivity</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs text-slate-600">Price ±</Label>
                        <span className="text-xs">
                          {priceSlider[0] >= 0 ? "+" : ""}
                          {priceSlider[0].toFixed(1)}%
                        </span>
                      </div>
                      <Slider
                        value={priceSlider}
                        onValueChange={setPriceSlider}
                        min={-5}
                        max={5}
                        step={0.5}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs text-slate-600">Volume ±</Label>
                        <span className="text-xs">
                          {volumeSlider[0] >= 0 ? "+" : ""}
                          {volumeSlider[0]}%
                        </span>
                      </div>
                      <Slider
                        value={volumeSlider}
                        onValueChange={setVolumeSlider}
                        min={-10}
                        max={10}
                        step={1}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs text-slate-600">FX ±</Label>
                        <span className="text-xs">
                          {fxSlider[0] >= 0 ? "+" : ""}
                          {fxSlider[0].toFixed(1)}%
                        </span>
                      </div>
                      <Slider
                        value={fxSlider}
                        onValueChange={setFxSlider}
                        min={-3}
                        max={3}
                        step={0.5}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-slate-600">Projected Δ Revenue:</span>
                      <span className="text-xs font-semibold">
                        {calculateSensitivity() >= 0 ? "+" : ""}${calculateSensitivity().toFixed(1)}
                        M
                      </span>
                    </div>
                  </div>
                </Card>
              </aside>
            </div>

            <div className="text-center text-xs text-slate-500 mt-6">
              Confidential – MeeruAI • Mock UI (HTML only) – V3
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
