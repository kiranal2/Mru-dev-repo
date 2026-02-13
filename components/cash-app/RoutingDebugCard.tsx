"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentRouting } from "@/lib/cash-app-types";
import { AlertCircle } from "lucide-react";

interface RoutingDebugCardProps {
  routing?: PaymentRouting;
}

export function RoutingDebugCard({ routing }: RoutingDebugCardProps) {
  if (!routing) return null;

  const getStreamBadgeClass = (stream: string) => {
    const classes: Record<string, string> = {
      AutoMatched: "bg-green-50 text-green-700 border-green-200",
      Exceptions: "bg-red-50 text-red-700 border-red-200",
      Critical: "bg-orange-50 text-orange-700 border-orange-200",
      PendingToPost: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return classes[stream] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <Card className="p-6 border-dashed border-2">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-sm mb-1">
            Routing{" "}
            <Badge variant="outline" className="ml-1 text-xs">
              Admin Only
            </Badge>
          </h3>
          <p className="text-xs text-gray-600">Deterministic routing logic for this payment</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2">Workstream</div>
          <Badge
            variant="outline"
            className={`text-xs ${getStreamBadgeClass(routing.routing_stream)}`}
          >
            {routing.routing_stream}
          </Badge>
        </div>

        {routing.routing_subfilter && (
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2">Sub-filter</div>
            <div className="text-sm font-medium text-gray-900">{routing.routing_subfilter}</div>
          </div>
        )}

        {routing.routing_rules_applied.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2">Applied Rules</div>
            <div className="space-y-1">
              {routing.routing_rules_applied.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="text-gray-400 mt-0.5">→</span>
                  <span className="text-gray-700 font-mono">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
