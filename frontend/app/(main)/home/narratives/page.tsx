"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { BookOpenText, Sparkles, FileText, Clock, CheckCircle2, Send, Eye } from "lucide-react";

type NarrativeStatus = "draft" | "review" | "approved" | "published";
type NarrativeType = "variance" | "close" | "cashflow" | "leakage";

interface Narrative {
  id: string;
  title: string;
  type: NarrativeType;
  generatedAt: string;
  period: string;
  status: NarrativeStatus;
  summary: string;
  fullContent: string;
  generatedBy: "ai" | "manual";
  reviewedBy: string | null;
  metrics: { totalVariance: number; keyDrivers: string[]; accuracy: number };
}

const MOCK_NARRATIVES: Narrative[] = [
  {
    id: "NAR-001",
    title: "Q4 2025 Revenue Variance Commentary",
    type: "variance",
    generatedAt: "2026-01-15T10:30:00Z",
    period: "Q4 2025",
    status: "published",
    summary: "Revenue exceeded forecast by 4.2% driven by strong SaaS renewals and new enterprise deals in APAC region.",
    fullContent: "## Revenue Variance Analysis — Q4 2025\n\nTotal revenue of **$48.3M** exceeded the forecast of **$46.4M** by **$1.9M (4.2%)**.\n\n### Key Drivers\n1. **SaaS Renewals (+$1.2M)**: Net retention rate improved to 112%, driven by successful upselling of premium tiers.\n2. **New Enterprise Deals (+$0.9M)**: Three large enterprise contracts closed in APAC (Tata Steel, Infosys, Reliance).\n3. **Professional Services (-$0.2M)**: Slight miss due to delayed implementation start dates.\n\n### Outlook\nQ1 2026 pipeline stands at $52M with 65% probability-weighted coverage. Key risk is FX headwinds from EUR/USD movement.",
    generatedBy: "ai",
    reviewedBy: "Sarah Chen",
    metrics: { totalVariance: 1900000, keyDrivers: ["SaaS Renewals", "Enterprise APAC", "Services Timing"], accuracy: 94 },
  },
  {
    id: "NAR-002",
    title: "January 2026 Close Summary",
    type: "close",
    generatedAt: "2026-02-03T14:00:00Z",
    period: "Jan 2026",
    status: "approved",
    summary: "Month-end close completed in 4.2 days (target: 5 days). All reconciliations cleared. 2 adjusting entries booked.",
    fullContent: "## January 2026 Close Summary\n\nClose completed on **Feb 3** — **4.2 business days** (target: 5.0 days).\n\n### Reconciliation Status\n- **Bank Reconciliations**: 12/12 completed, 0 exceptions\n- **Intercompany**: 8/8 cleared, net balance $0\n- **Subledger-to-GL**: All tied, AR variance < $500\n\n### Adjusting Entries\n1. **JE-2026-0142**: Accrued revenue for milestone delivery ($340K)\n2. **JE-2026-0143**: Reclassification of prepaid software ($85K)\n\n### Action Items\n- Follow up on aged AP invoice from Vendor #4421 ($12K, 45 days)\n- Review FX translation impact for EUR subsidiary",
    generatedBy: "ai",
    reviewedBy: "Michael Torres",
    metrics: { totalVariance: 0, keyDrivers: ["On-time close", "Zero exceptions", "2 adjustments"], accuracy: 97 },
  },
  {
    id: "NAR-003",
    title: "Cash Flow Forecast — Week 7-8 2026",
    type: "cashflow",
    generatedAt: "2026-02-10T09:00:00Z",
    period: "W7-W8 2026",
    status: "review",
    summary: "Projected net cash position of $12.4M by end of Week 8. Collections expected at $8.2M; disbursements at $6.1M.",
    fullContent: "## 2-Week Cash Flow Forecast\n\n### Projected Position\n| | Week 7 | Week 8 |\n|---|---|---|\n| Opening Balance | $10.3M | $11.2M |\n| Collections | $4.1M | $4.1M |\n| Disbursements | -$3.2M | -$2.9M |\n| **Closing Balance** | **$11.2M** | **$12.4M** |\n\n### Key Inflows\n- Amazon settlement: $1.8M (Week 7)\n- Quarterly SaaS billing cycle: $2.3M (Week 8)\n\n### Key Outflows\n- Payroll: $1.9M (Week 7)\n- AWS hosting: $0.8M (Week 8)\n- Vendor payments: $1.2M (Week 7)\n\n### Risk Flag\nIf Amazon payment delays beyond Week 7, minimum balance drops to $9.4M (above $5M threshold).",
    generatedBy: "ai",
    reviewedBy: null,
    metrics: { totalVariance: 2100000, keyDrivers: ["Amazon settlement", "SaaS billing", "Payroll"], accuracy: 88 },
  },
  {
    id: "NAR-004",
    title: "Revenue Leakage Detection — Feb 2026",
    type: "leakage",
    generatedAt: "2026-02-12T16:00:00Z",
    period: "Feb 2026",
    status: "draft",
    summary: "AI detected 14 potential leakage signals totaling $2.1M. 3 high-severity cases flagged for immediate review.",
    fullContent: "## Revenue Leakage Detection Report — February 2026\n\n### Summary\n- **Total signals detected**: 14\n- **Estimated leakage**: $2.1M\n- **High severity**: 3 cases\n- **Medium severity**: 7 cases\n- **Low severity**: 4 cases\n\n### High Severity Cases\n1. **CASE-2026-089**: Underpriced contract renewal for GlobalTech ($450K gap vs. standard rates)\n2. **CASE-2026-091**: Missing usage-based billing for CloudFirst ($380K unbilled overage)\n3. **CASE-2026-094**: Duplicate credit memo applied to TechCorp account ($290K)\n\n### Top Patterns\n- **Price erosion**: 5 cases where renewal rates dropped >10% without approval\n- **Unbilled usage**: 4 cases where metered services exceeded contract caps\n- **Credit anomalies**: 3 cases with unusual credit/refund patterns\n\n### Recommended Actions\n1. Escalate high-severity cases to Revenue Ops\n2. Audit all renewals with >5% price reduction\n3. Review credit approval workflow thresholds",
    generatedBy: "ai",
    reviewedBy: null,
    metrics: { totalVariance: 2100000, keyDrivers: ["Price erosion", "Unbilled usage", "Credit anomalies"], accuracy: 91 },
  },
  {
    id: "NAR-005",
    title: "Q3 2025 Flux Analysis Commentary",
    type: "variance",
    generatedAt: "2025-10-08T11:00:00Z",
    period: "Q3 2025",
    status: "published",
    summary: "Operating expenses increased 6.8% QoQ primarily due to headcount growth and cloud infrastructure scaling.",
    fullContent: "## Q3 2025 Flux Analysis\n\n### Operating Expenses: $32.1M (+6.8% QoQ)\n\n#### Personnel (+$1.4M, +8.2%)\n- 22 new hires across Engineering and Sales\n- Annual merit increases effective July 1\n- Stock compensation increase from new grants\n\n#### Cloud & Infrastructure (+$0.6M, +12%)\n- Scaled AWS instances for new product launch\n- Added redundancy in EU region\n- One-time migration cost ($120K)\n\n#### T&E (-$0.1M, -5%)\n- Seasonal decline in travel (summer)\n\n### Conclusion\nExpense growth is aligned with strategic investment plan. YTD OpEx is 2% under budget.",
    generatedBy: "ai",
    reviewedBy: "Sarah Chen",
    metrics: { totalVariance: 1900000, keyDrivers: ["Headcount", "Cloud scaling", "Merit increases"], accuracy: 96 },
  },
];

function statusBadge(status: NarrativeStatus) {
  const map: Record<NarrativeStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    draft: { label: "Draft", variant: "outline" },
    review: { label: "In Review", variant: "secondary" },
    approved: { label: "Approved", variant: "default" },
    published: { label: "Published", variant: "default" },
  };
  return map[status];
}

function typeBadge(type: NarrativeType) {
  const map: Record<NarrativeType, { label: string; color: string }> = {
    variance: { label: "Variance", color: "bg-blue-100 text-blue-800 border-blue-200" },
    close: { label: "Close", color: "bg-green-100 text-green-800 border-green-200" },
    cashflow: { label: "Cash Flow", color: "bg-purple-100 text-purple-800 border-purple-200" },
    leakage: { label: "Leakage", color: "bg-amber-100 text-amber-800 border-amber-200" },
  };
  return map[type];
}

export default function NarrativesPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedNarrative, setSelectedNarrative] = useState<Narrative | null>(null);

  const filtered = MOCK_NARRATIVES.filter((n) => {
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (statusFilter !== "all" && n.status !== statusFilter) return false;
    return true;
  });

  const kpis = {
    total: MOCK_NARRATIVES.length,
    aiGenerated: MOCK_NARRATIVES.filter((n) => n.generatedBy === "ai").length,
    pendingReview: MOCK_NARRATIVES.filter((n) => n.status === "review" || n.status === "draft").length,
    published: MOCK_NARRATIVES.filter((n) => n.status === "published").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Narratives</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-generated financial commentary and reports</p>
        </div>
        <Button>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Narrative
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 stagger-children">
        <Card className="card-interactive">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50"><BookOpenText className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{kpis.total}</p>
                <p className="text-xs text-muted-foreground">Total Narratives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50"><Sparkles className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{kpis.aiGenerated}</p>
                <p className="text-xs text-muted-foreground">AI Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50"><Clock className="w-5 h-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold">{kpis.pendingReview}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{kpis.published}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Type:</span>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="variance">Variance</SelectItem>
                  <SelectItem value="close">Close</SelectItem>
                  <SelectItem value="cashflow">Cash Flow</SelectItem>
                  <SelectItem value="leakage">Leakage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Narratives Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{filtered.length} narrative{filtered.length !== 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((n) => {
                const tb = typeBadge(n.type);
                const sb = statusBadge(n.status);
                return (
                  <TableRow
                    key={n.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedNarrative(n)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">{n.summary}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tb.color}`}>
                        {tb.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{n.period}</TableCell>
                    <TableCell><Badge variant={sb.variant}>{sb.label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        {n.generatedBy === "ai" && <Sparkles className="w-3 h-3 text-purple-500" />}
                        {new Date(n.generatedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                            style={{ width: `${n.metrics.accuracy}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{n.metrics.accuracy}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Narrative Detail Sheet */}
      <Sheet open={!!selectedNarrative} onOpenChange={(open) => !open && setSelectedNarrative(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {selectedNarrative && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${typeBadge(selectedNarrative.type).color}`}>
                    {typeBadge(selectedNarrative.type).label}
                  </span>
                  <Badge variant={statusBadge(selectedNarrative.status).variant}>
                    {statusBadge(selectedNarrative.status).label}
                  </Badge>
                  {selectedNarrative.generatedBy === "ai" && (
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="w-3 h-3" /> AI Generated
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-lg">{selectedNarrative.title}</SheetTitle>
                <SheetDescription>{selectedNarrative.period} &middot; Generated {new Date(selectedNarrative.generatedAt).toLocaleDateString()}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Key Drivers */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Key Drivers</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNarrative.metrics.keyDrivers.map((d) => (
                      <span key={d} className="text-xs font-mono bg-blue-50 border border-blue-200 rounded px-2 py-0.5">{d}</span>
                    ))}
                  </div>
                </div>

                {/* Full Content */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Narrative Content</h3>
                  <div className="bg-slate-50 border rounded-lg p-4 prose prose-sm max-w-none">
                    {selectedNarrative.fullContent.split("\n").map((line, i) => {
                      if (line.startsWith("## ")) return <h2 key={i} className="text-base font-bold mt-3 mb-1">{line.replace("## ", "")}</h2>;
                      if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-semibold mt-2 mb-1">{line.replace("### ", "")}</h3>;
                      if (line.startsWith("#### ")) return <h4 key={i} className="text-sm font-medium mt-1.5 mb-0.5">{line.replace("#### ", "")}</h4>;
                      if (line.startsWith("- ")) return <li key={i} className="text-sm text-muted-foreground ml-4">{line.replace("- ", "")}</li>;
                      if (line.startsWith("| ")) return <p key={i} className="text-xs font-mono text-muted-foreground">{line}</p>;
                      if (line.trim() === "") return <br key={i} />;
                      return <p key={i} className="text-sm text-muted-foreground">{line}</p>;
                    })}
                  </div>
                </div>

                {/* Review Info */}
                {selectedNarrative.reviewedBy && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Reviewed by <span className="font-medium text-foreground">{selectedNarrative.reviewedBy}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {selectedNarrative.status === "draft" && (
                    <Button size="sm"><Send className="w-4 h-4 mr-1.5" /> Submit for Review</Button>
                  )}
                  {selectedNarrative.status === "review" && (
                    <Button size="sm"><CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve</Button>
                  )}
                  {selectedNarrative.status === "approved" && (
                    <Button size="sm"><Send className="w-4 h-4 mr-1.5" /> Publish</Button>
                  )}
                  <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-1.5" /> Export PDF</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
