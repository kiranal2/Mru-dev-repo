"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface FilterState {
  search: string;
  bankAccount: string;
  dateRange: string;
  amountRange: string;
  method: string;
  status: string;
  remittanceSource: string;
  assignedTo: string;
}

interface CashAppFilterRailProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function CashAppFilterRail({ filters, onFilterChange }: CashAppFilterRailProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="w-64 flex-shrink-0 pr-4 space-y-4">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">Bank Account</Label>
          <Select value={filters.bankAccount} onValueChange={(v) => updateFilter("bankAccount", v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              <SelectItem value="us-bank">US Bank - *****4521</SelectItem>
              <SelectItem value="chase">Chase - *****7892</SelectItem>
              <SelectItem value="wells">Wells Fargo - *****3456</SelectItem>
              <SelectItem value="boa">Bank of America - *****9012</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Date Range</Label>
          <Select value={filters.dateRange} onValueChange={(v) => updateFilter("dateRange", v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Amount Range</Label>
          <Select value={filters.amountRange} onValueChange={(v) => updateFilter("amountRange", v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Amounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Amounts</SelectItem>
              <SelectItem value="0-10k">$0 - $10,000</SelectItem>
              <SelectItem value="10k-50k">$10,000 - $50,000</SelectItem>
              <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
              <SelectItem value="100k+">$100,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Payment Method</Label>
          <Select value={filters.method} onValueChange={(v) => updateFilter("method", v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="ACH">ACH</SelectItem>
              <SelectItem value="Wire">Wire</SelectItem>
              <SelectItem value="Check">Check</SelectItem>
              <SelectItem value="Credit Card">Credit Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Remittance Source</Label>
          <Select
            value={filters.remittanceSource}
            onValueChange={(v) => updateFilter("remittanceSource", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
              <SelectItem value="Bank Portal">Bank Portal</SelectItem>
              <SelectItem value="EDI">EDI</SelectItem>
              <SelectItem value="API">API</SelectItem>
              <SelectItem value="Manual Upload">Manual Upload</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Assigned To</Label>
          <Select value={filters.assignedTo} onValueChange={(v) => updateFilter("assignedTo", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Anyone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Anyone</SelectItem>
              <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
              <SelectItem value="Michael Roberts">Michael Roberts</SelectItem>
              <SelectItem value="Jessica Martinez">Jessica Martinez</SelectItem>
              <SelectItem value="David Kim">David Kim</SelectItem>
              <SelectItem value="Emily Taylor">Emily Taylor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            onFilterChange({
              search: filters.search,
              bankAccount: "all",
              dateRange: "all",
              amountRange: "all",
              method: "all",
              status: filters.status,
              remittanceSource: "all",
              assignedTo: "all",
            })
          }
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
}

export type { FilterState };
