"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface PromptInputStepProps {
  promptText: string;
  setPromptText: (text: string) => void;
  onBuild: () => void;
}

export function PromptInputStep({ promptText, setPromptText, onBuild }: PromptInputStepProps) {
  return (
    <>
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Describe the automation you want</h2>
        <div className="flex gap-3 mb-2">
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="e.g., Send Bob Hoying a report of all his customers that are over 90 days late every Monday at 9am"
            className="flex-1 min-h-[100px]"
          />
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Tip: mention a recipient, the condition (e.g., over 60/90 days late), and a
            schedule (e.g., every Tuesday at 10am).
          </p>
          <Button onClick={onBuild} className="bg-blue-600 hover:bg-blue-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Build
          </Button>
        </div>
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-slate-700">Mock data only -- for UX demo purposes.</p>
      </Card>
    </>
  );
}
