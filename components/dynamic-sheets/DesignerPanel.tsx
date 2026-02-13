"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DynamicSheetColumn, CalculatedColumn, SheetFilter } from "@/lib/dynamic-sheets-store";

interface DesignerPanelProps {
  columns: DynamicSheetColumn[];
  formulas: CalculatedColumn[];
  filters: SheetFilter[];
  onColumnsChange: (columns: DynamicSheetColumn[]) => void;
  onFormulasChange: (formulas: CalculatedColumn[]) => void;
  onFiltersChange: (filters: SheetFilter[]) => void;
}

export function DesignerPanel({
  columns,
  formulas,
  filters,
  onColumnsChange,
  onFormulasChange,
  onFiltersChange,
}: DesignerPanelProps) {
  const [activeTab, setActiveTab] = useState("columns");
  const [showAddFormula, setShowAddFormula] = useState(false);
  const [newFormula, setNewFormula] = useState({
    name: "",
    expression: "",
    dataType: "number" as const,
  });
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [newFilter, setNewFilter] = useState({
    fieldKey: "",
    operator: "=" as const,
    value: "",
  });

  const toggleColumnVisibility = (id: string) => {
    onColumnsChange(
      columns.map((col) => (col.id === id ? { ...col, visible: !col.visible } : col))
    );
  };

  const updateColumnLabel = (id: string, label: string) => {
    onColumnsChange(columns.map((col) => (col.id === id ? { ...col, label } : col)));
  };

  const updateColumnType = (id: string, dataType: DynamicSheetColumn["dataType"]) => {
    onColumnsChange(columns.map((col) => (col.id === id ? { ...col, dataType } : col)));
  };

  const updateColumnPin = (id: string, pinned: "left" | "right" | null) => {
    onColumnsChange(columns.map((col) => (col.id === id ? { ...col, pinned } : col)));
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

    onFormulasChange([...formulas, formula]);
    setNewFormula({ name: "", expression: "", dataType: "number" });
    setShowAddFormula(false);
  };

  const removeFormula = (id: string) => {
    onFormulasChange(formulas.filter((f) => f.id !== id));
  };

  const addFilter = () => {
    if (!newFilter.fieldKey || !newFilter.value) return;

    const filter: SheetFilter = {
      id: `filter-${Date.now()}`,
      fieldKey: newFilter.fieldKey,
      operator: newFilter.operator,
      value: newFilter.value,
    };

    onFiltersChange([...filters, filter]);
    setNewFilter({ fieldKey: "", operator: "=", value: "" });
    setShowAddFilter(false);
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold text-slate-900">Sheet Designer</h2>
        <p className="mt-1 text-sm text-slate-600">
          Configure columns, formulas, and filters for this Dynamic Sheet.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-4 grid w-auto grid-cols-3">
          <TabsTrigger value="columns">Columns</TabsTrigger>
          <TabsTrigger value="formulas">Formulas</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="columns" className="mt-0 space-y-3">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {columns.map((col) => (
                  <div key={col.id} className="rounded-md border bg-white p-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-4 w-4 text-slate-400" />
                      <Checkbox
                        checked={col.visible}
                        onCheckedChange={() => toggleColumnVisibility(col.id)}
                      />
                      <div className="flex-1">
                        <Input
                          value={col.label}
                          onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                          className="text-sm"
                        />
                        <div className="text-xs text-slate-500 mt-1">Field: {col.fieldKey}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pl-10">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={col.dataType}
                          onValueChange={(val) =>
                            updateColumnType(col.id, val as DynamicSheetColumn["dataType"])
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
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
                          <SelectTrigger className="h-8 text-xs">
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
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="formulas" className="mt-0 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">Add calculated columns with formulas</p>
              <Button variant="outline" size="sm" onClick={() => setShowAddFormula(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {showAddFormula && (
              <div className="p-3 rounded-md border bg-slate-50 space-y-3">
                <div>
                  <Label className="text-xs">Name</Label>
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
                    onChange={(e) => setNewFormula({ ...newFormula, expression: e.target.value })}
                    placeholder="e.g., OPEN_BALANCE_USD - PAYMENTS_USD"
                    className="mt-1 font-mono text-xs"
                    rows={2}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use column field keys. Supports +, -, *, /, ()
                  </p>
                  {columns.length > 0 && (
                    <div className="mt-2 p-2 bg-slate-50 rounded text-xs">
                      <p className="font-medium mb-1">Available fields:</p>
                      <div className="flex flex-wrap gap-1">
                        {columns
                          .filter((c) => c.dataType === "number" || c.dataType === "currency")
                          .map((col) => (
                            <code
                              key={col.id}
                              className="px-1 py-0.5 bg-white border rounded cursor-pointer hover:bg-slate-100"
                              onClick={() =>
                                setNewFormula({
                                  ...newFormula,
                                  expression: newFormula.expression
                                    ? `${newFormula.expression} ${col.fieldKey}`
                                    : col.fieldKey,
                                })
                              }
                            >
                              {col.fieldKey}
                            </code>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={newFormula.dataType}
                    onValueChange={(val) => setNewFormula({ ...newFormula, dataType: val as any })}
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

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {formulas.length > 0 ? (
                  formulas.map((formula) => (
                    <div
                      key={formula.id}
                      className="flex items-start justify-between p-3 rounded-md border bg-white"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{formula.name}</div>
                        <code className="text-xs text-slate-600 font-mono">
                          {formula.expression}
                        </code>
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {formula.dataType}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFormula(formula.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No calculated columns yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="filters" className="mt-0 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">Filter rows by conditions</p>
              <Button variant="outline" size="sm" onClick={() => setShowAddFilter(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {showAddFilter && (
              <div className="p-3 rounded-md border bg-slate-50 space-y-3">
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
                      onValueChange={(val) => setNewFilter({ ...newFilter, operator: val as any })}
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

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filters.length > 0 ? (
                  filters.map((filter) => (
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
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">No filters applied</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
