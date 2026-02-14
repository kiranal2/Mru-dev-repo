export type INRDisplayMode = "auto" | "rupees" | "lakhs" | "crores";

function formatWithCommas(value: number): string {
  const parts = Math.abs(Math.round(value)).toString().split("");
  const result: string[] = [];
  const len = parts.length;
  for (let i = 0; i < len; i++) {
    const posFromRight = len - 1 - i;
    result.push(parts[i]);
    if (posFromRight > 0 && posFromRight === 3) result.push(",");
    else if (posFromRight > 3 && (posFromRight - 3) % 2 === 0) result.push(",");
  }
  return (value < 0 ? "-" : "") + result.join("");
}

export function formatINR(value: number, mode: INRDisplayMode = "auto"): string {
  if (mode === "rupees") {
    return `₹${formatWithCommas(value)}`;
  }
  if (mode === "lakhs") {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  if (mode === "crores") {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }
  // auto
  const abs = Math.abs(value);
  if (abs >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${formatWithCommas(value)}`;
}

export function formatNumberShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString("en-IN");
}
