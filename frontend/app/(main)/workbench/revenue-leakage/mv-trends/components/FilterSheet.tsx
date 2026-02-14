"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MVHotspotItem } from "@/lib/revenue-leakage/types";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sroFilter: string;
  setSroFilter: (v: string) => void;
  districtFilter: string;
  setDistrictFilter: (v: string) => void;
  minTxns: string;
  setMinTxns: (v: string) => void;
  minLoss: string;
  setMinLoss: (v: string) => void;
  hotspots: MVHotspotItem[];
}

export function FilterSheet({
  open,
  onOpenChange,
  sroFilter,
  setSroFilter,
  districtFilter,
  setDistrictFilter,
  minTxns,
  setMinTxns,
  minLoss,
  setMinLoss,
  hotspots,
}: FilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[360px] sm:max-w-[360px]">
        <SheetHeader>
          <SheetTitle>More Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-slate-500">SRO</label>
            <Select value={sroFilter} onValueChange={setSroFilter}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Select SRO" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SROs</SelectItem>
                {Array.from(new Set(hotspots.map((h) => h.sro_code))).map((sro) => (
                  <SelectItem key={sro} value={sro}>
                    {sro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500">District</label>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {Array.from(new Set(hotspots.map((h) => h.district))).map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Min Transactions</label>
            <Input
              value={minTxns}
              onChange={(e) => setMinTxns(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Min Loss (&#8377;)</label>
            <Input
              value={minLoss}
              onChange={(e) => setMinLoss(e.target.value)}
              placeholder="e.g. 100000"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => onOpenChange(false)}>Apply</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
