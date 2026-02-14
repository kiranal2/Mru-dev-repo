"use client";

import { Database, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { AutomationState, InvoicePreview } from "../types";

interface PromptConfigStepProps {
  automationState: AutomationState;
  setAutomationState: React.Dispatch<React.SetStateAction<AutomationState>>;
  filteredInvoices: InvoicePreview[];
  calculateNextRun: () => string;
  onFinalize: () => void;
  onEditPrompt: () => void;
}

export function PromptConfigStep({
  automationState,
  setAutomationState,
  filteredInvoices,
  calculateNextRun,
  onFinalize,
  onEditPrompt,
}: PromptConfigStepProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-white">
        <p className="text-sm text-blue-600 mb-3">
          We parsed your prompt into editable building blocks. Tweak anything below,
          then finalize.
        </p>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {/* Get Data Card */}
        <Card className="p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
              Get Data
            </h3>
          </div>
          <h4 className="text-lg font-semibold mb-4">
            Customers over {automationState.thresholdDays} Days Late
          </h4>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-slate-600">Overdue threshold (days)</Label>
              <Input
                type="number"
                value={automationState.thresholdDays}
                onChange={(e) =>
                  setAutomationState((prev) => ({
                    ...prev,
                    thresholdDays: parseInt(e.target.value) || 0,
                  }))
                }
                min="1"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-600">Filters</Label>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Owner: {automationState.recipient}
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  Open invoices only
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-600">
                Preview ({filteredInvoices.length} matches)
              </Label>
              <div className="mt-1 border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs">Customer</TableHead>
                      <TableHead className="text-xs">Invoice</TableHead>
                      <TableHead className="text-xs">Days Late</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((inv, idx) => (
                      <TableRow key={idx} className="text-sm">
                        <TableCell>{inv.customer}</TableCell>
                        <TableCell>{inv.invoice}</TableCell>
                        <TableCell>{inv.daysLate}</TableCell>
                        <TableCell className="text-right">
                          $
                          {inv.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </Card>

        {/* Recipient Card */}
        <Card className="p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
              Recipient
            </h3>
          </div>
          <h4 className="text-lg font-semibold mb-4">{automationState.recipient}</h4>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-slate-600">
                Send To (person or group)
              </Label>
              <Input
                value={automationState.recipient}
                onChange={(e) =>
                  setAutomationState((prev) => ({ ...prev, recipient: e.target.value }))
                }
                list="people"
                className="mt-1"
              />
              <datalist id="people">
                <option>Bob Hoying</option>
                <option>Ana Delgado</option>
                <option>Samir Patel</option>
              </datalist>
            </div>

            <div>
              <Label className="text-xs text-slate-600">Delivery channel</Label>
              <Select
                value={automationState.channel}
                onValueChange={(v) =>
                  setAutomationState((prev) => ({ ...prev, channel: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Email (PDF report)">Email (PDF report)</SelectItem>
                  <SelectItem value="Slack DM (link + summary)">
                    Slack DM (link + summary)
                  </SelectItem>
                  <SelectItem value="Teams chat (link + summary)">
                    Teams chat (link + summary)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-600">Subject / Message</Label>
              <Input
                value={automationState.subject}
                onChange={(e) =>
                  setAutomationState((prev) => ({ ...prev, subject: e.target.value }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-600">Sample message preview</Label>
              <div className="mt-1 p-3 border rounded-lg bg-blue-50 text-sm">
                <strong>Hi {automationState.recipient.split(" ")[0]},</strong>
                <br />
                Here is your weekly list of customers with invoices over{" "}
                {automationState.thresholdDays} days late. I'll deliver this every{" "}
                {automationState.dayOfWeek} at {automationState.time}{" "}
                {automationState.timezone}.
              </div>
            </div>
          </div>
        </Card>

        {/* Schedule Card */}
        <Card className="p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
              Schedule
            </h3>
          </div>
          <h4 className="text-lg font-semibold mb-4">
            Every {automationState.dayOfWeek} at {automationState.time}
          </h4>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-slate-600">Day of week</Label>
              <Select
                value={automationState.dayOfWeek}
                onValueChange={(v) =>
                  setAutomationState((prev) => ({ ...prev, dayOfWeek: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-600">Time</Label>
              <Input
                type="time"
                value={automationState.time}
                onChange={(e) =>
                  setAutomationState((prev) => ({ ...prev, time: e.target.value }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-600">Timezone</Label>
              <Select
                value={automationState.timezone}
                onValueChange={(v) =>
                  setAutomationState((prev) => ({ ...prev, timezone: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Los_Angeles">
                    America/Los_Angeles
                  </SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-600">Next run</Label>
              <Badge variant="outline" className="gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {calculateNextRun()} ({automationState.timezone})
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-white">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => toast.info("Test run simulated")}>
            Test run (simulate)
          </Button>
          <Button variant="outline" onClick={onEditPrompt}>
            Edit prompt
          </Button>
          <Button
            onClick={onFinalize}
            className="bg-green-600 hover:bg-green-700 font-bold"
          >
            Finalize & Create Agent Task
          </Button>
        </div>
      </Card>
    </div>
  );
}
