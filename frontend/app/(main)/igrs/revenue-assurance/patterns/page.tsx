"use client";

import { useIGRSPatterns } from "@/hooks/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function patternTypeVariant(
  type: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "spike":
      return "destructive";
    case "drop":
      return "default";
    case "drift":
      return "secondary";
    case "seasonal":
      return "outline";
    default:
      return "outline";
  }
}

function patternTypeLabel(type: string): string {
  switch (type) {
    case "spike":
      return "Spike";
    case "drop":
      return "Drop";
    case "drift":
      return "Drift";
    case "seasonal":
      return "Seasonal";
    default:
      return type;
  }
}

function patternBorderColor(type: string): string {
  switch (type) {
    case "spike":
      return "border-l-red-500";
    case "drop":
      return "border-l-blue-500";
    case "drift":
      return "border-l-amber-500";
    case "seasonal":
      return "border-l-green-500";
    default:
      return "border-l-gray-500";
  }
}

export default function PatternsPage() {
  const { data: patterns, loading, error, refetch } = useIGRSPatterns();

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button onClick={refetch} className="mt-2 text-sm text-red-600 underline">
            Retry
          </button>
        </div>
      </div>
    );

  // Group patterns by type
  const grouped = patterns.reduce<Record<string, typeof patterns>>(
    (acc, p) => {
      const key = p.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    },
    {}
  );

  const typeOrder = ["spike", "drop", "drift", "seasonal"];
  const sortedTypes = Object.keys(grouped).sort(
    (a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pattern Detection</h1>
        <p className="text-sm text-muted-foreground">
          {patterns.length} pattern{patterns.length !== 1 ? "s" : ""} detected
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {sortedTypes.map((type) => (
          <Badge key={type} variant={patternTypeVariant(type)}>
            {patternTypeLabel(type)}: {grouped[type].length}
          </Badge>
        ))}
      </div>

      {patterns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No patterns have been detected yet. The system will surface patterns as
              more data is analyzed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedTypes.map((type) => (
            <div key={type}>
              <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Badge variant={patternTypeVariant(type)}>
                  {patternTypeLabel(type)}
                </Badge>
                <span className="text-muted-foreground text-sm font-normal">
                  ({grouped[type].length} pattern{grouped[type].length !== 1 ? "s" : ""})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped[type].map((pattern) => (
                  <Card
                    key={pattern.id}
                    className={`border-l-4 ${patternBorderColor(pattern.type)}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{pattern.metric}</CardTitle>
                        <span className="text-lg font-bold">{pattern.magnitude}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{pattern.period}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {pattern.explanation}
                      </p>
                      {pattern.office && (
                        <p className="text-xs text-muted-foreground mt-3 border-t pt-2">
                          Office: {pattern.office}
                        </p>
                      )}
                      {/* Chart placeholder */}
                      <div className="mt-4 h-20 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          Chart visualization placeholder
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
