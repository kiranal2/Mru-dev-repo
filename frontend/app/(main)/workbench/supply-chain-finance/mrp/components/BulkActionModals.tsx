"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Modal } from "./Modal";
import type { BulkActionModal, NewPOForm } from "../types";

interface BulkActionModalsProps {
  bulkActionModal: BulkActionModal;
  selectedRowCount: number;
  // Accept
  onConfirmBulkAction: () => void;
  bulkActionPending: boolean;
  // Counter
  counterDate: string;
  onCounterDateChange: (date: string) => void;
  // Tracking
  trackingMessage: string;
  onTrackingMessageChange: (msg: string) => void;
  // Escalate
  escalateMessage: string;
  onEscalateMessageChange: (msg: string) => void;
  // Upload
  uploadFile: File | null;
  uploadResult: string | null;
  uploadPending: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmUpload: () => void;
  // New PO
  newPOForm: NewPOForm;
  onNewPOFormChange: (form: NewPOForm) => void;
  suppliers: Array<{ supplier_id: string; supplier_name: string }> | undefined;
  createPOPending: boolean;
  onCreatePO: () => void;
  // Close
  onClose: () => void;
  onCloseUpload: () => void;
  onCloseCounter: () => void;
}

export function BulkActionModals({
  bulkActionModal,
  selectedRowCount,
  onConfirmBulkAction,
  bulkActionPending,
  counterDate,
  onCounterDateChange,
  trackingMessage,
  onTrackingMessageChange,
  escalateMessage,
  onEscalateMessageChange,
  uploadFile,
  uploadResult,
  uploadPending,
  fileInputRef,
  onFileSelect,
  onConfirmUpload,
  newPOForm,
  onNewPOFormChange,
  suppliers,
  createPOPending,
  onCreatePO,
  onClose,
  onCloseUpload,
  onCloseCounter,
}: BulkActionModalsProps) {
  return (
    <>
      {bulkActionModal === "accept" && (
        <Modal
          title="Accept Commit"
          onClose={onClose}
          onConfirm={onConfirmBulkAction}
          confirmLabel="Confirm"
          confirmColor="green"
          isLoading={bulkActionPending}
        >
          <p className="text-slate-700">
            Accept commits for {selectedRowCount} selected line
            {selectedRowCount > 1 ? "s" : ""}?
          </p>
        </Modal>
      )}

      {bulkActionModal === "counter" && (
        <Modal
          title="Counter-Date"
          onClose={onCloseCounter}
          onConfirm={onConfirmBulkAction}
          confirmLabel="Confirm"
          confirmColor="amber"
          isLoading={bulkActionPending}
        >
          <p className="text-slate-700 mb-4">
            Proposed date for {selectedRowCount} line
            {selectedRowCount > 1 ? "s" : ""}:
          </p>
          {counterDate && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-700">
                Suggested: {format(new Date(counterDate), "dd-MMM-yyyy")}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {selectedRowCount === 1
                  ? "Based on MRP Required Date for this PO line"
                  : `Based on the latest MRP Required Date across ${selectedRowCount} selected lines`}
              </p>
            </div>
          )}
          <div>
            <label className="text-sm text-slate-700 mb-2 block">Proposed date</label>
            <Input
              type="date"
              value={counterDate}
              onChange={(e) => onCounterDateChange(e.target.value)}
              placeholder="dd/mm/yyyy"
            />
          </div>
        </Modal>
      )}

      {bulkActionModal === "tracking" && (
        <Modal
          title="Request Tracking"
          onClose={onClose}
          onConfirm={onConfirmBulkAction}
          confirmLabel="Confirm"
          confirmColor="blue"
          isLoading={bulkActionPending}
        >
          <div>
            <label className="text-sm text-slate-700 mb-2 block">Message</label>
            <Textarea
              value={trackingMessage}
              onChange={(e) => onTrackingMessageChange(e.target.value)}
              placeholder="Enter message..."
            />
          </div>
        </Modal>
      )}

      {bulkActionModal === "escalate" && (
        <Modal
          title="Escalate"
          onClose={onClose}
          onConfirm={onConfirmBulkAction}
          confirmLabel="Confirm"
          confirmColor="red"
          isLoading={bulkActionPending}
        >
          <p className="text-slate-700 mb-4">
            Escalate to AM and supplier exec for {selectedRowCount} line
            {selectedRowCount > 1 ? "s" : ""}. Add context:
          </p>
          <Textarea
            value={escalateMessage}
            onChange={(e) => onEscalateMessageChange(e.target.value)}
            placeholder="Enter escalation context..."
          />
        </Modal>
      )}

      {bulkActionModal === "upload" && (
        <Modal
          title="Upload CSV"
          onClose={onCloseUpload}
          onConfirm={onConfirmUpload}
          confirmLabel="Upload"
          confirmColor="blue"
          isLoading={uploadPending}
        >
          <div className="space-y-4">
            <p className="text-slate-700">
              Upload a CSV file with PO line exceptions. Only unique PO lines that don't
              already exist will be imported.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={onFileSelect}
              className="hidden"
            />

            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadFile ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadFile.name}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Click to select CSV file
                </>
              )}
            </Button>

            {uploadResult && (
              <div
                className={`p-3 rounded ${
                  uploadResult.startsWith("Error")
                    ? "bg-red-500/20 text-red-400 border border-red-500"
                    : "bg-green-500/20 text-green-400 border border-green-500"
                }`}
              >
                {uploadResult}
              </div>
            )}

            <div className="text-xs text-slate-600">
              <p className="font-semibold mb-1">Expected CSV format:</p>
              <p>
                PO Line, Supplier, Org, Item, PO Promise, MRP, Supplier Action, Commit,
                Lead Date, Exception, Severity, Recommended, Status, Rationale
              </p>
            </div>
          </div>
        </Modal>
      )}

      {bulkActionModal === "new_po" && (
        <Modal
          title="Create New PO Line"
          onClose={onClose}
          onConfirm={onCreatePO}
          confirmLabel="Create"
          confirmColor="blue"
          isLoading={createPOPending}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600 mb-2 block">PO Number *</label>
                <Input
                  type="text"
                  value={newPOForm.po_number}
                  onChange={(e) =>
                    onNewPOFormChange({ ...newPOForm, po_number: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 mb-2 block">Supplier</label>
                <Select
                  value={newPOForm.supplier_id}
                  onValueChange={(value) =>
                    onNewPOFormChange({ ...newPOForm, supplier_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((s) => (
                      <SelectItem key={s.supplier_id} value={s.supplier_id}>
                        {s.supplier_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Item</label>
                <Input
                  type="text"
                  value={newPOForm.item}
                  onChange={(e) =>
                    onNewPOFormChange({ ...newPOForm, item: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 mb-2 block">Org Code</label>
                <Input
                  type="text"
                  value={newPOForm.org_code}
                  onChange={(e) =>
                    onNewPOFormChange({ ...newPOForm, org_code: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-600 mb-2 block">Item Description</label>
              <Input
                type="text"
                value={newPOForm.item_description}
                onChange={(e) =>
                  onNewPOFormChange({ ...newPOForm, item_description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Need Qty</label>
                <Input
                  type="number"
                  value={newPOForm.need_qty}
                  onChange={(e) =>
                    onNewPOFormChange({ ...newPOForm, need_qty: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 mb-2 block">UOM</label>
                <Input
                  type="text"
                  value={newPOForm.uom}
                  onChange={(e) =>
                    onNewPOFormChange({ ...newPOForm, uom: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Dates</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">PO Date</label>
                  <Input
                    type="date"
                    value={newPOForm.po_date}
                    onChange={(e) =>
                      onNewPOFormChange({ ...newPOForm, po_date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-2 block">
                    MRP Required Date
                  </label>
                  <Input
                    type="date"
                    value={newPOForm.mrp_required_date}
                    onChange={(e) =>
                      onNewPOFormChange({
                        ...newPOForm,
                        mrp_required_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">
                    PO Promise Date
                  </label>
                  <Input
                    type="date"
                    value={newPOForm.po_promise_date}
                    onChange={(e) =>
                      onNewPOFormChange({
                        ...newPOForm,
                        po_promise_date: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-2 block">Commit Date</label>
                  <Input
                    type="date"
                    value={newPOForm.commit_date}
                    onChange={(e) =>
                      onNewPOFormChange({ ...newPOForm, commit_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">
                    Supplier Commit
                  </label>
                  <Input
                    type="date"
                    value={newPOForm.supplier_commit}
                    onChange={(e) =>
                      onNewPOFormChange({
                        ...newPOForm,
                        supplier_commit: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-2 block">Lead Date</label>
                  <Input
                    type="date"
                    value={newPOForm.lead_date}
                    onChange={(e) =>
                      onNewPOFormChange({ ...newPOForm, lead_date: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
