"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubsidiaryNode } from "../types";

interface SubsidiaryTreeProps {
  nodes: SubsidiaryNode[];
  level?: number;
  pendingSubsidiaries: string[];
  expandedSubsidiaries: Set<string>;
  toggleSubsidiaryExpanded: (id: string) => void;
  handleSubsidiaryToggle: (subsidiary: string, checked: boolean) => void;
}

export function SubsidiaryTree({
  nodes,
  level = 0,
  pendingSubsidiaries,
  expandedSubsidiaries,
  toggleSubsidiaryExpanded,
  handleSubsidiaryToggle,
}: SubsidiaryTreeProps) {
  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedSubsidiaries.has(node.id);
        const isSelected = pendingSubsidiaries.includes(node.label);

        return (
          <div key={node.id}>
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer",
                level > 0 && "ml-4"
              )}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubsidiaryExpanded(node.id);
                  }}
                  className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-600" />
                  )}
                </button>
              ) : (
                <div className="w-4" />
              )}
              <label className="flex items-center gap-2 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSubsidiaryToggle(node.label, e.target.checked);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm">{node.label}</span>
              </label>
            </div>
            {hasChildren && isExpanded && (
              <div className="ml-2">
                <SubsidiaryTree
                  nodes={node.children!}
                  level={level + 1}
                  pendingSubsidiaries={pendingSubsidiaries}
                  expandedSubsidiaries={expandedSubsidiaries}
                  toggleSubsidiaryExpanded={toggleSubsidiaryExpanded}
                  handleSubsidiaryToggle={handleSubsidiaryToggle}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
