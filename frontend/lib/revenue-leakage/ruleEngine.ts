import { ManualCaseInput, RuleHit, LeakageSignal, RiskLevel, RuleEvaluationResult } from "./types";

/**
 * Pure function — evaluates all 16 leakage rules against user-provided data.
 * Returns triggered rules, signals, risk score, etc.
 */
export function evaluateRules(input: ManualCaseInput): RuleEvaluationResult {
  const triggered: RuleHit[] = [];

  const payableTotal =
    input.SD_PAYABLE + input.TD_PAYABLE + input.RF_PAYABLE + input.DSD_PAYABLE + input.OTHER_FEE;

  const includedReceipts = input.receipts.filter((r) => r.acc_canc === "A");
  const paidTotal = includedReceipts.reduce((s, r) => s + r.amount, 0);
  const gap = Math.max(0, payableTotal - paidTotal);

  // ── Phase 1 Rules ──

  // R-PAY-01: Paid < Payable → gap
  if (payableTotal > 0 && paidTotal < payableTotal && paidTotal > 0) {
    triggered.push({
      rule_id: "R-PAY-01",
      rule_name: "Paid Less Than Payable",
      category: "RevenueGap",
      severity: "High",
      impact_inr: gap,
      explanation: `Paid amount (₹${paidTotal.toLocaleString("en-IN")}) is less than payable (₹${payableTotal.toLocaleString("en-IN")}). Gap: ₹${gap.toLocaleString("en-IN")}.`,
      fields_used: [
        "SD_PAYABLE",
        "TD_PAYABLE",
        "RF_PAYABLE",
        "DSD_PAYABLE",
        "OTHER_FEE",
        "receipts.amount",
      ],
      calculations: [
        { label: "Payable Total", value: `₹${payableTotal.toLocaleString("en-IN")}` },
        { label: "Paid Total", value: `₹${paidTotal.toLocaleString("en-IN")}` },
        { label: "Gap", value: `₹${gap.toLocaleString("en-IN")}` },
      ],
      confidence: 90,
    });
  }

  // R-PAY-02: Paid = 0 with payable > 0
  if (payableTotal > 0 && paidTotal === 0) {
    triggered.push({
      rule_id: "R-PAY-02",
      rule_name: "Zero Payment Against Payable",
      category: "RevenueGap",
      severity: "High",
      impact_inr: payableTotal,
      explanation: `No payments recorded despite payable of ₹${payableTotal.toLocaleString("en-IN")}.`,
      fields_used: [
        "SD_PAYABLE",
        "TD_PAYABLE",
        "RF_PAYABLE",
        "DSD_PAYABLE",
        "OTHER_FEE",
        "receipts",
      ],
      calculations: [
        { label: "Payable Total", value: `₹${payableTotal.toLocaleString("en-IN")}` },
        { label: "Paid Total", value: "₹0" },
        { label: "Gap", value: `₹${payableTotal.toLocaleString("en-IN")}` },
      ],
      confidence: 95,
    });
  }

  // R-PAY-03: Multiple receipts but sum < payable
  if (includedReceipts.length > 1 && paidTotal < payableTotal) {
    triggered.push({
      rule_id: "R-PAY-03",
      rule_name: "Multi-Receipt Shortfall",
      category: "RevenueGap",
      severity: "Medium",
      impact_inr: gap,
      explanation: `${includedReceipts.length} receipts found but their sum (₹${paidTotal.toLocaleString("en-IN")}) is still below payable (₹${payableTotal.toLocaleString("en-IN")}).`,
      fields_used: ["receipts.amount", "receipts.acc_canc"],
      calculations: [
        { label: "Receipt Count", value: `${includedReceipts.length}` },
        { label: "Sum of Receipts", value: `₹${paidTotal.toLocaleString("en-IN")}` },
        { label: "Shortfall", value: `₹${gap.toLocaleString("en-IN")}` },
      ],
      confidence: 80,
    });
  }

  // R-PAY-04: Excluded receipts contribute to gap
  const excludedReceipts = input.receipts.filter((r) => r.acc_canc !== "A");
  const excludedTotal = excludedReceipts.reduce((s, r) => s + r.amount, 0);
  if (excludedReceipts.length > 0 && excludedTotal > 0 && gap > 0) {
    triggered.push({
      rule_id: "R-PAY-04",
      rule_name: "Excluded Receipts Contributing to Gap",
      category: "RevenueGap",
      severity: "Medium",
      impact_inr: Math.min(excludedTotal, gap),
      explanation: `${excludedReceipts.length} excluded receipt(s) totalling ₹${excludedTotal.toLocaleString("en-IN")} may contribute to the payment gap.`,
      fields_used: ["receipts.acc_canc", "receipts.amount"],
      calculations: [
        { label: "Excluded Receipts", value: `${excludedReceipts.length}` },
        { label: "Excluded Amount", value: `₹${excludedTotal.toLocaleString("en-IN")}` },
        { label: "Current Gap", value: `₹${gap.toLocaleString("en-IN")}` },
      ],
      confidence: 70,
    });
  }

  // R-CHLN-01: Receipt date - challan date > 7 days
  for (const r of includedReceipts) {
    if (r.receipt_date && r.challan_date) {
      const receiptMs = new Date(r.receipt_date).getTime();
      const challanMs = new Date(r.challan_date).getTime();
      const delayDays = Math.round((receiptMs - challanMs) / 86400000);
      if (delayDays > 7) {
        triggered.push({
          rule_id: "R-CHLN-01",
          rule_name: "Challan Delay Exceeds 7 Days",
          category: "ChallanDelay",
          severity: "Medium",
          impact_inr: 0,
          explanation: `Receipt ${r.receipt_no || "(no number)"} has ${delayDays}-day delay between challan date and receipt date.`,
          fields_used: ["receipts.receipt_date", "receipts.challan_date"],
          calculations: [
            { label: "Challan Date", value: r.challan_date },
            { label: "Receipt Date", value: r.receipt_date },
            { label: "Delay", value: `${delayDays} days` },
          ],
          confidence: 85,
        });
        break; // one hit per rule
      }
    }
  }

  // R-CHLN-02: Challan number exists but date is null
  for (const r of includedReceipts) {
    if (r.challan_no && !r.challan_date) {
      triggered.push({
        rule_id: "R-CHLN-02",
        rule_name: "Challan Date Missing",
        category: "ChallanDelay",
        severity: "Low",
        impact_inr: 0,
        explanation: `Receipt ${r.receipt_no || "(no number)"} has challan number "${r.challan_no}" but no challan date.`,
        fields_used: ["receipts.challan_no", "receipts.challan_date"],
        calculations: [
          { label: "Challan No", value: r.challan_no },
          { label: "Challan Date", value: "Missing" },
        ],
        confidence: 75,
      });
      break;
    }
  }

  // R-PROB-01: Prohibited land match — rural
  if (input.prohibited_land_match && !input.is_urban) {
    triggered.push({
      rule_id: "R-PROB-01",
      rule_name: "Prohibited Land Match (Rural)",
      category: "ProhibitedLand",
      severity: "High",
      impact_inr: input.FINAL_TAXABLE_VALUE || 0,
      explanation: `Rural property matches a prohibited land record. Village: ${input.VILLAGE_CODE}, Survey: ${input.SURVEY_NO}.`,
      fields_used: ["prohibited_land_match", "is_urban", "VILLAGE_CODE", "SURVEY_NO"],
      calculations: [
        { label: "Location Type", value: "Rural" },
        { label: "Village Code", value: input.VILLAGE_CODE || "—" },
        { label: "Survey No", value: input.SURVEY_NO || "—" },
      ],
      confidence: 85,
    });
  }

  // R-PROB-02: Prohibited land match — urban
  if (input.prohibited_land_match && input.is_urban) {
    triggered.push({
      rule_id: "R-PROB-02",
      rule_name: "Prohibited Land Match (Urban)",
      category: "ProhibitedLand",
      severity: "High",
      impact_inr: input.FINAL_TAXABLE_VALUE || 0,
      explanation: `Urban property matches a prohibited land record. Ward: ${input.WARD_NO}, Block: ${input.BLOCK_NO}.`,
      fields_used: ["prohibited_land_match", "is_urban", "WARD_NO", "BLOCK_NO"],
      calculations: [
        { label: "Location Type", value: "Urban" },
        { label: "Ward No", value: input.WARD_NO || "—" },
        { label: "Block No", value: input.BLOCK_NO || "—" },
      ],
      confidence: 85,
    });
  }

  // R-DATA-01: No schedule data
  if (!input.schedule_data_exists) {
    triggered.push({
      rule_id: "R-DATA-01",
      rule_name: "Missing Schedule Data",
      category: "DataIntegrity",
      severity: "Medium",
      impact_inr: 0,
      explanation:
        "No schedule data available for this registration. Property details may be incomplete.",
      fields_used: ["schedule_data_exists"],
      calculations: [{ label: "Schedule Present", value: "No" }],
      confidence: 70,
    });
  }

  // R-DATA-02: No party records
  if (input.parties.length === 0) {
    triggered.push({
      rule_id: "R-DATA-02",
      rule_name: "Missing Party Records",
      category: "DataIntegrity",
      severity: "Medium",
      impact_inr: 0,
      explanation: "No party records (buyers/sellers) found for this registration.",
      fields_used: ["parties"],
      calculations: [{ label: "Party Count", value: "0" }],
      confidence: 70,
    });
  }

  // ── Phase 2 Rules ──

  // R-MV-01: Declared value < expected by >15%
  if (input.expected_value > 0 && input.declared_value > 0) {
    const mvDeviation =
      ((input.declared_value - input.expected_value) / input.expected_value) * 100;
    if (mvDeviation < -15) {
      const mvGap = input.expected_value - input.declared_value;
      triggered.push({
        rule_id: "R-MV-01",
        rule_name: "Declared Value Below Expected",
        category: "MarketValueRisk",
        severity: "High",
        impact_inr: mvGap,
        explanation: `Declared value (₹${input.declared_value.toLocaleString("en-IN")}) is ${Math.abs(mvDeviation).toFixed(1)}% below expected (₹${input.expected_value.toLocaleString("en-IN")}).`,
        fields_used: ["declared_value", "expected_value"],
        calculations: [
          { label: "Declared Value", value: `₹${input.declared_value.toLocaleString("en-IN")}` },
          { label: "Expected Value", value: `₹${input.expected_value.toLocaleString("en-IN")}` },
          { label: "Deviation", value: `${mvDeviation.toFixed(1)}%` },
          { label: "Value Gap", value: `₹${mvGap.toLocaleString("en-IN")}` },
        ],
        confidence: 82,
      });
    }
  }

  // R-MV-02: Current unit rate dropped >20% vs previous year
  if (input.unit_rate_previous > 0 && input.unit_rate_current > 0) {
    const rateDrop =
      ((input.unit_rate_current - input.unit_rate_previous) / input.unit_rate_previous) * 100;
    if (rateDrop < -20) {
      triggered.push({
        rule_id: "R-MV-02",
        rule_name: "Unit Rate Drop vs Previous Year",
        category: "MarketValueRisk",
        severity: "Medium",
        impact_inr: 0,
        explanation: `Current unit rate (₹${input.unit_rate_current.toLocaleString("en-IN")}) dropped ${Math.abs(rateDrop).toFixed(1)}% from previous year (₹${input.unit_rate_previous.toLocaleString("en-IN")}).`,
        fields_used: ["unit_rate_current", "unit_rate_previous"],
        calculations: [
          { label: "Current Rate", value: `₹${input.unit_rate_current.toLocaleString("en-IN")}` },
          { label: "Previous Rate", value: `₹${input.unit_rate_previous.toLocaleString("en-IN")}` },
          { label: "Drop", value: `${rateDrop.toFixed(1)}%` },
        ],
        confidence: 75,
      });
    }
  }

  // R-MV-03: Unit rate < 50% of nearby median
  if (input.nearby_median_rate > 0 && input.unit_rate_current > 0) {
    const medianRatio = (input.unit_rate_current / input.nearby_median_rate) * 100;
    if (medianRatio < 50) {
      triggered.push({
        rule_id: "R-MV-03",
        rule_name: "Unit Rate Below Nearby Median",
        category: "MarketValueRisk",
        severity: "Medium",
        impact_inr: 0,
        explanation: `Current unit rate (₹${input.unit_rate_current.toLocaleString("en-IN")}) is only ${medianRatio.toFixed(0)}% of nearby median (₹${input.nearby_median_rate.toLocaleString("en-IN")}).`,
        fields_used: ["unit_rate_current", "nearby_median_rate"],
        calculations: [
          { label: "Current Rate", value: `₹${input.unit_rate_current.toLocaleString("en-IN")}` },
          { label: "Nearby Median", value: `₹${input.nearby_median_rate.toLocaleString("en-IN")}` },
          { label: "Ratio", value: `${medianRatio.toFixed(0)}%` },
        ],
        confidence: 72,
      });
    }
  }

  // Exemption rules
  for (const ex of input.exemptions) {
    // R-EX-01: Exemption on ineligible doc type
    if (!ex.doc_type_eligible) {
      triggered.push({
        rule_id: "R-EX-01",
        rule_name: "Exemption on Ineligible Doc Type",
        category: "ExemptionRisk",
        severity: "High",
        impact_inr: ex.amount,
        explanation: `Exemption "${ex.code}" claimed on a document type that is not eligible. Amount: ₹${ex.amount.toLocaleString("en-IN")}.`,
        fields_used: ["exemptions.code", "exemptions.doc_type_eligible"],
        calculations: [
          { label: "Exemption Code", value: ex.code },
          { label: "Amount", value: `₹${ex.amount.toLocaleString("en-IN")}` },
          { label: "Doc Type Eligible", value: "No" },
        ],
        confidence: 88,
      });
      break; // one hit per rule
    }
  }

  for (const ex of input.exemptions) {
    // R-EX-02: Exemption amount exceeds cap
    if (ex.cap_amount > 0 && ex.amount > ex.cap_amount) {
      triggered.push({
        rule_id: "R-EX-02",
        rule_name: "Exemption Exceeds Cap",
        category: "ExemptionRisk",
        severity: "High",
        impact_inr: ex.amount - ex.cap_amount,
        explanation: `Exemption "${ex.code}" amount (₹${ex.amount.toLocaleString("en-IN")}) exceeds cap (₹${ex.cap_amount.toLocaleString("en-IN")}).`,
        fields_used: ["exemptions.amount", "exemptions.cap_amount"],
        calculations: [
          { label: "Exemption Amount", value: `₹${ex.amount.toLocaleString("en-IN")}` },
          { label: "Cap Amount", value: `₹${ex.cap_amount.toLocaleString("en-IN")}` },
          { label: "Excess", value: `₹${(ex.amount - ex.cap_amount).toLocaleString("en-IN")}` },
        ],
        confidence: 90,
      });
      break;
    }
  }

  // R-EX-03: Same party used exemption >2 times
  const repeatExemptions = input.exemptions.filter((ex) => ex.repeat_usage_count > 2);
  if (repeatExemptions.length > 0) {
    const ex = repeatExemptions[0];
    triggered.push({
      rule_id: "R-EX-03",
      rule_name: "Repeat Exemption Usage",
      category: "ExemptionRisk",
      severity: "Medium",
      impact_inr: ex.amount,
      explanation: `Exemption "${ex.code}" has been used ${ex.repeat_usage_count} times by the same party (threshold: 2).`,
      fields_used: ["exemptions.code", "exemptions.repeat_usage_count"],
      calculations: [
        { label: "Exemption Code", value: ex.code },
        { label: "Usage Count", value: `${ex.repeat_usage_count}` },
        { label: "Threshold", value: "2" },
      ],
      confidence: 78,
    });
  }

  // R-EX-04: Multiple exemptions on single case
  if (input.exemptions.length > 1) {
    const totalExemptAmt = input.exemptions.reduce((s, e) => s + e.amount, 0);
    triggered.push({
      rule_id: "R-EX-04",
      rule_name: "Multiple Exemptions on Single Case",
      category: "ExemptionRisk",
      severity: "Medium",
      impact_inr: totalExemptAmt,
      explanation: `${input.exemptions.length} exemptions claimed on a single registration totalling ₹${totalExemptAmt.toLocaleString("en-IN")}.`,
      fields_used: ["exemptions"],
      calculations: [
        { label: "Exemption Count", value: `${input.exemptions.length}` },
        { label: "Total Amount", value: `₹${totalExemptAmt.toLocaleString("en-IN")}` },
      ],
      confidence: 72,
    });
  }

  // R-COMP-05: Holiday registration missing fee
  if (input.holiday_registration && gap > 0) {
    triggered.push({
      rule_id: "R-COMP-05",
      rule_name: "Holiday Registration Missing Fee",
      category: "HolidayFee",
      severity: "Medium",
      impact_inr: gap,
      explanation: `Registration on a holiday/weekend but additional holiday fee not found in payments. Gap: ₹${gap.toLocaleString("en-IN")}.`,
      fields_used: ["holiday_registration", "receipts"],
      calculations: [
        { label: "Holiday Registration", value: "Yes" },
        { label: "Fee Gap", value: `₹${gap.toLocaleString("en-IN")}` },
      ],
      confidence: 68,
    });
  }

  // ── Aggregate results ──

  const signalSet = new Set<LeakageSignal>();
  for (const rule of triggered) {
    const cat = rule.category;
    if (cat === "RevenueGap") signalSet.add("RevenueGap");
    else if (cat === "ChallanDelay") signalSet.add("ChallanDelay");
    else if (cat === "ProhibitedLand") signalSet.add("ProhibitedLand");
    else if (cat === "DataIntegrity") signalSet.add("DataIntegrity");
    else if (cat === "MarketValueRisk") signalSet.add("MarketValueRisk");
    else if (cat === "ExemptionRisk") signalSet.add("ExemptionRisk");
    else if (cat === "HolidayFee") {
      signalSet.add("HolidayFee");
      signalSet.add("RevenueGap");
    }
  }
  const leakage_signals = Array.from(signalSet);

  const totalImpact = triggered.reduce((s, r) => s + r.impact_inr, 0);

  // Risk score: weighted by severity
  let riskScore = 0;
  for (const rule of triggered) {
    if (rule.severity === "High") riskScore += 20;
    else if (rule.severity === "Medium") riskScore += 10;
    else riskScore += 5;
  }
  riskScore = Math.min(100, riskScore);

  const risk_level: RiskLevel = riskScore >= 60 ? "High" : riskScore >= 30 ? "Medium" : "Low";

  const avgConfidence =
    triggered.length > 0
      ? Math.round(triggered.reduce((s, r) => s + r.confidence, 0) / triggered.length)
      : 0;

  return {
    triggered_rules: triggered,
    leakage_signals,
    risk_score: riskScore,
    risk_level,
    confidence: avgConfidence,
    impact_amount_inr: totalImpact,
    gap_inr: gap,
    payable_total_inr: payableTotal,
  };
}
