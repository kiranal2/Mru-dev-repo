"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Star, FileText, Table2, GitMerge, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DynamicSheet {
  id: string;
  name: string;
  entity: string;
  sourceType: "Prompt" | "Template" | "Recon";
  promptSummary?: string;
  rowCount: number;
  lastRefreshedAt?: string;
  isFavorite: boolean;
  status: "OK" | "Needs Refresh" | "Error";
  ownerName: string;
}

interface SheetsListProps {
  sheets: DynamicSheet[];
  activeSheetId?: string;
  onSelectSheet: (sheetId: string) => void;
  onToggleFavorite: (sheetId: string) => void;
  isLoading?: boolean;
}

export function SheetsList({
  sheets,
  activeSheetId,
  onSelectSheet,
  onToggleFavorite,
  isLoading = false,
}: SheetsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("All");

  const filteredSheets = useMemo(() => {
    let filtered = [...sheets];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sheet) =>
          sheet.name.toLowerCase().includes(query) ||
          sheet.promptSummary?.toLowerCase().includes(query)
      );
    }

    if (filterType === "Favorites") {
      filtered = filtered.filter((sheet) => sheet.isFavorite);
    } else if (filterType === "Mine") {
      filtered = filtered.filter((sheet) => sheet.ownerName === "You");
    }

    return filtered;
  }, [sheets, searchQuery, filterType]);

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "Prompt":
        return <FileText className="h-3.5 w-3.5" />;
      case "Template":
        return <Table2 className="h-3.5 w-3.5" />;
      case "Recon":
        return <GitMerge className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OK":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            OK
          </Badge>
        );
      case "Needs Refresh":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Needs Refresh
          </Badge>
        );
      case "Error":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-4 border-b bg-white">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Data Templates</h2>

        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search sheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Sheets</SelectItem>
              <SelectItem value="Favorites">Favorites</SelectItem>
              <SelectItem value="Mine">My Sheets</SelectItem>
              <SelectItem value="Shared">Shared with Me</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredSheets.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-slate-500">
                {searchQuery || filterType !== "All"
                  ? "No sheets match your search"
                  : "No sheets yet"}
              </p>
            </div>
          ) : (
            filteredSheets.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() => onSelectSheet(sheet.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors",
                  "hover:bg-white hover:border-slate-300",
                  activeSheetId === sheet.id
                    ? "bg-blue-50 border-blue-300 border-l-4"
                    : "bg-white border-slate-200"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-900 truncate">{sheet.name}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(sheet.id);
                    }}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        sheet.isFavorite
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-400 hover:text-amber-400"
                      )}
                    />
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                  <span className="truncate">{sheet.entity}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {getSourceIcon(sheet.sourceType)}
                    <span>{sheet.sourceType}</span>
                  </div>
                  <span>•</span>
                  <span>{sheet.ownerName}</span>
                </div>

                {sheet.promptSummary && (
                  <div className="text-xs text-slate-500 mb-2 line-clamp-2">
                    {sheet.promptSummary}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {sheet.rowCount.toLocaleString()} rows
                    </Badge>
                    {getStatusBadge(sheet.status)}
                  </div>
                </div>

                {sheet.lastRefreshedAt && (
                  <div className="text-xs text-slate-400 mt-1">
                    Refreshed {format(new Date(sheet.lastRefreshedAt), "MMM d, h:mm a")}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
