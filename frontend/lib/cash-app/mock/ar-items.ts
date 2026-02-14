import type { ARItem } from "../types";
import { companies } from "./constants";

export function generateMockARItems(): ARItem[] {
  const items: ARItem[] = [];

  for (let i = 0; i < 40; i++) {
    items.push({
      id: `ar-${3000 + i}`,
      invoiceNumber: `INV-${(30000 + i).toString()}`,
      customerId: `CUST-${(1000 + (i % 20)).toString()}`,
      customerName: companies[i % companies.length],
      amount: Math.floor(Math.random() * 200000) + 1000,
      dueDate: new Date(2024, 11, Math.floor(Math.random() * 28) + 1).toISOString().split("T")[0],
      status: i % 4 === 0 ? "Overdue" : "Open",
      createdAt: new Date(2024, 10, Math.floor(Math.random() * 28) + 1).toISOString(),
    });
  }

  return items;
}
