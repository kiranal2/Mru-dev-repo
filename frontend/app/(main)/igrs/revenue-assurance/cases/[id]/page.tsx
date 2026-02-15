"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useIGRSCase, useIGRSCaseMutation } from "@/hooks/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/data/utils/format-currency";

const STATUS_OPTIONS = ["New", "In Review", "Confirmed", "Resolved", "Rejected"];

function riskVariant(level: string): "default" | "secondary" | "destructive" | "outline" {
  switch (level) {
    case "High":
      return "destructive";
    case "Medium":
      return "secondary";
    case "Low":
      return "outline";
    default:
      return "outline";
  }
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "New":
      return "outline";
    case "In Review":
      return "secondary";
    case "Confirmed":
      return "default";
    case "Resolved":
      return "default";
    case "Rejected":
      return "destructive";
    default:
      return "outline";
  }
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const { data: caseData, loading, error, refetch } = useIGRSCase(id);
  const { update, loading: updating } = useIGRSCaseMutation();

  const [newNote, setNewNote] = useState("");
  const [statusUpdate, setStatusUpdate] = useState<string>("");

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
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

  if (!caseData)
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Case not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );

  const handleStatusUpdate = async () => {
    if (!statusUpdate || !id) return;
    try {
      await update(id, { status: statusUpdate as any });
      refetch();
      setStatusUpdate("");
    } catch {
      // error is handled by mutation hook
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    const updatedNotes = [
      ...caseData.notes,
      {
        id: `note-${Date.now()}`,
        author: "Current User",
        createdAt: new Date().toISOString(),
        note: newNote.trim(),
      },
    ];
    try {
      await update(id, { notes: updatedNotes } as any);
      setNewNote("");
      refetch();
    } catch {
      // error is handled by mutation hook
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        &larr; Back to Cases
      </Button>

      {/* Case Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{caseData.caseId}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Created {new Date(caseData.createdAt).toLocaleDateString()} | Updated{" "}
            {new Date(caseData.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant(caseData.status)} className="text-sm px-3 py-1">
            {caseData.status}
          </Badge>
          <Badge variant={riskVariant(caseData.riskLevel)} className="text-sm px-3 py-1">
            {caseData.riskLevel} Risk
          </Badge>
          <span className="text-lg font-bold text-orange-600">
            {formatINR(caseData.gapInr)}
          </span>
        </div>
      </div>

      {/* Risk & Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{caseData.riskScore}/100</p>
            <p className="text-xs text-muted-foreground">
              Confidence: {(caseData.confidence * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatINR(caseData.payableTotalInr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatINR(caseData.paidTotalInr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Impact Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatINR(caseData.impactAmountInr)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Detail Sections */}
      <Tabs defaultValue="document" className="w-full">
        <TabsList className="w-full justify-start flex-wrap">
          <TabsTrigger value="document">Document Info</TabsTrigger>
          <TabsTrigger value="property">Property Summary</TabsTrigger>
          <TabsTrigger value="financial">Financial Breakdown</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Document Info */}
        <TabsContent value="document">
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">SRO Office</p>
                  <p className="font-medium">
                    {caseData.office.srName} ({caseData.office.srCode})
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {caseData.office.district} - {caseData.office.zone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Document Key</p>
                  <p className="font-mono text-sm">
                    {caseData.documentKey.srCode}/{caseData.documentKey.bookNo}/
                    {caseData.documentKey.doctNo}/{caseData.documentKey.regYear}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Document Type</p>
                  <p className="font-medium">{caseData.docType.tranDesc}</p>
                  <p className="text-xs text-muted-foreground">
                    {caseData.docType.tranMajCode}/{caseData.docType.tranMinCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Key Dates</p>
                  <div className="text-sm space-y-1">
                    <p>Presentation: {caseData.dates.pDate}</p>
                    <p>Execution: {caseData.dates.eDate}</p>
                    <p>Registration: {caseData.dates.rDate}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Parties</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {caseData.partiesSummary.map((party, i) => (
                    <div key={i} className="border rounded-md p-3">
                      <p className="font-medium">{party.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Role: {party.code}
                        {party.panNo ? ` | PAN: ${party.panNo}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Leakage Signals</p>
                <div className="flex flex-wrap gap-2">
                  {caseData.leakageSignals.map((signal) => (
                    <Badge key={signal} variant="secondary">
                      {signal}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Property Summary */}
        <TabsContent value="property">
          <Card>
            <CardHeader>
              <CardTitle>Property Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {caseData.propertySummary.isUrban ? "Urban" : "Rural"}
                  </p>
                </div>
                {caseData.propertySummary.landNature && (
                  <div>
                    <p className="text-sm text-muted-foreground">Land Nature</p>
                    <p className="font-medium">{caseData.propertySummary.landNature}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Extent</p>
                  <p className="font-medium">
                    {caseData.propertySummary.extent} {caseData.propertySummary.unit}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Breakdown */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Component</TableHead>
                    <TableHead className="text-right">Amount (INR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Stamp Duty Payable</TableCell>
                    <TableCell className="text-right">
                      {formatINR(caseData.payableBreakdown.sdPayable)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Transfer Duty Payable</TableCell>
                    <TableCell className="text-right">
                      {formatINR(caseData.payableBreakdown.tdPayable)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Registration Fee Payable</TableCell>
                    <TableCell className="text-right">
                      {formatINR(caseData.payableBreakdown.rfPayable)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Deficit Stamp Duty Payable</TableCell>
                    <TableCell className="text-right">
                      {formatINR(caseData.payableBreakdown.dsdPayable)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Other Fees</TableCell>
                    <TableCell className="text-right">
                      {formatINR(caseData.payableBreakdown.otherFee)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t-2">
                    <TableCell>Final Taxable Value</TableCell>
                    <TableCell className="text-right">
                      {formatINR(caseData.payableBreakdown.finalTaxableValue)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Payable</p>
                  <p className="text-lg font-bold">{formatINR(caseData.payableTotalInr)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-bold">{formatINR(caseData.paidTotalInr)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gap</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatINR(caseData.gapInr)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence (Triggered Rules) */}
        <TabsContent value="evidence">
          <Card>
            <CardHeader>
              <CardTitle>Evidence - Triggered Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 border rounded-md">
                  <p className="text-2xl font-bold">{caseData.evidence.receiptCount}</p>
                  <p className="text-xs text-muted-foreground">Receipts</p>
                </div>
                <div className="text-center p-3 border rounded-md">
                  <p className="text-2xl font-bold">{caseData.evidence.prohibitedMatchCount}</p>
                  <p className="text-xs text-muted-foreground">Prohibited Matches</p>
                </div>
                <div className="text-center p-3 border rounded-md">
                  <p className="text-2xl font-bold">{caseData.evidence.mvDeviationPct}%</p>
                  <p className="text-xs text-muted-foreground">MV Deviation</p>
                </div>
                <div className="text-center p-3 border rounded-md">
                  <p className="text-2xl font-bold">{caseData.evidence.exemptionCount}</p>
                  <p className="text-xs text-muted-foreground">Exemptions</p>
                </div>
              </div>

              {caseData.evidence.triggeredRules.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead className="text-right">Impact (INR)</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caseData.evidence.triggeredRules.map((rule) => (
                      <TableRow key={rule.ruleId}>
                        <TableCell className="font-mono text-sm">
                          {rule.ruleId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rule.ruleName}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {rule.explanation}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{rule.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={riskVariant(rule.severity)}>
                            {rule.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatINR(rule.impactInr)}
                        </TableCell>
                        <TableCell>{(rule.confidence * 100).toFixed(0)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No triggered rules.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.activityLog.length > 0 ? (
                <div className="space-y-3">
                  {caseData.activityLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 border-l-2 border-gray-200 pl-4 py-2"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{entry.actor}</span>
                          <Badge variant="outline" className="text-xs">
                            {entry.action}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {entry.detail}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.ts).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseData.notes.length > 0 ? (
                <div className="space-y-3">
                  {caseData.notes.map((note) => (
                    <div key={note.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{note.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-2">{note.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              )}

              <Separator />

              <div className="flex gap-2">
                <Input
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddNote();
                  }}
                />
                <Button onClick={handleAddNote} disabled={updating || !newNote.trim()}>
                  {updating ? "Saving..." : "Add Note"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Update Case</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Update Status</p>
                <div className="flex gap-2">
                  <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={updating || !statusUpdate}
                  >
                    {updating ? "Updating..." : "Update Status"}
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">
                  Current Status:{" "}
                  <Badge variant={statusVariant(caseData.status)}>
                    {caseData.status}
                  </Badge>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Assigned To: {caseData.assignedTo ?? "Unassigned"}
                </p>
                {caseData.sla && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      SLA: {caseData.sla.ageingDays} days ({caseData.sla.ageingBucket})
                      {caseData.sla.slaBreached && (
                        <Badge variant="destructive" className="ml-2">
                          SLA Breached
                        </Badge>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
