"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Info, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DynamicSheetColumn,
  CalculatedColumn,
  SheetFilter,
  getDefaultColumns,
} from "@/lib/dynamic-sheets-store";

type SourceType = "PROMPT_RESULT" | "DATA_TEMPLATE" | "MANUAL_UPLOAD";

type CreateSheetWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: {
    name: string;
    description?: string;
    entity?: string;
    category?: string;
    sourceType: SourceType;
    sourceRef?: string;
    promptText?: string;
    columns: DynamicSheetColumn[];
    calculatedColumns: CalculatedColumn[];
    filters: SheetFilter[];
  }) => void;
};

export function CreateSheetWizard({ open, onOpenChange, onComplete }: CreateSheetWizardProps) {
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("AP_AGING");
  const [entity, setEntity] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("PROMPT_RESULT");
  const [sourceRef, setSourceRef] = useState("");

  const [columns, setColumns] = useState<DynamicSheetColumn[]>([]);
  const [calculatedColumns, setCalculatedColumns] = useState<CalculatedColumn[]>([]);
  const [filters, setFilters] = useState<SheetFilter[]>([]);

  const [showAddFormula, setShowAddFormula] = useState(false);
  const [newFormula, setNewFormula] = useState({
    name: "",
    expression: "",
    dataType: "number" as const,
  });

  const [showAddFilter, setShowAddFilter] = useState(false);
  const [newFilter, setNewFilter] = useState({ fieldKey: "", operator: "=" as const, value: "" });

  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setCategory("AP_AGING");
    setEntity("");
    setSourceType("PROMPT_RESULT");
    setSourceRef("");
    setColumns([]);
    setCalculatedColumns([]);
    setFilters([]);
    setShowAddFormula(false);
    setShowAddFilter(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step === 1) {
      const defaultCols = getDefaultColumns();
      setColumns(defaultCols);
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete({
      name,
      description: description || undefined,
      entity: entity || undefined,
      category,
      sourceType,
      sourceRef: sourceRef || undefined,
      promptText:
        sourceType === "PROMPT_RESULT" ? "Give me the AP Aging Detail for DoorDash Inc" : undefined,
      columns,
      calculatedColumns,
      filters,
    });
    handleClose();
  };

  const toggleColumnVisibility = (id: string) => {
    setColumns(columns.map((col) => (col.id === id ? { ...col, visible: !col.visible } : col)));
  };

  const updateColumnLabel = (id: string, label: string) => {
    setColumns(columns.map((col) => (col.id === id ? { ...col, label } : col)));
  };

  const updateColumnType = (id: string, dataType: DynamicSheetColumn["dataType"]) => {
    setColumns(columns.map((col) => (col.id === id ? { ...col, dataType } : col)));
  };

  const updateColumnPin = (id: string, pinned: "left" | "right" | null) => {
    setColumns(columns.map((col) => (col.id === id ? { ...col, pinned } : col)));
  };

  const addFormula = () => {
    if (!newFormula.name || !newFormula.expression) return;

    const formula: CalculatedColumn = {
      id: `calc-${Date.now()}`,
      name: newFormula.name,
      fieldKey: newFormula.name.toUpperCase().replace(/\s+/g, "_"),
      expression: newFormula.expression,
      dataType: newFormula.dataType,
    };

    setCalculatedColumns([...calculatedColumns, formula]);
    setNewFormula({ name: "", expression: "", dataType: "number" });
    setShowAddFormula(false);
  };

  const removeFormula = (id: string) => {
    setCalculatedColumns(calculatedColumns.filter((f) => f.id !== id));
  };

  const addFilter = () => {
    if (!newFilter.fieldKey || !newFilter.value) return;

    const filter: SheetFilter = {
      id: `filter-${Date.now()}`,
      fieldKey: newFilter.fieldKey,
      operator: newFilter.operator,
      value: newFilter.value,
    };

    setFilters([...filters, filter]);
    setNewFilter({ fieldKey: "", operator: "=", value: "" });
    setShowAddFilter(false);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const canProceedStep1 = name.trim() !== "" && sourceType;
  const canProceedStep2 = columns.some((col) => col.visible);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Dynamic Sheet</SheetTitle>
          <SheetDescription>
            Step {step} of 3:{" "}
            {step === 1 ? "Basics" : step === 2 ? "Columns Preview" : "Formulas & Filters"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sheet-name">Sheet Name *</Label>
                <Input
                  id="sheet-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., AP Aging Detail - Q4"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of this sheet..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AP_AGING">AP Aging</SelectItem>
                    <SelectItem value="AR_AGING">AR Aging</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="FLUX">Flux</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="entity">Entity</Label>
                <Input
                  id="entity"
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  placeholder="e.g., DoorDash Inc"
                  className="mt-1"
                />
              </div>

              <Separator />

              <div>
                <Label>Source Type *</Label>
                <div className="mt-2 space-y-2">
                  <div
                    className={`flex items-start space-x-3 rounded-md border p-3 cursor-pointer transition-colors ${
                      sourceType === "PROMPT_RESULT"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => setSourceType("PROMPT_RESULT")}
                  >
                    <input
                      type="radio"
                      checked={sourceType === "PROMPT_RESULT"}
                      onChange={() => setSourceType("PROMPT_RESULT")}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-medium">Use latest Command Center result</div>
                      <div className="text-sm text-slate-600 mt-1">
                        This sheet will be bound to the latest result from Command Center. For now
                        we will fake this with sample data.
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-start space-x-3 rounded-md border p-3 cursor-pointer transition-colors ${
                      sourceType === "DATA_TEMPLATE"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => setSourceType("DATA_TEMPLATE")}
                  >
                    <input
                      type="radio"
                      checked={sourceType === "DATA_TEMPLATE"}
                      onChange={() => setSourceType("DATA_TEMPLATE")}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Attach Data Template</div>
                      {sourceType === "DATA_TEMPLATE" && (
                        <Select value={sourceRef} onValueChange={setSourceRef}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select a data template..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tpl-ap-aging-doordash">
                              AP Aging Detail – DoorDash
                            </SelectItem>
                            <SelectItem value="tpl-ar-aging-doordash">
                              AR Aging Detail – DoorDash
                            </SelectItem>
                            <SelectItem value="tpl-gl-trial-balance">
                              GL Trial Balance – Consolidated
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex items-start space-x-3 rounded-md border p-3 cursor-pointer transition-colors ${
                      sourceType === "MANUAL_UPLOAD"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => setSourceType("MANUAL_UPLOAD")}
                  >
                    <input
                      type="radio"
                      checked={sourceType === "MANUAL_UPLOAD"}
                      onChange={() => setSourceType("MANUAL_UPLOAD")}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-medium">Start with empty sheet</div>
                      <div className="text-sm text-slate-600 mt-1">
                        Begin with a blank slate and upload your own data later.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-start space-x-2 rounded-md border border-blue-200 bg-blue-50 p-3">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-700">
                  Configure which columns to show and how they should appear. You can always adjust
                  these later in the Sheet Designer.
                </p>
              </div>

              <ScrollArea className="h-[500px] rounded-md border p-4">
                <div className="space-y-4">
                  {columns.map((col) => (
                    <div
                      key={col.id}
                      className="flex items-start space-x-3 pb-4 border-b last:border-0"
                    >
                      <Checkbox
                        checked={col.visible}
                        onCheckedChange={() => toggleColumnVisibility(col.id)}
                        className="mt-2"
                      />
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-xs text-slate-500">Field: {col.fieldKey}</Label>
                          <Input
                            value={col.label}
                            onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                            className="mt-1"
                            placeholder="Display name"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Data Type</Label>
                            <Select
                              value={col.dataType}
                              onValueChange={(val) =>
                                updateColumnType(col.id, val as DynamicSheetColumn["dataType"])
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="string">String</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="currency">Currency</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Pin</Label>
                            <Select
                              value={col.pinned || "none"}
                              onValueChange={(val) =>
                                updateColumnPin(
                                  col.id,
                                  val === "none" ? null : (val as "left" | "right")
                                )
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="text-sm text-slate-600">
                <strong>{columns.filter((c) => c.visible).length}</strong> of {columns.length}{" "}
                columns visible
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Calculated Columns</Label>
                  <Button variant="outline" size="sm" onClick={() => setShowAddFormula(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Formula
                  </Button>
                </div>

                {showAddFormula && (
                  <div className="mb-4 p-4 rounded-md border bg-slate-50 space-y-3">
                    <div>
                      <Label className="text-xs">Formula Name</Label>
                      <Input
                        value={newFormula.name}
                        onChange={(e) => setNewFormula({ ...newFormula, name: e.target.value })}
                        placeholder="e.g., Net Balance"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Expression</Label>
                      <Textarea
                        value={newFormula.expression}
                        onChange={(e) =>
                          setNewFormula({ ...newFormula, expression: e.target.value })
                        }
                        placeholder="e.g., OPEN_BALANCE_USD - PAYMENTS_USD"
                        className="mt-1 font-mono text-sm"
                        rows={2}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Use existing column keys like OPEN_BALANCE_USD, AGE, etc. Supports +, -, *,
                        /
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs">Data Type</Label>
                      <Select
                        value={newFormula.dataType}
                        onValueChange={(val) =>
                          setNewFormula({ ...newFormula, dataType: val as any })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="currency">Currency</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="string">String</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" onClick={addFormula}>
                        Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddFormula(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {calculatedColumns.length > 0 ? (
                  <div className="space-y-2">
                    {calculatedColumns.map((formula) => (
                      <div
                        key={formula.id}
                        className="flex items-center justify-between p-3 rounded-md border bg-white"
                      >
                        <div>
                          <div className="font-medium text-sm">{formula.name}</div>
                          <code className="text-xs text-slate-600 font-mono">
                            {formula.expression}
                          </code>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {formula.dataType}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeFormula(formula.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No calculated columns yet.</p>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Default Filters</Label>
                  <Button variant="outline" size="sm" onClick={() => setShowAddFilter(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Filter
                  </Button>
                </div>

                {showAddFilter && (
                  <div className="mb-4 p-4 rounded-md border bg-slate-50 space-y-3">
                    <div>
                      <Label className="text-xs">Field</Label>
                      <Select
                        value={newFilter.fieldKey}
                        onValueChange={(val) => setNewFilter({ ...newFilter, fieldKey: val })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {columns
                            .filter((c) => c.visible)
                            .map((col) => (
                              <SelectItem key={col.id} value={col.fieldKey}>
                                {col.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Operator</Label>
                        <Select
                          value={newFilter.operator}
                          onValueChange={(val) =>
                            setNewFilter({ ...newFilter, operator: val as any })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="=">=</SelectItem>
                            <SelectItem value="!=">!=</SelectItem>
                            <SelectItem value=">">{">"}</SelectItem>
                            <SelectItem value="<">{"<"}</SelectItem>
                            <SelectItem value=">=">{">="}</SelectItem>
                            <SelectItem value="<=">{"<="}</SelectItem>
                            <SelectItem value="contains">contains</SelectItem>
                            <SelectItem value="in">in</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={newFilter.value}
                          onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                          placeholder="Filter value"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" onClick={addFilter}>
                        Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddFilter(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {filters.length > 0 ? (
                  <div className="space-y-2">
                    {filters.map((filter) => (
                      <div
                        key={filter.id}
                        className="flex items-center justify-between p-3 rounded-md border bg-white"
                      >
                        <div className="text-sm">
                          <span className="font-medium">{filter.fieldKey}</span>{" "}
                          <Badge variant="outline" className="mx-1">
                            {filter.operator}
                          </Badge>{" "}
                          <span className="text-slate-600">{String(filter.value)}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeFilter(filter.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No default filters. You can add filters later.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t pt-4">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete}>Create Dynamic Sheet</Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
