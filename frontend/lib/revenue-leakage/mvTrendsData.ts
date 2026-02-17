import {
  MVHotspotItem,
  MVHotspotDetail,
  MVQuarterTrend,
  MVSroTile,
  MVOfficeComparison,
  MVRateCardAnomaly,
  MVDeclaredTrend,
  MVSeasonalPattern,
  MVSeverity,
  MVLocationType,
  MVHotspotStatus,
} from "./types";

type SroInfo = { code: string; name: string; district: string };
type LocationSeed = MVHotspotItem & { id: string };

const createRng = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const seedFromString = (input: string) =>
  input.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 2147483647, 7);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatQuarter = (year: number, quarter: number) => `${year}-Q${quarter}`;

const getRecentQuarters = (count: number) => {
  const now = new Date();
  let year = now.getFullYear();
  let quarter = Math.floor(now.getMonth() / 3) + 1;
  const quarters: string[] = [];
  for (let i = 0; i < count; i += 1) {
    quarters.push(formatQuarter(year, quarter));
    quarter -= 1;
    if (quarter === 0) {
      quarter = 4;
      year -= 1;
    }
  }
  return quarters.reverse();
};

const rng = createRng(42);

const randFloat = (min: number, max: number) => min + (max - min) * rng();
const randInt = (min: number, max: number) => Math.round(randFloat(min, max));
const pick = <T>(list: T[]) => list[Math.floor(rng() * list.length)];

const DISTRICTS = [
  "Srikakulam",
  "Vizianagaram",
  "Visakhapatnam",
  "East Godavari",
  "West Godavari",
  "Krishna",
  "Guntur",
  "Prakasam",
  "Nellore",
  "Kurnool",
  "Anantapur",
  "YSR Kadapa",
  "Chittoor",
];

const SRO_SUFFIXES = ["Main", "North", "South", "Central", "East", "West", "Rural", "Urban"];
const VILLAGE_NAMES = [
  "Kondapuram",
  "Nallampalli",
  "Peddur",
  "Thiruvalam",
  "Mettur",
  "Sarapadu",
  "Manjakkudi",
  "Kovilpatti",
  "Arumbakkam",
  "Vedapatti",
  "Pudupalayam",
  "Kattur",
  "Perundurai",
  "Uthukuli",
  "Melur",
];

const generateSros = (): SroInfo[] =>
  Array.from({ length: 140 }, (_, i) => {
    const district = DISTRICTS[i % DISTRICTS.length];
    const suffix = SRO_SUFFIXES[(i + 3) % SRO_SUFFIXES.length];
    const code = `SR${String(i + 1).padStart(2, "0")}`;
    return { code, name: `${district} ${suffix}`, district };
  });

const severityFromDrr = (drr: number): MVSeverity => {
  if (drr < 0.5) return "Critical";
  if (drr < 0.7) return "High";
  if (drr < 0.85) return "Medium";
  if (drr < 0.95) return "Watch";
  return "Normal";
};

const colorFromDrr = (drr: number) => {
  if (drr < 0.7) return "red";
  if (drr < 0.85) return "orange";
  if (drr < 1.0) return "yellow";
  return "green";
};

const generateLocations = (sros: SroInfo[]): LocationSeed[] => {
  const locations: LocationSeed[] = [];
  for (let i = 0; i < 1000; i += 1) {
    const sro = pick(sros);
    const isUrban = rng() > 0.55;
    const locationType: MVLocationType = isUrban ? "URBAN" : "RURAL";
    const label = isUrban
      ? `Ward ${randInt(1, 9)}, Block ${randInt(1, 6)}-${randInt(7, 12)}`
      : `Village ${pick(VILLAGE_NAMES)} Sy.${randInt(41, 180)}-${randInt(181, 240)}`;
    const drrRoll = rng();
    let drr = 1.02;
    if (drrRoll < 0.02) drr = randFloat(0.35, 0.49);
    else if (drrRoll < 0.08) drr = randFloat(0.5, 0.69);
    else if (drrRoll < 0.2) drr = randFloat(0.7, 0.84);
    else if (drrRoll < 0.4) drr = randFloat(0.85, 0.94);
    else drr = randFloat(0.95, 1.18);

    const rateCard = randInt(6000, 22000);
    const medianDeclared = Math.round(rateCard * drr);
    const transactionCount = drr < 0.85 ? randInt(5, 24) : randInt(1, 20);
    const consecutiveQuarters = drr < 0.85 ? randInt(2, 4) : randInt(1, 3);
    const unitGap = Math.max(0, rateCard - medianDeclared);
    const extentFactor = randInt(35, 120);
    const estimatedLoss = Math.round(unitGap * transactionCount * extentFactor);
    const status: MVHotspotStatus = drr < 0.85 ? pick(["New", "In Review", "Confirmed"]) : "New";

    locations.push({
      id: `LOC-${String(i + 1).padStart(4, "0")}`,
      case_id: "",
      sro_code: sro.code,
      sro_name: sro.name,
      district: sro.district,
      location_label: label,
      location_type: locationType,
      drr: Number(drr.toFixed(2)),
      rate_card_unit_rate: rateCard,
      median_declared: medianDeclared,
      transaction_count: transactionCount,
      severity: severityFromDrr(drr),
      estimated_loss: estimatedLoss,
      consecutive_quarters: consecutiveQuarters,
      status,
      assigned_to:
        drr < 0.85 && rng() > 0.6
          ? pick(["DR", "Joint IG 1", "Joint IG 2", "Addl IG", "IG", "Audit DR"])
          : null,
      rules_triggered: [],
    });
  }
  return locations;
};

const buildHotspots = (locations: LocationSeed[]): MVHotspotItem[] => {
  const candidates = locations.filter(
    (loc) => loc.drr < 0.85 && loc.transaction_count >= 5 && loc.consecutive_quarters >= 2
  );
  const sorted = [...candidates].sort((a, b) => a.drr - b.drr);
  const selected = sorted.slice(0, 127);
  return selected.map((loc, idx) => {
    const slug = loc.location_label
      .replace(/[^A-Za-z]/g, "")
      .slice(0, 4)
      .toUpperCase();
    const caseId = `MV-2024-${loc.sro_code}-${slug || "HOT"}-${String(idx + 1).padStart(3, "0")}`;
    const rules = ["R-MV-007"];
    if (loc.drr < 0.7) rules.push("R-MV-003");
    if (loc.consecutive_quarters >= 3) rules.push("R-MV-006");
    if (loc.drr < 0.5) rules.push("R-MV-002");
    return {
      ...loc,
      case_id: caseId,
      rules_triggered: rules,
    };
  });
};

const sros = generateSros();
const locationSeeds = generateLocations(sros);
const hotspots = buildHotspots(locationSeeds);

const totalTransactions = locationSeeds.reduce((sum, loc) => sum + loc.transaction_count, 0);
const hotspotTransactions = hotspots.reduce((sum, item) => sum + item.transaction_count, 0);
const totalLoss = hotspots.reduce((sum, item) => sum + item.estimated_loss, 0);

const quarters = getRecentQuarters(8);

const quarterly_trend: MVQuarterTrend[] = quarters.map((quarter, i) => {
  const base = 0.92 + Math.sin(i / 2) * 0.03;
  const avg_drr = clamp(base + randFloat(-0.015, 0.015), 0.75, 1.05);
  const hotspot_count = Math.round(90 + i * 5 + randFloat(-6, 8));
  const loss = Math.round((totalLoss / 8) * (0.9 + i * 0.04));
  return { quarter, avg_drr: Number(avg_drr.toFixed(2)), hotspot_count, loss };
});

const top_sros = (() => {
  const map = new Map<
    string,
    { sro_code: string; sro_name: string; avg_drr: number; hotspots: number; loss: number }
  >();
  hotspots.forEach((h) => {
    const entry = map.get(h.sro_code) || {
      sro_code: h.sro_code,
      sro_name: h.sro_name,
      avg_drr: 0,
      hotspots: 0,
      loss: 0,
    };
    entry.hotspots += 1;
    entry.loss += h.estimated_loss;
    entry.avg_drr += h.drr;
    map.set(h.sro_code, entry);
  });
  return Array.from(map.values())
    .map((sro) => ({ ...sro, avg_drr: Number((sro.avg_drr / sro.hotspots).toFixed(2)) }))
    .sort((a, b) => b.loss - a.loss)
    .slice(0, 10);
})();

const mvHighlights = [
  {
    icon: "trending-down",
    text: `Total undervaluation gap is ₹${Math.round((totalLoss / 10000000) * 10) / 10}Cr - up 18.5% vs last quarter`,
  },
  {
    icon: "map-pin",
    text: `Top hotspot SRO: ${top_sros[0]?.sro_code || "-"} - ${top_sros[0]?.sro_name || "-"} (${top_sros[0]?.hotspots || 0} hotspots, ₹${Math.round((top_sros[0]?.loss || 0) / 100000)}L)`,
  },
  {
    icon: "alert",
    text: `${hotspots.filter((h) => h.severity === "Critical").length} Critical hotspots requiring immediate investigation`,
  },
  { icon: "bar-chart", text: `SR05 vs SR06 DRR gap: 0.48 - highest cross-office divergence` },
  { icon: "clock", text: `3 new hotspots detected this quarter` },
  { icon: "shield", text: `Rate card growth anomaly: Village Kondapuram +67.1% (Z-score 4.2)` },
];

const recent_signals = hotspots.slice(0, 6).map((h, idx) => ({
  signal_id: `MVS-2024-${String(idx + 1).padStart(5, "0")}`,
  rule_id: h.rules_triggered[0],
  sro_code: h.sro_code,
  severity: h.severity.toUpperCase(),
  drr: h.drr,
  loss: h.estimated_loss,
}));

const mvDashboard = {
  total_hotspots: hotspots.length,
  total_hotspots_change_pct: 14.2,
  critical_hotspots: hotspots.filter((h) => h.severity === "Critical").length,
  high_hotspots: hotspots.filter((h) => h.severity === "High").length,
  medium_hotspots: hotspots.filter((h) => h.severity === "Medium").length,
  watch_hotspots: hotspots.filter((h) => h.severity === "Watch").length,
  affected_transactions: hotspotTransactions,
  estimated_annual_loss: Math.round(totalLoss * 4),
  pct_in_hotspots: Number(
    ((hotspotTransactions / Math.max(1, totalTransactions)) * 100).toFixed(1)
  ),
  locations_monitored: 48234,
  quarterly_trend,
  top_sros,
  highlights: mvHighlights,
  recent_signals,
  last_batch: {
    run_at: "2024-12-13T02:30:00Z",
    status: "SUCCESS",
    locations: 48234,
    duration_min: 120,
  },
};

const sroTiles: MVSroTile[] = sros.map((sro) => {
  const locations = locationSeeds.filter((loc) => loc.sro_code === sro.code);
  const avgDrr = locations.reduce((sum, loc) => sum + loc.drr, 0) / Math.max(1, locations.length);
  const hotspotCount = hotspots.filter((loc) => loc.sro_code === sro.code).length;
  const transactionCount = locations.reduce((sum, loc) => sum + loc.transaction_count, 0);
  const estimatedLoss = hotspots
    .filter((loc) => loc.sro_code === sro.code)
    .reduce((sum, loc) => sum + loc.estimated_loss, 0);
  return {
    sro_code: sro.code,
    sro_name: sro.name,
    district: sro.district,
    avg_drr: Number(avgDrr.toFixed(2)),
    hotspot_count: hotspotCount,
    transaction_count: transactionCount,
    estimated_loss: estimatedLoss,
    color: colorFromDrr(avgDrr),
  };
});

const mvPairs: MVOfficeComparison[] = Array.from({ length: 8 }, (_, i) => {
  const sroA = sros[i * 3];
  const sroB = sros[i * 3 + 1];
  const baseA = randFloat(0.85, 1.2);
  const baseB = i < 3 ? baseA - randFloat(0.32, 0.48) : baseA - randFloat(0.08, 0.2);
  const drrGap = Math.abs(baseA - baseB);
  const flagged = drrGap > 0.3;
  const rateCardAvgA = randInt(10000, 16000);
  const rateCardAvgB = randInt(9000, 15000);
  const declaredA = Math.round(rateCardAvgA * baseA);
  const declaredB = Math.round(rateCardAvgB * baseB);
  return {
    sro_a: {
      code: sroA.code,
      name: sroA.name,
      avg_drr: Number(baseA.toFixed(2)),
      txn_count: randInt(120, 240),
      rate_card_avg: rateCardAvgA,
      declared_avg: declaredA,
    },
    sro_b: {
      code: sroB.code,
      name: sroB.name,
      avg_drr: Number(baseB.toFixed(2)),
      txn_count: randInt(110, 220),
      rate_card_avg: rateCardAvgB,
      declared_avg: declaredB,
    },
    drr_gap: Number(drrGap.toFixed(2)),
    lower_drr_sro: baseA < baseB ? sroA.code : sroB.code,
    is_flagged: flagged,
    severity: flagged ? "High" : "Medium",
    estimated_impact: Math.round(randFloat(600000, 2200000)),
    rate_card_gap_pct: Number(
      (((rateCardAvgA - rateCardAvgB) / Math.max(rateCardAvgA, rateCardAvgB)) * 100).toFixed(1)
    ),
    declared_gap_pct: Number(
      (((declaredA - declaredB) / Math.max(declaredA, declaredB)) * 100).toFixed(1)
    ),
  };
});

const rateCardAnomalies: MVRateCardAnomaly[] = Array.from({ length: 12 }, (_, i) => {
  const loc = pick(locationSeeds);
  const highGrowth = i < 2;
  const decline = i === 2;
  const growthPct = highGrowth
    ? randFloat(0.4, 0.6)
    : decline
      ? randFloat(-0.06, -0.02)
      : randFloat(0.08, 0.18);
  const prevRate = loc.rate_card_unit_rate;
  const currentRate = Math.round(prevRate * (1 + growthPct));
  const zScore = highGrowth
    ? randFloat(3.2, 4.5)
    : decline
      ? randFloat(-2.8, -2.1)
      : randFloat(1.4, 2.2);
  return {
    location_label: loc.location_label,
    sro_code: loc.sro_code,
    sro_name: loc.sro_name,
    prev_rate: prevRate,
    current_rate: currentRate,
    growth_pct: Number((growthPct * 100).toFixed(1)),
    sro_avg_growth: Number(randFloat(8, 15).toFixed(1)),
    z_score: Number(zScore.toFixed(1)),
    rule_id: zScore > 2.5 ? "R-MV-001" : "R-MV-002",
    severity: zScore > 2.5 ? "High" : "Critical",
  };
});

const declaredTrends: MVDeclaredTrend[] = Array.from({ length: 12 }, () => {
  const loc = pick(locationSeeds);
  const q1 = randFloat(-2, 6);
  const q2 = randFloat(-3, 5);
  const q3 = randFloat(-4, 4);
  const q4 = randFloat(-5, 4);
  const rateGrowth = randFloat(8, 18);
  const divergence = Number((rateGrowth - (q1 + q2 + q3 + q4) / 4).toFixed(1));
  const ruleId = divergence > 10 ? "R-MV-005" : q4 < 0 ? "R-MV-004" : "R-MV-003";
  return {
    location_label: loc.location_label,
    sro_code: loc.sro_code,
    sro_name: loc.sro_name,
    q1_growth: Number(q1.toFixed(1)),
    q2_growth: Number(q2.toFixed(1)),
    q3_growth: Number(q3.toFixed(1)),
    q4_growth: Number(q4.toFixed(1)),
    rate_card_growth: Number(rateGrowth.toFixed(1)),
    divergence,
    rule_id: ruleId,
    severity: divergence > 10 ? "High" : q4 < 0 ? "Medium" : "Watch",
  };
});

const seasonalPatterns: MVSeasonalPattern[] = Array.from({ length: 8 }, () => {
  const loc = pick(locationSeeds);
  const deltas = Array.from({ length: 12 }, () => Number(randFloat(-0.22, 0.2).toFixed(2)));
  const persistent = deltas.map((d, idx) => (d < -0.15 ? idx : -1)).filter((idx) => idx >= 0);
  return {
    location_label: loc.location_label,
    sro_code: loc.sro_code,
    sro_name: loc.sro_name,
    monthly_delta: deltas,
    persistent_alerts: persistent.slice(0, 3),
  };
});

const buildHotspotDetail = (hotspot: MVHotspotItem): MVHotspotDetail => {
  const localRand = createRng(seedFromString(hotspot.case_id));
  const randLocalFloat = (min: number, max: number) => min + (max - min) * localRand();
  const randLocalInt = (min: number, max: number) => Math.round(randLocalFloat(min, max));
  const transactionCount = randLocalInt(6, 14);
  const baseDate = new Date("2024-01-15T00:00:00Z").getTime();
  const transactions = Array.from({ length: transactionCount }, (_, i) => {
    const declared = Math.round(hotspot.median_declared * randLocalFloat(0.92, 1.08));
    const extent = randLocalInt(120, 520);
    const date = new Date(baseDate + i * 8640000 + randLocalInt(0, 8640000))
      .toISOString()
      .slice(0, 10);
    const drr = Number((declared / hotspot.rate_card_unit_rate).toFixed(2));
    return {
      doc_key: `${hotspot.sro_code}/${randLocalInt(1, 3)}/${randLocalInt(1000, 9000)}/2024`,
      date,
      extent,
      extent_unit: "sq.yd",
      declared_per_unit: declared,
      rate_card_unit_rate: hotspot.rate_card_unit_rate,
      drr,
      gap: Math.round(Math.max(0, hotspot.rate_card_unit_rate - declared) * extent),
    };
  });

  const trend_history = quarters.map((quarter, idx) => {
    const drift = randLocalFloat(-0.05, 0.04);
    const drr = clamp(hotspot.drr + drift + idx * 0.01, 0.35, 1.2);
    const sroAvg = clamp(0.88 + randLocalFloat(-0.05, 0.08), 0.75, 1.15);
    return { quarter, drr: Number(drr.toFixed(2)), sro_avg: Number(sroAvg.toFixed(2)) };
  });

  const rate_card_history = Array.from({ length: 5 }, (_, i) => {
    const year = 2020 + i;
    const prev_rate = Math.round(hotspot.rate_card_unit_rate * (0.82 + i * 0.04));
    const unit_rate = Math.round(prev_rate * (1 + randLocalFloat(0.06, 0.16)));
    return { year: String(year), unit_rate, prev_rate };
  });

  const peerLocations = locationSeeds
    .filter(
      (loc) => loc.sro_code === hotspot.sro_code && loc.location_label !== hotspot.location_label
    )
    .slice(0, 4);
  const peer_locations = [
    { label: hotspot.location_label, drr: hotspot.drr, txn_count: hotspot.transaction_count },
    ...peerLocations.map((loc) => ({
      label: loc.location_label,
      drr: loc.drr,
      txn_count: loc.transaction_count,
    })),
    {
      label: `${hotspot.sro_code} Average`,
      drr: Number((0.95 + randLocalFloat(-0.05, 0.08)).toFixed(2)),
      txn_count: 0,
      is_sro_avg: true,
    },
  ];

  const rules_detail = hotspot.rules_triggered.map((ruleId) => ({
    rule_id: ruleId,
    rule_name:
      ruleId === "R-MV-007"
        ? "Undervaluation Hotspot"
        : ruleId === "R-MV-003"
          ? "Stagnant Declared Values"
          : ruleId === "R-MV-006"
            ? "Seasonal Undervaluation Pattern"
            : ruleId === "R-MV-002"
              ? "Rate Card Decline"
              : "MV Trend Rule",
    severity: hotspot.severity,
    explanation:
      ruleId === "R-MV-007"
        ? `DRR ${hotspot.drr} < 0.85 threshold, ${hotspot.transaction_count} transactions, ${hotspot.consecutive_quarters} quarters.`
        : `Detected sustained divergence between declared values and rate card growth.`,
    thresholds: [
      { label: "DRR < 0.85", value: `Actual: ${hotspot.drr}` },
      { label: "Txns >= 5", value: `Actual: ${hotspot.transaction_count}` },
      { label: "Quarters >= 2", value: `Actual: ${hotspot.consecutive_quarters}` },
    ],
    fields_used: ["FINAL_TAXABLE_VALUE", "EXTENT", "UNIT_RATE"],
    confidence: randLocalInt(84, 97),
    impact: hotspot.estimated_loss,
  }));

  return {
    ...hotspot,
    confidence: randLocalInt(88, 97),
    transactions,
    peer_locations,
    trend_history,
    rate_card_history,
    scatter_points: transactions.map((t) => ({
      date: t.date,
      declared_per_unit: t.declared_per_unit,
      drr: t.drr,
      doc_key: t.doc_key,
      rate_card_unit_rate: t.rate_card_unit_rate,
    })),
    rules_detail,
    activity_log: [
      {
        id: `log-${hotspot.case_id}-1`,
        ts: "2024-12-13T02:35:00Z",
        actor: "System",
        action: "Case created",
        detail: "Detected by MV Trend batch run MV-BATCH-20241213",
      },
      {
        id: `log-${hotspot.case_id}-2`,
        ts: "2024-12-14T09:10:00Z",
        actor: "System",
        action: "Status changed",
        detail: `-> ${hotspot.status}`,
      },
    ],
  };
};

const hotspotDetails = new Map<string, MVHotspotDetail>();
hotspots.forEach((hotspot) => {
  hotspotDetails.set(hotspot.case_id, buildHotspotDetail(hotspot));
});

export const mvTrendsData = {
  dashboard: mvDashboard,
  hotspots,
  sroTiles,
  pairs: mvPairs,
  rateCardAnomalies,
  declaredTrends,
  seasonalPatterns,
  quarters,
};

export const getMVHotspotDetail = (caseId: string) => hotspotDetails.get(caseId) || null;

export const getMVLocationsForSro = (sroCode: string) =>
  locationSeeds
    .filter((loc) => loc.sro_code === sroCode)
    .map((loc) => ({
      sro_code: loc.sro_code,
      sro_name: loc.sro_name,
      district: loc.district,
      location_label: loc.location_label,
      location_type: loc.location_type,
      drr: loc.drr,
      hotspot_count: loc.drr < 0.85 ? 1 : 0,
      transaction_count: loc.transaction_count,
      estimated_loss: loc.estimated_loss,
    }));
