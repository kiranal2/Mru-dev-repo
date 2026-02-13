"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { AlignJustify, List } from "lucide-react";
import { DensityMode } from "./cash-app-theme";

interface DensityToggleProps {
  density: DensityMode;
  onDensityChange: (density: DensityMode) => void;
}

export function DensityToggle({ density, onDensityChange }: DensityToggleProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="inline-flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`
                h-7 w-7 p-0 rounded
                transition-all duration-150
                ${
                  density === "compact"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-slate-500 hover:text-slate-700"
                }
              `}
              onClick={() => onDensityChange("compact")}
            >
              <List className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Compact
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`
                h-7 w-7 p-0 rounded
                transition-all duration-150
                ${
                  density === "comfortable"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-slate-500 hover:text-slate-700"
                }
              `}
              onClick={() => onDensityChange("comfortable")}
            >
              <AlignJustify className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Comfortable
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
