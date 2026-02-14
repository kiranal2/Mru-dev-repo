"use client";

import { useState } from "react";
import {
  ManualCaseInput,
  ManualReceiptInput,
  ManualExemptionInput,
  ManualPartyInput,
  RuleEvaluationResult,
  LeakageSignal,
  LandNature,
} from "@/lib/revenue-leakage/types";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Play,
  Save,
  RotateCcw,
  Wand2,
} from "lucide-react";

interface CreateManualCaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaseCreated: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const signalLabels: Record<LeakageSignal, string> = {
  RevenueGap: "Revenue Gap",
  ChallanDelay: "Challan Delay",
  ExemptionRisk: "Exemption Risk",
  MarketValueRisk: "Market Value",
  ProhibitedLand: "Prohibited Land",
  DataIntegrity: "Data Integrity",
  HolidayFee: "Holiday Fee",
};

const signalColor: Record<LeakageSignal, string> = {
  RevenueGap: "bg-red-100 text-red-800 border-red-300",
  ChallanDelay: "bg-orange-100 text-orange-800 border-orange-300",
  ExemptionRisk: "bg-purple-100 text-purple-800 border-purple-300",
  MarketValueRisk: "bg-sky-100 text-sky-800 border-sky-300",
  ProhibitedLand: "bg-pink-100 text-pink-800 border-pink-300",
  DataIntegrity: "bg-slate-200 text-slate-800 border-slate-400",
  HolidayFee: "bg-amber-100 text-amber-800 border-amber-300",
};

const DOC_TYPES = [
  "Sale Deed",
  "Gift Deed",
  "Mortgage",
  "Partition",
  "Release",
  "Settlement",
  "Exchange",
  "Lease",
  "Power of Attorney",
  "Agreement of Sale",
];

function defaultInput(): ManualCaseInput {
  return {
    SR_CODE: "",
    SR_NAME: "",
    district: "",
    zone: "",
    BOOK_NO: "",
    DOCT_NO: "",
    REG_YEAR: new Date().getFullYear().toString(),
    doc_type: "Sale Deed",
    TRAN_MAJ_CODE: "01",
    TRAN_MIN_CODE: "01",
    P_DATE: "",
    E_DATE: "",
    R_DATE: "",
    is_urban: true,
    WARD_NO: "",
    BLOCK_NO: "",
    DOOR_NO: "",
    LOCAL_BODY: "",
    VILLAGE_CODE: "",
    SURVEY_NO: "",
    PLOT_NO: "",
    land_nature: "NA" as LandNature,
    extent: "",
    unit: "sq.ft",
    prohibited_land_match: false,
    schedule_data_exists: true,
    SD_PAYABLE: 0,
    TD_PAYABLE: 0,
    RF_PAYABLE: 0,
    DSD_PAYABLE: 0,
    OTHER_FEE: 0,
    FINAL_TAXABLE_VALUE: 0,
    receipts: [],
    declared_value: 0,
    expected_value: 0,
    unit_rate_current: 0,
    unit_rate_previous: 0,
    nearby_median_rate: 0,
    exemptions: [],
    holiday_registration: false,
    parties: [],
  };
}

function defaultReceipt(): ManualReceiptInput {
  return {
    receipt_no: "",
    receipt_date: "",
    challan_no: "",
    challan_date: "",
    amount: 0,
    acc_canc: "A",
    account_codes: [],
  };
}

function defaultExemption(): ManualExemptionInput {
  return {
    code: "",
    amount: 0,
    reason: "",
    doc_type_eligible: true,
    cap_amount: 0,
    repeat_usage_count: 0,
  };
}

function defaultParty(): ManualPartyInput {
  return { CODE: "BUY", NAME: "", PAN_NO: "" };
}

// ── Sample Data — single clean scenario ──
// One preset, one signal (RevenueGap via R-PAY-01), easy to follow end-to-end.

const SAMPLE_DATA: ManualCaseInput = {
  SR_CODE: "SR01",
  SR_NAME: "Vijayawada Central",
  district: "Krishna",
  zone: "South",
  BOOK_NO: "I",
  DOCT_NO: "98765",
  REG_YEAR: "2024",
  doc_type: "Sale Deed",
  TRAN_MAJ_CODE: "01",
  TRAN_MIN_CODE: "01",
  P_DATE: "2024-12-01",
  E_DATE: "2024-12-03",
  R_DATE: "2024-12-05",
  is_urban: true,
  WARD_NO: "W-04",
  BLOCK_NO: "B-12",
  DOOR_NO: "5-2-100",
  LOCAL_BODY: "VMC",
  VILLAGE_CODE: "",
  SURVEY_NO: "",
  PLOT_NO: "",
  land_nature: "Converted" as LandNature,
  extent: "1200",
  unit: "sq.ft",
  prohibited_land_match: false,
  schedule_data_exists: true,
  // Payable = 100,000  |  Paid = 70,000  |  Gap = 30,000  → triggers R-PAY-01
  SD_PAYABLE: 50000,
  TD_PAYABLE: 20000,
  RF_PAYABLE: 15000,
  DSD_PAYABLE: 10000,
  OTHER_FEE: 5000,
  FINAL_TAXABLE_VALUE: 5000000,
  receipts: [
    {
      receipt_no: "RCP-4001",
      receipt_date: "2024-12-05",
      challan_no: "CHLN-8801",
      challan_date: "2024-12-04",
      amount: 70000,
      acc_canc: "A" as const,
      account_codes: ["0021", "0028"],
    },
  ],
  // No MV deviation, no exemption issues — keep it clean
  declared_value: 0,
  expected_value: 0,
  unit_rate_current: 0,
  unit_rate_previous: 0,
  nearby_median_rate: 0,
  exemptions: [],
  holiday_registration: false,
  parties: [
    { CODE: "BUY", NAME: "Ramesh Kumar", PAN_NO: "ABCPK1234F" },
    { CODE: "SEL", NAME: "Suresh Reddy", PAN_NO: "XYZPS5678G" },
  ],
};

export function CreateManualCaseSheet({
  open,
  onOpenChange,
  onCaseCreated,
}: CreateManualCaseSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [form, setForm] = useState<ManualCaseInput>(defaultInput());
  const [result, setResult] = useState<RuleEvaluationResult | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSampleData = () => {
    setForm({ ...SAMPLE_DATA });
    setResult(null);
    setStep(1);
    toast.success("Sample data loaded — click through steps then Evaluate");
  };

  const reset = () => {
    setStep(1);
    setForm(defaultInput());
    setResult(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const updateForm = (partial: Partial<ManualCaseInput>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const payableTotal =
    form.SD_PAYABLE + form.TD_PAYABLE + form.RF_PAYABLE + form.DSD_PAYABLE + form.OTHER_FEE;
  const paidTotal = form.receipts
    .filter((r) => r.acc_canc === "A")
    .reduce((s, r) => s + r.amount, 0);
  const gapDisplay = Math.max(0, payableTotal - paidTotal);

  // Receipt helpers
  const addReceipt = () => updateForm({ receipts: [...form.receipts, defaultReceipt()] });
  const removeReceipt = (i: number) =>
    updateForm({ receipts: form.receipts.filter((_, idx) => idx !== i) });
  const updateReceipt = (i: number, partial: Partial<ManualReceiptInput>) => {
    const next = [...form.receipts];
    next[i] = { ...next[i], ...partial };
    updateForm({ receipts: next });
  };

  // Exemption helpers
  const addExemption = () => updateForm({ exemptions: [...form.exemptions, defaultExemption()] });
  const removeExemption = (i: number) =>
    updateForm({ exemptions: form.exemptions.filter((_, idx) => idx !== i) });
  const updateExemption = (i: number, partial: Partial<ManualExemptionInput>) => {
    const next = [...form.exemptions];
    next[i] = { ...next[i], ...partial };
    updateForm({ exemptions: next });
  };

  // Party helpers
  const addParty = () => updateForm({ parties: [...form.parties, defaultParty()] });
  const removeParty = (i: number) =>
    updateForm({ parties: form.parties.filter((_, idx) => idx !== i) });
  const updateParty = (i: number, partial: Partial<ManualPartyInput>) => {
    const next = [...form.parties];
    next[i] = { ...next[i], ...partial };
    updateForm({ parties: next });
  };

  const handleEvaluate = async () => {
    const res = await revenueLeakageApi.evaluateManualCase(form);
    setResult(res);
    setStep(5);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await revenueLeakageApi.createManualCaseFromInput(form);
      toast.success("Case created successfully");
      onCaseCreated();
      handleClose(false);
    } finally {
      setSaving(false);
    }
  };

  const stepLabels = [
    "Document & Office",
    "Property",
    "Financials",
    "Additional Context",
    "Results",
  ];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-[740px] sm:max-w-[740px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-blue-800 to-blue-700">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl font-bold text-white tracking-tight">
                Create Manual Case
              </SheetTitle>
              <p className="text-xs text-blue-200 mt-1">
                Step {step} of 5 — {stepLabels[step - 1]}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs bg-amber-500/20 border-amber-400/40 text-amber-100 hover:bg-amber-500/30 hover:text-white"
              onClick={loadSampleData}
            >
              <Wand2 className="w-3.5 h-3.5 mr-1.5" />
              Fill Sample Data
            </Button>
          </div>
          {/* Step indicator */}
          <div className="flex gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? "bg-white" : "bg-white/25"}`}
              />
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* ── Step 1: Document & Office ── */}
          {step === 1 && (
            <>
              <Card className="p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Office</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">SR Code *</label>
                    <Input
                      value={form.SR_CODE}
                      onChange={(e) => updateForm({ SR_CODE: e.target.value })}
                      placeholder="e.g. SR01"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">SR Name</label>
                    <Input
                      value={form.SR_NAME}
                      onChange={(e) => updateForm({ SR_NAME: e.target.value })}
                      placeholder="e.g. Vijayawada Central"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">District</label>
                    <Input
                      value={form.district}
                      onChange={(e) => updateForm({ district: e.target.value })}
                      placeholder="e.g. Krishna"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Zone</label>
                    <Input
                      value={form.zone}
                      onChange={(e) => updateForm({ zone: e.target.value })}
                      placeholder="e.g. South"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Document</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Book No *</label>
                    <Input
                      value={form.BOOK_NO}
                      onChange={(e) => updateForm({ BOOK_NO: e.target.value })}
                      placeholder="e.g. I"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Document No *</label>
                    <Input
                      value={form.DOCT_NO}
                      onChange={(e) => updateForm({ DOCT_NO: e.target.value })}
                      placeholder="e.g. 12345"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Reg Year *</label>
                    <Input
                      value={form.REG_YEAR}
                      onChange={(e) => updateForm({ REG_YEAR: e.target.value })}
                      placeholder="2024"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Document Type</label>
                    <Select
                      value={form.doc_type}
                      onValueChange={(v) => updateForm({ doc_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOC_TYPES.map((dt) => (
                          <SelectItem key={dt} value={dt}>
                            {dt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">TRAN MAJ Code</label>
                    <Input
                      value={form.TRAN_MAJ_CODE}
                      onChange={(e) => updateForm({ TRAN_MAJ_CODE: e.target.value })}
                      placeholder="01"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">TRAN MIN Code</label>
                    <Input
                      value={form.TRAN_MIN_CODE}
                      onChange={(e) => updateForm({ TRAN_MIN_CODE: e.target.value })}
                      placeholder="01"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dates</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Presentation Date</label>
                    <Input
                      type="date"
                      value={form.P_DATE}
                      onChange={(e) => updateForm({ P_DATE: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Execution Date</label>
                    <Input
                      type="date"
                      value={form.E_DATE}
                      onChange={(e) => updateForm({ E_DATE: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Registration Date</label>
                    <Input
                      type="date"
                      value={form.R_DATE}
                      onChange={(e) => updateForm({ R_DATE: e.target.value })}
                    />
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* ── Step 2: Property ── */}
          {step === 2 && (
            <>
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Location Type
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${!form.is_urban ? "text-emerald-700" : "text-slate-400"}`}
                    >
                      Rural
                    </span>
                    <Switch
                      checked={form.is_urban}
                      onCheckedChange={(v) => updateForm({ is_urban: v })}
                    />
                    <span
                      className={`text-xs font-medium ${form.is_urban ? "text-blue-700" : "text-slate-400"}`}
                    >
                      Urban
                    </span>
                  </div>
                </div>

                {form.is_urban ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500">Ward No</label>
                      <Input
                        value={form.WARD_NO}
                        onChange={(e) => updateForm({ WARD_NO: e.target.value })}
                        placeholder="e.g. W-04"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Block No</label>
                      <Input
                        value={form.BLOCK_NO}
                        onChange={(e) => updateForm({ BLOCK_NO: e.target.value })}
                        placeholder="e.g. B-12"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Door No</label>
                      <Input
                        value={form.DOOR_NO}
                        onChange={(e) => updateForm({ DOOR_NO: e.target.value })}
                        placeholder="e.g. 5-2-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Local Body</label>
                      <Input
                        value={form.LOCAL_BODY}
                        onChange={(e) => updateForm({ LOCAL_BODY: e.target.value })}
                        placeholder="e.g. Municipal Corp"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-500">Village Code</label>
                      <Input
                        value={form.VILLAGE_CODE}
                        onChange={(e) => updateForm({ VILLAGE_CODE: e.target.value })}
                        placeholder="e.g. V-1234"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Survey No</label>
                      <Input
                        value={form.SURVEY_NO}
                        onChange={(e) => updateForm({ SURVEY_NO: e.target.value })}
                        placeholder="e.g. 45/A"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Plot No</label>
                      <Input
                        value={form.PLOT_NO}
                        onChange={(e) => updateForm({ PLOT_NO: e.target.value })}
                        placeholder="e.g. 12"
                      />
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Land Details
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Land Nature</label>
                    <Select
                      value={form.land_nature}
                      onValueChange={(v) => updateForm({ land_nature: v as LandNature })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["Dry", "Wet", "Converted", "Garden", "NA"] as LandNature[]).map((ln) => (
                          <SelectItem key={ln} value={ln}>
                            {ln}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Extent</label>
                    <Input
                      value={form.extent}
                      onChange={(e) => updateForm({ extent: e.target.value })}
                      placeholder="e.g. 1200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Unit</label>
                    <Select value={form.unit} onValueChange={(v) => updateForm({ unit: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sq.ft">sq.ft</SelectItem>
                        <SelectItem value="sq.m">sq.m</SelectItem>
                        <SelectItem value="acres">Acres</SelectItem>
                        <SelectItem value="cents">Cents</SelectItem>
                        <SelectItem value="guntas">Guntas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Flags</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Prohibited land match</span>
                  <Switch
                    checked={form.prohibited_land_match}
                    onCheckedChange={(v) => updateForm({ prohibited_land_match: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Schedule data exists</span>
                  <Switch
                    checked={form.schedule_data_exists}
                    onCheckedChange={(v) => updateForm({ schedule_data_exists: v })}
                  />
                </div>
              </Card>
            </>
          )}

          {/* ── Step 3: Financials ── */}
          {step === 3 && (
            <>
              <Card className="p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Payable Breakdown
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      ["SD_PAYABLE", "Stamp Duty"],
                      ["TD_PAYABLE", "Transfer Duty"],
                      ["RF_PAYABLE", "Registration Fee"],
                      ["DSD_PAYABLE", "DSD Fee"],
                      ["OTHER_FEE", "Other Fees"],
                      ["FINAL_TAXABLE_VALUE", "Taxable Value"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="text-xs text-slate-500">{label}</label>
                      <Input
                        type="number"
                        value={form[key] || ""}
                        onChange={(e) => updateForm({ [key]: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-bold text-slate-700">Payable Total</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency(payableTotal)}
                  </span>
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Receipts
                  </p>
                  <Button size="sm" variant="outline" onClick={addReceipt}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Receipt
                  </Button>
                </div>
                {form.receipts.length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No receipts added yet. Click "Add Receipt" to begin.
                  </p>
                )}
                {form.receipts.map((r, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Receipt #{i + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500"
                        onClick={() => removeReceipt(i)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-500">Receipt No</label>
                        <Input
                          className="h-8 text-xs"
                          value={r.receipt_no}
                          onChange={(e) => updateReceipt(i, { receipt_no: e.target.value })}
                          placeholder="RCP-001"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Receipt Date</label>
                        <Input
                          className="h-8 text-xs"
                          type="date"
                          value={r.receipt_date}
                          onChange={(e) => updateReceipt(i, { receipt_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Amount</label>
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          value={r.amount || ""}
                          onChange={(e) => updateReceipt(i, { amount: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Challan No</label>
                        <Input
                          className="h-8 text-xs"
                          value={r.challan_no}
                          onChange={(e) => updateReceipt(i, { challan_no: e.target.value })}
                          placeholder="CHLN-001"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Challan Date</label>
                        <Input
                          className="h-8 text-xs"
                          type="date"
                          value={r.challan_date}
                          onChange={(e) => updateReceipt(i, { challan_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">ACC_CANC</label>
                        <Select
                          value={r.acc_canc}
                          onValueChange={(v) =>
                            updateReceipt(i, { acc_canc: v as "A" | "C" | "R" })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A (Active)</SelectItem>
                            <SelectItem value="C">C (Cancelled)</SelectItem>
                            <SelectItem value="R">R (Reversed)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500">
                        Account Codes (comma-separated)
                      </label>
                      <Input
                        className="h-8 text-xs"
                        value={r.account_codes.join(", ")}
                        onChange={(e) =>
                          updateReceipt(i, {
                            account_codes: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="0021, 0028"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <span className="text-sm font-bold text-blue-700">
                      Paid Total: {formatCurrency(paidTotal)}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`text-sm font-bold ${gapDisplay > 0 ? "text-red-600" : "text-emerald-600"}`}
                    >
                      Gap: {formatCurrency(gapDisplay)}
                    </span>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* ── Step 4: Additional Context ── */}
          {step === 4 && (
            <>
              <Card className="p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Market Value
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Declared Value</label>
                    <Input
                      type="number"
                      value={form.declared_value || ""}
                      onChange={(e) => updateForm({ declared_value: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Expected Value</label>
                    <Input
                      type="number"
                      value={form.expected_value || ""}
                      onChange={(e) => updateForm({ expected_value: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Unit Rate (Current)</label>
                    <Input
                      type="number"
                      value={form.unit_rate_current || ""}
                      onChange={(e) => updateForm({ unit_rate_current: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Unit Rate (Previous Year)</label>
                    <Input
                      type="number"
                      value={form.unit_rate_previous || ""}
                      onChange={(e) => updateForm({ unit_rate_previous: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500">Nearby Median Rate</label>
                    <Input
                      type="number"
                      value={form.nearby_median_rate || ""}
                      onChange={(e) => updateForm({ nearby_median_rate: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Exemptions
                  </p>
                  <Button size="sm" variant="outline" onClick={addExemption}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Exemption
                  </Button>
                </div>
                {form.exemptions.length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No exemptions. Click "Add Exemption" if applicable.
                  </p>
                )}
                {form.exemptions.map((ex, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2 bg-purple-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Exemption #{i + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500"
                        onClick={() => removeExemption(i)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-500">Code</label>
                        <Input
                          className="h-8 text-xs"
                          value={ex.code}
                          onChange={(e) => updateExemption(i, { code: e.target.value })}
                          placeholder="EX-001"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Amount</label>
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          value={ex.amount || ""}
                          onChange={(e) => updateExemption(i, { amount: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Reason</label>
                        <Input
                          className="h-8 text-xs"
                          value={ex.reason}
                          onChange={(e) => updateExemption(i, { reason: e.target.value })}
                          placeholder="Family transfer"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Cap Amount</label>
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          value={ex.cap_amount || ""}
                          onChange={(e) =>
                            updateExemption(i, { cap_amount: Number(e.target.value) })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Repeat Usage Count</label>
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          value={ex.repeat_usage_count || ""}
                          onChange={(e) =>
                            updateExemption(i, { repeat_usage_count: Number(e.target.value) })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-end gap-2 pb-1">
                        <label className="text-[11px] text-slate-500">Doc Type Eligible</label>
                        <Switch
                          checked={ex.doc_type_eligible}
                          onCheckedChange={(v) => updateExemption(i, { doc_type_eligible: v })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </Card>

              <Card className="p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Flags</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Holiday Registration</span>
                  <Switch
                    checked={form.holiday_registration}
                    onCheckedChange={(v) => updateForm({ holiday_registration: v })}
                  />
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Parties (Optional)
                  </p>
                  <Button size="sm" variant="outline" onClick={addParty}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Party
                  </Button>
                </div>
                {form.parties.length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No parties added. This is optional.
                  </p>
                )}
                {form.parties.map((p, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Party #{i + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500"
                        onClick={() => removeParty(i)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-500">Role</label>
                        <Select value={p.CODE} onValueChange={(v) => updateParty(i, { CODE: v })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BUY">Buyer</SelectItem>
                            <SelectItem value="SEL">Seller</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Name</label>
                        <Input
                          className="h-8 text-xs"
                          value={p.NAME}
                          onChange={(e) => updateParty(i, { NAME: e.target.value })}
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">PAN No</label>
                        <Input
                          className="h-8 text-xs"
                          value={p.PAN_NO}
                          onChange={(e) => updateParty(i, { PAN_NO: e.target.value })}
                          placeholder="ABCDE1234F"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            </>
          )}

          {/* ── Step 5: Results ── */}
          {step === 5 && result && (
            <>
              {/* Summary Card */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Evaluation Summary</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                      result.risk_level === "High"
                        ? "bg-red-600 text-white border-red-700"
                        : result.risk_level === "Medium"
                          ? "bg-amber-500 text-white border-amber-600"
                          : "bg-emerald-600 text-white border-emerald-700"
                    }`}
                  >
                    {result.risk_level} Risk
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <p className="text-[11px] text-slate-500">Risk Score</p>
                    <div className="mt-1">
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${result.risk_score >= 60 ? "bg-red-500" : result.risk_score >= 30 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${result.risk_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-800">{result.risk_score}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-slate-500">Confidence</p>
                    <p className="text-lg font-bold text-slate-800">{result.confidence}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-slate-500">Impact</p>
                    <p className="text-lg font-bold text-slate-800">
                      {formatCurrency(result.impact_amount_inr)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-slate-500">Gap</p>
                    <p
                      className={`text-lg font-bold ${result.gap_inr > 0 ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {formatCurrency(result.gap_inr)}
                    </p>
                  </div>
                </div>
                {/* Signal pills */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                  {result.leakage_signals.map((signal) => (
                    <span
                      key={signal}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${signalColor[signal]}`}
                    >
                      {signalLabels[signal]}
                    </span>
                  ))}
                  {result.leakage_signals.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No signals triggered</span>
                  )}
                </div>
              </Card>

              {/* Triggered Rules Table */}
              {result.triggered_rules.length > 0 && (
                <Card className="p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Triggered Rules ({result.triggered_rules.length})
                  </p>
                  <div className="overflow-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                        <tr>
                          <th className="text-left py-2 px-3 font-semibold">Rule</th>
                          <th className="text-left py-2 px-3 font-semibold">Severity</th>
                          <th className="text-right py-2 px-3 font-semibold">Impact</th>
                          <th className="text-right py-2 px-3 font-semibold">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.triggered_rules.map((rule) => (
                          <tr key={rule.rule_id} className="text-slate-800 hover:bg-slate-50">
                            <td className="py-2 px-3 font-medium">
                              {rule.rule_id} · {rule.rule_name}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                  rule.severity === "High"
                                    ? "bg-red-600 text-white"
                                    : rule.severity === "Medium"
                                      ? "bg-amber-500 text-white"
                                      : "bg-emerald-600 text-white"
                                }`}
                              >
                                {rule.severity}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-semibold">
                              {formatCurrency(rule.impact_inr)}
                            </td>
                            <td className="py-2 px-3 text-right">{rule.confidence}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Expandable Rule Details */}
              {result.triggered_rules.length > 0 && (
                <Card className="p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Rule Details
                  </p>
                  <Accordion type="single" collapsible className="space-y-2">
                    {result.triggered_rules.map((rule) => (
                      <AccordionItem
                        key={rule.rule_id}
                        value={rule.rule_id}
                        className="border rounded-md"
                      >
                        <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:no-underline">
                          {rule.rule_id} · {rule.rule_name}
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 text-xs text-slate-600 space-y-2">
                          <p>{rule.explanation}</p>
                          <div>
                            <p className="font-medium text-slate-500 mb-1">Fields Used</p>
                            <div className="flex flex-wrap gap-1">
                              {rule.fields_used.map((f) => (
                                <Badge key={f} variant="secondary" className="text-[10px]">
                                  {f}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-slate-500 mb-1">Calculations</p>
                            <ul className="space-y-1">
                              {rule.calculations.map((c) => (
                                <li key={c.label} className="flex items-center justify-between">
                                  <span className="text-slate-500">{c.label}</span>
                                  <span className="font-semibold text-slate-800">{c.value}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              )}

              {result.triggered_rules.length === 0 && (
                <Card className="p-6 text-center">
                  <p className="text-sm text-slate-500">
                    No rules were triggered. Adjust the input data and re-evaluate.
                  </p>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3 border-t bg-slate-50 flex items-center justify-between">
          <div>
            {step > 1 && step < 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {step === 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setStep(4);
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Edit
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === 5 && (
              <>
                <Button variant="outline" size="sm" onClick={reset}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Reset
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save Case"}
                </Button>
              </>
            )}
            {step < 4 && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setStep((step + 1) as 2 | 3 | 4)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === 4 && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleEvaluate}
              >
                <Play className="w-4 h-4 mr-1" /> Evaluate Rules
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
