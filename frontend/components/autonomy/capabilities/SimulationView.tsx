"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, AlertTriangle, CheckCircle2, Clock, Users } from "lucide-react";

export function SimulationView() {
  const [scenario, setScenario] = useState("ap_invoice");
  const [increaseVolume, setIncreaseVolume] = useState(false);
  const [latePostings, setLatePostings] = useState(false);
  const [missingData, setMissingData] = useState(false);
  const [simulated, setSimulated] = useState(false);

  const handleSimulate = () => {
    setSimulated(true);
  };

  const getSimulationResults = () => {
    if (!simulated) return null;

    const baseResults = {
      ap_invoice: {
        tasksCreated: 12,
        slasBreached: 2,
        humanActions: 5,
        duration: "2.5 hours",
      },
      recon_variance: {
        tasksCreated: 8,
        slasBreached: 1,
        humanActions: 3,
        duration: "1.8 hours",
      },
      close_day: {
        tasksCreated: 45,
        slasBreached: 5,
        humanActions: 18,
        duration: "6 hours",
      },
    };

    const base = baseResults[scenario as keyof typeof baseResults];
    const volumeMultiplier = increaseVolume ? 1.5 : 1;
    const lateMultiplier = latePostings ? 1.3 : 1;
    const missingMultiplier = missingData ? 1.2 : 1;

    return {
      tasksCreated: Math.round(base.tasksCreated * volumeMultiplier * lateMultiplier),
      slasBreached: Math.round(base.slasBreached * lateMultiplier * missingMultiplier),
      humanActions: Math.round(base.humanActions * volumeMultiplier * missingMultiplier),
      duration: base.duration,
    };
  };

  const results = getSimulationResults();

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Simulation & What-If</h2>
        <p className="text-slate-600">
          Simulate before deploying. Test how workflows behave under different scenarios.
        </p>
      </div>

      <div className="grid grid-cols-[400px_1fr] gap-6">
        {/* Left: Simulation Config */}
        <div className="space-y-4">
          <Card className="p-6 bg-white">
            <h3 className="font-semibold text-slate-900 mb-4">Scenario Selection</h3>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Choose Scenario
                </Label>
                <Select value={scenario} onValueChange={setScenario}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ap_invoice">AP Invoice Processing</SelectItem>
                    <SelectItem value="recon_variance">Reconciliation Variance</SelectItem>
                    <SelectItem value="close_day">Month-End Close Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-medium text-slate-700">Scenario Toggles</h4>

                <div className="flex items-center justify-between">
                  <Label htmlFor="increase-volume" className="text-sm text-slate-600">
                    Increase volume by 50%
                  </Label>
                  <Switch
                    id="increase-volume"
                    checked={increaseVolume}
                    onCheckedChange={setIncreaseVolume}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="late-postings" className="text-sm text-slate-600">
                    Simulate late postings
                  </Label>
                  <Switch
                    id="late-postings"
                    checked={latePostings}
                    onCheckedChange={setLatePostings}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="missing-data" className="text-sm text-slate-600">
                    Missing data scenarios
                  </Label>
                  <Switch
                    id="missing-data"
                    checked={missingData}
                    onCheckedChange={setMissingData}
                  />
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                onClick={handleSimulate}
              >
                <Play className="h-4 w-4 mr-2" />
                Run Simulation
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-medium mb-1">Dry-run only</p>
                <p className="text-xs text-amber-700">
                  No actual data or workflows will be modified during simulation.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {!simulated && (
            <Card className="p-12 bg-slate-50 border-slate-200 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Play className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">
                  Configure scenario and run simulation to see results
                </p>
              </div>
            </Card>
          )}

          {simulated && results && (
            <>
              <Card className="p-6 bg-white">
                <h3 className="font-semibold text-slate-900 mb-4">Simulation Results</h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">Tasks Created</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{results.tasksCreated}</p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-slate-700">SLAs Breached</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{results.slasBreached}</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-slate-700">Human Actions</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{results.humanActions}</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-slate-700">Est. Duration</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{results.duration}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {increaseVolume && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      +50% Volume
                    </Badge>
                  )}
                  {latePostings && (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200"
                    >
                      Late Postings
                    </Badge>
                  )}
                  {missingData && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Missing Data
                    </Badge>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white">
                <h3 className="font-semibold text-slate-900 mb-4">Workflow Steps (Simulated)</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Step</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Invoice Intake</TableCell>
                      <TableCell>System</TableCell>
                      <TableCell>5 min</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Completed
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Data Validation</TableCell>
                      <TableCell>System</TableCell>
                      <TableCell>12 min</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Completed
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">GL Coding</TableCell>
                      <TableCell>AP Specialist</TableCell>
                      <TableCell>45 min</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          In Progress
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Manager Approval</TableCell>
                      <TableCell>Manager</TableCell>
                      <TableCell>Pending</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-slate-100 text-slate-600 border-slate-300"
                        >
                          Waiting
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
