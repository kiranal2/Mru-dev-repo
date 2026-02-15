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
      return "Spike Detected";
    case "drop":
      return "Drop Detected";
    case "drift":
      return "Gradual Drift";
    case "seasonal":
      return "Seasonal Pattern";
    default:
      return type;
  }
}

export default function InsightsPage() {
  const { data: patterns, loading, error, refetch } = useIGRSPatterns();

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded" />
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">AI Insights</h1>
        <p className="text-sm text-muted-foreground">
          {patterns.length} pattern{patterns.length !== 1 ? "s" : ""} detected
        </p>
      </div>

      {patterns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No patterns detected at this time. The analytics engine will surface
              insights as more data becomes available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patterns.map((pattern) => (
            <Card key={pattern.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={patternTypeVariant(pattern.type)}>
                    {patternTypeLabel(pattern.type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{pattern.period}</span>
                </div>
                <CardTitle className="text-base mt-2">{pattern.metric}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <p className="text-sm text-muted-foreground">{pattern.explanation}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold">{pattern.magnitude}</span>
                  {pattern.office && (
                    <span className="text-xs text-muted-foreground">
                      Office: {pattern.office}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
