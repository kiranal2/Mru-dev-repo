"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AutomationState } from "../types";

interface PromptFinalStepProps {
  automationState: AutomationState;
  onCreateAnother: () => void;
}

export function PromptFinalStep({ automationState, onCreateAnother }: PromptFinalStepProps) {
  return (
    <Card className="p-6 bg-white">
      <h2 className="text-lg font-semibold mb-2">Agent Task Created</h2>
      <p className="text-sm text-blue-600 mb-4">
        Your automation is live. You can pause or adjust it anytime.
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="outline" className="gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Data: Overdue &gt; {automationState.thresholdDays} days
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          Recipient: {automationState.recipient}
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Schedule: Every {automationState.dayOfWeek} @ {automationState.time}{" "}
          {automationState.timezone}
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Channel: {automationState.channel}
        </Badge>
      </div>
      <Button onClick={onCreateAnother}>
        Create another automation
      </Button>
    </Card>
  );
}
