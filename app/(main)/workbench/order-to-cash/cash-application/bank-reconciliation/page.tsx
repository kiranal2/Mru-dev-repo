"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BankLineMatchStatus =
  | "LINKED"
  | "UNLINKED"
  | "MULTI_MATCH"
  | "AMOUNT_MISMATCH"
  | "SETTLEMENT_PENDING";

type BankLineRecord = {
  bank_line_id: string;
  bank_date: string;
  amount: number;
  currency: string;
  bank_ref: string;
  bank_account_id: string;
  bank_account_label: string;
  payer_hint?: string;
  source_type: "ACH" | "WIRE" | "LOCKBOX" | "CHECK" | "CARD";
  settlement_state: "FINAL" | "PRELIMINARY";
  final_settlement_confirmed: boolean;
  match_status: BankLineMatchStatus;
  risk_flags: string[];
  linked_payment_id?: string;
  candidate_payment_ids?: string[];
  notes?: string;
};

type PaymentRecord = {
  payment_id: string;
  customer: string;
  payer_name: string;
  payment_date: string;
  amount: number;
  status: "AutoMatched" | "Exception" | "PendingToPost" | "Posted" | "SettlementPending";
  match_type: "Exact" | "WithinTolerance";
  netsuite_payment_id?: string;
  netsuite_je_id?: string;
  posted_flag: boolean;
  posting_batch_id?: string;
  remittance_present: boolean;
};

type ReconSummary = {
  bank_account_id: string;
  bank_account_label: string;
  total_count: number;
  total_amount: number;
  linked_count: number;
  unlinked_count: number;
  settlement_pending_count: number;
  high_risk_count: number;
};

type BankLineStatusFilter =
  | "all"
  | "linked"
  | "unlinked"
  | "multi-match"
  | "mismatch"
  | "settlement-pending";

type DateRange = "7d" | "30d" | "90d";

const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US");

const BANK_ACCOUNTS = [
  { id: "ba-001", label: "US Bank - *****4521" },
  { id: "ba-002", label: "Chase - *****7892" },
  { id: "ba-003", label: "Wells Fargo - *****3456" },
  { id: "ba-004", label: "Bank of America - *****9012" },
];

const CUSTOMERS = [
  "Nova Services",
  "Global Retail Group",
  "Acme Logistics",
  "Walmart INC",
  "Skyline Media",
];

const makeDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  date.setHours(9, 0, 0, 0);
  return date.toISOString().split("T")[0];
};

const generatePaymentRecords = (): PaymentRecord[] => {
  const payments: PaymentRecord[] = [];
  for (let i = 0; i < 26; i += 1) {
    const posted = i % 4 === 0 || i % 5 === 0;
    payments.push({
      payment_id: `PMT-2026-${(1000 + i).toString()}`,
      customer: CUSTOMERS[i % CUSTOMERS.length],
      payer_name: CUSTOMERS[(i + 1) % CUSTOMERS.length],
      payment_date: makeDate(i % 25),
      amount: 15000 + ((i * 2900) % 65000),
      status: posted ? "Posted" : i % 3 === 0 ? "PendingToPost" : "Exception",
      match_type: i % 2 === 0 ? "Exact" : "WithinTolerance",
      netsuite_payment_id: posted ? `NS-PAY-${7000 + i}` : undefined,
      netsuite_je_id: i % 6 === 0 ? `NS-JE-${9000 + i}` : undefined,
      posted_flag: posted,
      posting_batch_id: posted ? `BATCH-${200 + i}` : undefined,
      remittance_present: i % 5 !== 0,
    });
  }
  return payments;
};

const generateBankLines = (paymentRecords: PaymentRecord[]): BankLineRecord[] => {
  const statusPool: BankLineMatchStatus[] = [
    ...Array(10).fill("LINKED"),
    ...Array(8).fill("UNLINKED"),
    ...Array(6).fill("MULTI_MATCH"),
    ...Array(6).fill("AMOUNT_MISMATCH"),
    ...Array(6).fill("SETTLEMENT_PENDING"),
    ...Array(6).fill("LINKED"),
  ];

  return statusPool.map((status, idx) => {
    const account = BANK_ACCOUNTS[idx % BANK_ACCOUNTS.length];
    const ref = `BNK-${2026}${(10000 + idx).toString()}`;
    const payment = paymentRecords[idx % paymentRecords.length];
    const candidateIds = [
      payment.payment_id,
      paymentRecords[(idx + 3) % paymentRecords.length].payment_id,
      paymentRecords[(idx + 5) % paymentRecords.length].payment_id,
    ];
    const isPrelim = status === "SETTLEMENT_PENDING";
    const riskFlags =
      status === "AMOUNT_MISMATCH"
        ? ["AMOUNT_VARIANCE"]
        : status === "MULTI_MATCH"
          ? ["DUPLICATE_REF"]
          : status === "SETTLEMENT_PENDING"
            ? ["NO_FINAL_FILE"]
            : idx % 9 === 0
              ? ["STALE_AGE"]
              : [];

    return {
      bank_line_id: `BL-${9000 + idx}`,
      bank_date: makeDate(idx % 30),
      amount: 14000 + ((idx * 3700) % 80000),
      currency: "USD",
      bank_ref: ref + (idx % 5 === 0 ? `-LONGREF-${idx}-${idx + 4}` : ""),
      bank_account_id: account.id,
      bank_account_label: account.label,
      payer_hint: CUSTOMERS[idx % CUSTOMERS.length],
      source_type: (["ACH", "WIRE", "LOCKBOX", "CHECK", "CARD"] as const)[idx % 5],
      settlement_state: isPrelim ? "PRELIMINARY" : "FINAL",
      final_settlement_confirmed: !isPrelim,
      match_status: status,
      risk_flags: riskFlags,
      linked_payment_id:
        status === "LINKED" || status === "AMOUNT_MISMATCH" ? payment.payment_id : undefined,
      candidate_payment_ids: status === "MULTI_MATCH" ? candidateIds : undefined,
      notes: status === "AMOUNT_MISMATCH" ? "Amount does not match bank line" : undefined,
    };
  });
};

const getStatusLabel = (status: BankLineMatchStatus) => {
  switch (status) {
    case "LINKED":
      return "Linked";
    case "UNLINKED":
      return "Unlinked";
    case "MULTI_MATCH":
      return "Multi-match";
    case "AMOUNT_MISMATCH":
      return "Mismatch";
    case "SETTLEMENT_PENDING":
      return "Settlement Pending";
    default:
      return status;
  }
};

const getStatusBadge = (status: BankLineMatchStatus) => {
  switch (status) {
    case "LINKED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "UNLINKED":
      return "bg-slate-100 text-slate-700 border-slate-300";
    case "MULTI_MATCH":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "AMOUNT_MISMATCH":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "SETTLEMENT_PENDING":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
};

const getStatusAction = (status: BankLineMatchStatus) => {
  switch (status) {
    case "LINKED":
      return "View";
    case "UNLINKED":
      return "Link";
    case "MULTI_MATCH":
      return "Review";
    case "AMOUNT_MISMATCH":
      return "Investigate";
    case "SETTLEMENT_PENDING":
      return "Track";
    default:
      return "Open";
  }
};

export default function BankReconciliationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentIdParam = searchParams?.get("paymentId") || "";

  const [bankLines, setBankLines] = useState<BankLineRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [bankAccountFilter, setBankAccountFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<BankLineStatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [search, setSearch] = useState<string>(paymentIdParam);
  const [activeTab, setActiveTab] = useState("bank-lines");
  const [isLoading, setIsLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBankLine, setActiveBankLine] = useState<BankLineRecord | null>(null);
  const [unlinkedSearch, setUnlinkedSearch] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("");

  useEffect(() => {
    const payments = generatePaymentRecords();
    setPaymentRecords(payments);
    setBankLines(generateBankLines(payments));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, [activeTab]);

  const paymentIndex = useMemo(() => {
    return paymentRecords.reduce<Record<string, PaymentRecord>>((acc, record) => {
      acc[record.payment_id] = record;
      return acc;
    }, {});
  }, [paymentRecords]);

  const accountOptions = useMemo(() => {
    const labels = new Map(BANK_ACCOUNTS.map((account) => [account.id, account.label]));
    const items = bankLines.map((line) => line.bank_account_id);
    const unique = Array.from(new Set(items));
    return [
      { id: "all", label: "All Bank Accounts" },
      ...unique.map((id) => ({ id, label: labels.get(id) || id })),
    ];
  }, [bankLines]);

  const dateCutoff = useMemo(() => {
    const now = new Date();
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    now.setDate(now.getDate() - days);
    return now;
  }, [dateRange]);

  const filteredBankLines = useMemo(() => {
    return bankLines.filter((line) => {
      if (bankAccountFilter !== "all" && line.bank_account_id !== bankAccountFilter) return false;
      if (
        statusFilter !== "all" &&
        line.match_status !== statusFilter.toUpperCase().replace("-", "_")
      )
        return false;
      const lineDate = new Date(line.bank_date);
      if (lineDate < dateCutoff) return false;
      if (search) {
        const term = search.toLowerCase();
        if (
          !line.bank_ref.toLowerCase().includes(term) &&
          !line.bank_line_id.toLowerCase().includes(term) &&
          !(line.linked_payment_id || "").toLowerCase().includes(term) &&
          !(line.payer_hint || "").toLowerCase().includes(term)
        ) {
          return false;
        }
      }
      if (paymentIdParam && line.linked_payment_id !== paymentIdParam) return false;
      return true;
    });
  }, [bankLines, bankAccountFilter, statusFilter, dateCutoff, search, paymentIdParam]);

  const reconSummary = useMemo(() => {
    const byAccount: Record<string, ReconSummary> = {};
    bankLines.forEach((line) => {
      if (!byAccount[line.bank_account_id]) {
        byAccount[line.bank_account_id] = {
          bank_account_id: line.bank_account_id,
          bank_account_label: line.bank_account_label,
          total_count: 0,
          total_amount: 0,
          linked_count: 0,
          unlinked_count: 0,
          settlement_pending_count: 0,
          high_risk_count: 0,
        };
      }
      const summary = byAccount[line.bank_account_id];
      summary.total_count += 1;
      summary.total_amount += line.amount;
      if (line.match_status === "LINKED") summary.linked_count += 1;
      if (line.match_status === "UNLINKED") summary.unlinked_count += 1;
      if (line.match_status === "SETTLEMENT_PENDING") summary.settlement_pending_count += 1;
      if (line.risk_flags.length > 0 || line.match_status === "AMOUNT_MISMATCH")
        summary.high_risk_count += 1;
    });
    return Object.values(byAccount);
  }, [bankLines]);

  const summaryStrip = useMemo(() => {
    const linked = filteredBankLines.filter((line) => line.match_status === "LINKED");
    const unlinked = filteredBankLines.filter((line) => line.match_status === "UNLINKED");
    const settlementPending = filteredBankLines.filter(
      (line) => line.match_status === "SETTLEMENT_PENDING"
    );
    const highRisk = filteredBankLines.filter(
      (line) => line.risk_flags.length > 0 || line.match_status === "AMOUNT_MISMATCH"
    );
    return [
      {
        label: "Linked",
        count: linked.length,
        amount: linked.reduce((sum, line) => sum + line.amount, 0),
      },
      {
        label: "Unlinked",
        count: unlinked.length,
        amount: unlinked.reduce((sum, line) => sum + line.amount, 0),
      },
      {
        label: "Settlement Pending",
        count: settlementPending.length,
        amount: settlementPending.reduce((sum, line) => sum + line.amount, 0),
      },
      {
        label: "High Risk",
        count: highRisk.length,
        amount: highRisk.reduce((sum, line) => sum + line.amount, 0),
      },
    ];
  }, [filteredBankLines]);

  const postingReadinessRows = useMemo(() => {
    return filteredBankLines.map((line) => {
      const payment = line.linked_payment_id ? paymentIndex[line.linked_payment_id] : undefined;
      const erpReady =
        line.match_status === "LINKED" &&
        (payment?.posted_flag ||
          (payment?.status === "PendingToPost" && payment?.posting_batch_id));
      const netSuiteReady =
        erpReady &&
        !!line.bank_ref &&
        line.final_settlement_confirmed &&
        line.match_status !== "AMOUNT_MISMATCH";
      const blockingReason = erpReady
        ? netSuiteReady
          ? "—"
          : "Settlement not final"
        : line.match_status === "UNLINKED"
          ? "Unlinked bank line"
          : line.match_status === "MULTI_MATCH"
            ? "Multiple candidates"
            : line.match_status === "AMOUNT_MISMATCH"
              ? "Amount mismatch"
              : "Payment not posted";
      return {
        line,
        payment,
        erpReady,
        netSuiteReady,
        blockingReason,
      };
    });
  }, [filteredBankLines, paymentIndex]);

  const candidatePayments = useMemo(() => {
    if (!activeBankLine) return [];
    const ids = activeBankLine.candidate_payment_ids || [];
    return ids.map((id) => paymentIndex[id]).filter(Boolean);
  }, [activeBankLine, paymentIndex]);

  const unlinkedCandidates = useMemo(() => {
    if (!activeBankLine) return [];
    const term = unlinkedSearch.toLowerCase();
    const filtered = paymentRecords.filter((record) => {
      if (!term) return true;
      return (
        record.payment_id.toLowerCase().includes(term) ||
        record.customer.toLowerCase().includes(term) ||
        record.payer_name.toLowerCase().includes(term)
      );
    });
    return filtered.slice(0, 5);
  }, [activeBankLine, paymentRecords, unlinkedSearch]);

  const openDrawer = (line: BankLineRecord) => {
    setActiveBankLine(line);
    setSelectedPaymentId(line.linked_payment_id || "");
    setDrawerOpen(true);
  };

  const updateBankLine = (id: string, updates: Partial<BankLineRecord>) => {
    setBankLines((prev) =>
      prev.map((line) => (line.bank_line_id === id ? { ...line, ...updates } : line))
    );
  };

  const updatePaymentRecord = (id: string, updates: Partial<PaymentRecord>) => {
    setPaymentRecords((prev) =>
      prev.map((record) => (record.payment_id === id ? { ...record, ...updates } : record))
    );
  };

  const handleLink = (line: BankLineRecord, paymentId: string) => {
    updateBankLine(line.bank_line_id, {
      linked_payment_id: paymentId,
      match_status: "LINKED",
      risk_flags: line.risk_flags.filter((flag) => flag !== "DUPLICATE_REF"),
    });
  };

  const handleSendToExceptions = (paymentId?: string) => {
    if (!paymentId) return;
    updatePaymentRecord(paymentId, { status: "Exception" });
  };

  const handleMarkFinal = (line: BankLineRecord) => {
    updateBankLine(line.bank_line_id, {
      settlement_state: "FINAL",
      final_settlement_confirmed: true,
      match_status: line.linked_payment_id ? "LINKED" : "UNLINKED",
      risk_flags: line.risk_flags.filter((flag) => flag !== "NO_FINAL_FILE"),
    });
  };

  const getLinkedLabel = (line: BankLineRecord) => {
    if (line.match_status === "MULTI_MATCH") {
      return `Multiple candidates (${line.candidate_payment_ids?.length || 0})`;
    }
    if (line.linked_payment_id) return line.linked_payment_id;
    return "—";
  };

  const getActionLabel = (line: BankLineRecord) => getStatusAction(line.match_status);

  const linkedPayment = activeBankLine?.linked_payment_id
    ? paymentIndex[activeBankLine.linked_payment_id]
    : undefined;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b bg-white px-8 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Bank Reconciliation</h1>
        <p className="text-sm text-gray-600 mt-1">
          Link bank cash lines to postings and flag match risks
        </p>
      </div>

      <div className="p-8 space-y-6">
        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select value={bankAccountFilter} onValueChange={setBankAccountFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Bank Account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as BankLineStatusFilter)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="linked">Linked</SelectItem>
                <SelectItem value="unlinked">Unlinked</SelectItem>
                <SelectItem value="multi-match">Multi-match</SelectItem>
                <SelectItem value="mismatch">Mismatch</SelectItem>
                <SelectItem value="settlement-pending">Settlement Pending</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search bank ref / payment id"
              className="w-[240px]"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {summaryStrip.map((item) => (
            <Card key={item.label} className="p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-lg font-semibold text-gray-900">{item.count}</p>
              <p className="text-xs text-gray-500">{formatCurrency(item.amount)}</p>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="bank-lines">Bank Lines</TabsTrigger>
            <TabsTrigger value="posting-readiness">Posting Readiness</TabsTrigger>
          </TabsList>

          <TabsContent value="bank-lines">
            <Card className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Bank Ref</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Linked Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-6">
                        Loading bank lines...
                      </TableCell>
                    </TableRow>
                  ) : filteredBankLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                        No bank lines found for current filters. Adjust date range or status.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBankLines.map((line) => (
                      <TableRow key={line.bank_line_id}>
                        <TableCell>{formatDate(line.bank_date)}</TableCell>
                        <TableCell>{formatCurrency(line.amount, line.currency)}</TableCell>
                        <TableCell>
                          <span
                            title={line.bank_ref}
                            className="inline-block max-w-[180px] truncate"
                          >
                            {line.bank_ref}
                          </span>
                        </TableCell>
                        <TableCell>{line.bank_account_label}</TableCell>
                        <TableCell>
                          {line.match_status === "MULTI_MATCH" ? (
                            <button
                              className="text-blue-600 text-sm"
                              onClick={() => openDrawer(line)}
                            >
                              {getLinkedLabel(line)}
                            </button>
                          ) : line.linked_payment_id ? (
                            <button
                              className="text-blue-600 text-sm"
                              onClick={() =>
                                router.push(
                                  `/workbench/order-to-cash/cash-application/payments?paymentId=${line.linked_payment_id}`
                                )
                              }
                            >
                              {line.linked_payment_id}
                            </button>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadge(line.match_status)}>
                            {getStatusLabel(line.match_status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openDrawer(line)}>
                            {getActionLabel(line)}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="posting-readiness">
            <Card className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank Ref</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Linked Payment</TableHead>
                    <TableHead>ERP Posting</TableHead>
                    <TableHead>NetSuite Match Data</TableHead>
                    <TableHead>Blocking Reason</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-6">
                        Loading readiness view...
                      </TableCell>
                    </TableRow>
                  ) : postingReadinessRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                        No bank lines found for current filters. Adjust date range or status.
                      </TableCell>
                    </TableRow>
                  ) : (
                    postingReadinessRows.map((row) => (
                      <TableRow key={row.line.bank_line_id}>
                        <TableCell>{row.line.bank_ref}</TableCell>
                        <TableCell>{formatCurrency(row.line.amount)}</TableCell>
                        <TableCell>{row.line.linked_payment_id || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              row.erpReady
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            }
                          >
                            {row.erpReady ? "Ready" : "Not Ready"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              row.netSuiteReady
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }
                          >
                            {row.netSuiteReady ? "Ready" : "Risk"}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.blockingReason}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openDrawer(row.line)}>
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {drawerOpen && activeBankLine && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[520px] bg-white shadow-xl flex flex-col">
            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Bank Line Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <Card className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Bank Line</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Bank Date</p>
                    <p className="font-medium">{formatDate(activeBankLine.bank_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Amount</p>
                    <p className="font-medium">{formatCurrency(activeBankLine.amount)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">Bank Ref</p>
                    <p className="font-medium">{activeBankLine.bank_ref}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Bank Account</p>
                    <p className="font-medium">{activeBankLine.bank_account_label}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Source Type</p>
                    <p className="font-medium">{activeBankLine.source_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Settlement State</p>
                    <p className="font-medium">{activeBankLine.settlement_state}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Final Confirmed</p>
                    <p className="font-medium">
                      {activeBankLine.final_settlement_confirmed ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Matching</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getStatusBadge(activeBankLine.match_status)}>
                    {getStatusLabel(activeBankLine.match_status)}
                  </Badge>
                  {activeBankLine.risk_flags.map((flag) => (
                    <Badge key={flag} variant="secondary" className="text-xs">
                      {flag}
                    </Badge>
                  ))}
                </div>
                {activeBankLine.linked_payment_id && (
                  <div className="text-sm text-slate-600">
                    Linked Payment:{" "}
                    <span className="font-semibold">{activeBankLine.linked_payment_id}</span>
                  </div>
                )}
              </Card>

              {activeBankLine.match_status === "LINKED" && linkedPayment && (
                <Card className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-slate-900">Linked Payment</h3>
                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Payment ID</span>
                      <button
                        className="text-blue-600 font-medium"
                        onClick={() =>
                          router.push(
                            `/workbench/order-to-cash/cash-application/payments?paymentId=${linkedPayment.payment_id}`
                          )
                        }
                      >
                        {linkedPayment.payment_id}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Customer</span>
                      <span>{linkedPayment.customer}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Amount</span>
                      <span>{formatCurrency(linkedPayment.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status</span>
                      <span>{linkedPayment.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Posted Flag</span>
                      <span>{linkedPayment.posted_flag ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">NetSuite Payment ID</span>
                      <span>{linkedPayment.netsuite_payment_id || "—"}</span>
                    </div>
                  </div>
                </Card>
              )}

              {activeBankLine.match_status === "MULTI_MATCH" && (
                <Card className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Candidate Payments</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidatePayments.map((candidate, idx) => (
                        <TableRow key={candidate.payment_id}>
                          <TableCell>{candidate.payment_id}</TableCell>
                          <TableCell>{candidate.customer}</TableCell>
                          <TableCell>{formatCurrency(candidate.amount)}</TableCell>
                          <TableCell>{92 - idx * 7}%</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLink(activeBankLine, candidate.payment_id)}
                            >
                              Link
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}

              {activeBankLine.match_status === "UNLINKED" && (
                <Card className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Find &amp; Link Payment</h3>
                  <Input
                    placeholder="Search payment id or customer"
                    value={unlinkedSearch}
                    onChange={(event) => setUnlinkedSearch(event.target.value)}
                  />
                  <div className="space-y-2">
                    {unlinkedCandidates.map((candidate) => (
                      <div
                        key={candidate.payment_id}
                        className="flex items-center justify-between border rounded-md p-3 text-sm"
                      >
                        <div>
                          <div className="font-semibold">{candidate.payment_id}</div>
                          <div className="text-xs text-slate-500">
                            {candidate.customer} • {formatCurrency(candidate.amount)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLink(activeBankLine, candidate.payment_id)}
                        >
                          Link
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {activeBankLine.match_status === "AMOUNT_MISMATCH" && (
                <Card className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Amount Mismatch</h3>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>Bank Amount: {formatCurrency(activeBankLine.amount)}</div>
                    <div>
                      Payment Amount: {linkedPayment ? formatCurrency(linkedPayment.amount) : "—"}
                    </div>
                    <div>
                      Difference:{" "}
                      {linkedPayment
                        ? formatCurrency(activeBankLine.amount - linkedPayment.amount)
                        : "—"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        linkedPayment &&
                        router.push(
                          `/workbench/order-to-cash/cash-application/payments?paymentId=${linkedPayment.payment_id}`
                        )
                      }
                    >
                      Open Payment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendToExceptions(linkedPayment?.payment_id)}
                    >
                      Send to Exceptions
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateBankLine(activeBankLine.bank_line_id, { notes: "Marked as bank fee" })
                      }
                    >
                      Mark as Bank Fee
                    </Button>
                  </div>
                </Card>
              )}

              {activeBankLine.match_status === "SETTLEMENT_PENDING" && (
                <Card className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Settlement Pending</h3>
                  <p className="text-sm text-slate-600">
                    Preliminary item detected. Final settlement not confirmed.
                  </p>
                  <p className="text-xs text-slate-500">
                    Last seen in preliminary feed: {formatDate(activeBankLine.bank_date)}
                  </p>
                  <p className="text-xs text-slate-500">Recommended: Hold posting</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkFinal(activeBankLine)}
                  >
                    Mark as Final Received
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
