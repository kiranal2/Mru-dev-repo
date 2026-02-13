"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, MessageSquare, Calendar, User, Edit2, Save } from "lucide-react";
import { SignalsService } from "../services/SignalsService";
import { WorkflowService } from "../services/WorkflowService";
import { SupplierResponseService } from "../services/SupplierResponseService";
import { WorkflowTimeline } from "./WorkflowTimeline";
import { format } from "date-fns";

type Props = {
  signalId: string;
  onClose: () => void;
  onAction: () => void;
};

type Tab =
  | "overview"
  | "supplier_response"
  | "exceptions"
  | "workflow"
  | "notes"
  | "history"
  | "attachments";

export function SignalDrawer({ signalId, onClose, onAction }: Props) {
  const [showCounterDate, setShowCounterDate] = useState(false);
  const [newCommitDate, setNewCommitDate] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [whatIfDate, setWhatIfDate] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [suggestedCounterDate, setSuggestedCounterDate] = useState("");
  const queryClient = useQueryClient();

  const { data: signal } = useQuery({
    queryKey: ["signal", signalId],
    queryFn: () => SignalsService.get(signalId),
  });

  const { data: events } = useQuery({
    queryKey: ["signal-events", signalId],
    queryFn: () => SignalsService.getEvents(signalId),
  });

  const { data: actions } = useQuery({
    queryKey: ["signal-actions", signalId],
    queryFn: () => SignalsService.getActions(signalId),
  });

  const { data: workflowHistory } = useQuery({
    queryKey: ["workflow-history", signalId],
    queryFn: () => WorkflowService.getWorkflowHistory(signalId),
  });

  const { data: supplierResponses } = useQuery({
    queryKey: ["supplier-responses", signalId],
    queryFn: () => SupplierResponseService.getResponses(signalId),
  });

  const actMutation = useMutation({
    mutationFn: (payload: any) => SignalsService.act(signalId, payload),
    onSuccess: () => {
      onAction();
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => SignalsService.updatePOLine(signal!.po_line_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal", signalId] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      setIsEditing(false);
      setEditedData({});
    },
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case "a":
          handleAccept();
          break;
        case "c":
          setShowCounterDate(true);
          break;
        case "r":
          handleRequestTracking();
          break;
        case "x":
          handleEscalate();
          break;
        case "escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleAccept = () => {
    if (confirm("Accept this commitment?")) {
      actMutation.mutate({ type: "ACCEPT_COMMIT" });
    }
  };

  const handleCounterDate = () => {
    if (!newCommitDate) {
      alert("Please select a date");
      return;
    }

    const selectedDate = new Date(newCommitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert("Date must be in the future");
      return;
    }

    actMutation.mutate({
      type: "COUNTER_DATE",
      payload: { new_commit_date: newCommitDate },
    });

    // Reset the counter date state after submission
    setShowCounterDate(false);
    setNewCommitDate("");
    setSuggestedCounterDate("");
  };

  const handleRequestTracking = () => {
    if (confirm("Request tracking for this PO line?")) {
      actMutation.mutate({ type: "REQUEST_TRACKING" });
    }
  };

  const handleEscalate = () => {
    if (confirm("Escalate this exception to the supplier?")) {
      actMutation.mutate({ type: "ESCALATE" });
    }
  };

  const calculateSuggestedCounterDate = () => {
    if (!signal) return "";

    const poPromiseDate = signal.po_line.po_promise_date;
    const mrpRequiredDate = signal.po_line.mrp_required_date;
    const exceptionType = signal.type;

    if (!poPromiseDate || !mrpRequiredDate) return "";

    const poDate = new Date(poPromiseDate);
    const mrpDate = new Date(mrpRequiredDate);

    // For PULL IN (SIG_PULL_IN): MRP Required < Supplier Commit
    // Suggested counter date should be the MRP Required Date (earlier date needed)
    if (exceptionType === "SIG_PULL_IN" || (exceptionType as string) === "SIG_PULL_IN") {
      return format(mrpDate, "yyyy-MM-dd");
    }

    // For PUSH OUT (SIG_PUSH_OUT): MRP Required > Supplier Commit
    // Suggested counter date should be the MRP Required Date (later date that works)
    if (exceptionType === "SIG_PUSH_OUT" || (exceptionType as string) === "SIG_PUSH_OUT") {
      return format(mrpDate, "yyyy-MM-dd");
    }

    // Default to MRP Required Date for other cases
    return format(mrpDate, "yyyy-MM-dd");
  };

  const handleShowCounterDate = () => {
    const suggested = calculateSuggestedCounterDate();
    setSuggestedCounterDate(suggested);
    setNewCommitDate(suggested);
    setShowCounterDate(true);
  };

  useEffect(() => {
    if (signal && isEditing && Object.keys(editedData).length === 0) {
      setEditedData({
        po_date: signal.po_line.po_date || "",
        po_promise_date: signal.po_line.po_promise_date || "",
        mrp_required_date: signal.po_line.mrp_required_date || "",
        supplier_action: signal.po_line.supplier_action || "",
        supplier_commit: signal.po_line.supplier_commit || "",
        commit_date: signal.po_line.commit_date || "",
        item: signal.po_line.item || "",
        item_description: signal.po_line.item_description || "",
        severity: signal.severity || "",
        status: signal.status || "",
        label: signal.label || "",
        recommendation: signal.recommendation || signal.recommended || "",
      });
    }
  }, [signal, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      poLineData: {
        po_date: editedData.po_date,
        po_promise_date: editedData.po_promise_date,
        mrp_required_date: editedData.mrp_required_date,
        supplier_action: editedData.supplier_action,
        supplier_commit: editedData.supplier_commit,
        commit_date: editedData.commit_date,
        item: editedData.item,
        item_description: editedData.item_description,
      },
      signalData: {
        severity: editedData.severity,
        status: editedData.status,
        label: editedData.label,
        recommendation: editedData.recommendation,
      },
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }));
  };

  if (!signal) return null;

  const timeline = [...(events || []), ...(actions || [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "supplier_response", label: "Supplier Response" },
    { id: "exceptions", label: "Exceptions" },
    { id: "workflow", label: "Workflow" },
    { id: "notes", label: "Notes" },
    { id: "history", label: "History" },
    { id: "attachments", label: "Attachments" },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-10">
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {signal.po_line.po_number} · {signal.supplier.supplier_name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                aria-label="Edit PO Line"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium disabled:opacity-50 flex items-center gap-1 text-white"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-sm text-gray-900 dark:text-white"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition text-gray-600 dark:text-gray-400"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-800 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-white"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex gap-2 mb-6">
              {showCounterDate ? (
                <>
                  <button
                    onClick={handleCounterDate}
                    disabled={actMutation.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium disabled:opacity-50"
                  >
                    Accept ✓
                  </button>
                  <button
                    onClick={() => {
                      setShowCounterDate(false);
                      setNewCommitDate("");
                      setSuggestedCounterDate("");
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-sm text-gray-900 dark:text-white"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleAccept}
                    disabled={actMutation.isPending}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-sm font-medium disabled:opacity-50 text-gray-900 dark:text-white"
                  >
                    Accept ✓
                  </button>
                  <button
                    onClick={handleShowCounterDate}
                    disabled={actMutation.isPending}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-sm font-medium disabled:opacity-50 text-gray-900 dark:text-white"
                  >
                    Counter →
                  </button>
                  <button
                    onClick={handleRequestTracking}
                    disabled={actMutation.isPending}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-sm font-medium disabled:opacity-50 text-gray-900 dark:text-white"
                  >
                    Tracking 📍
                  </button>
                  <button
                    onClick={handleEscalate}
                    disabled={actMutation.isPending}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-sm font-medium disabled:opacity-50 text-gray-900 dark:text-white"
                  >
                    Note 📝
                  </button>
                  <button className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-sm font-medium text-gray-900 dark:text-white">
                    Lock
                  </button>
                </>
              )}
            </div>

            {showCounterDate && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Counter Date
                  {suggestedCounterDate && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                      (Suggested: {format(new Date(suggestedCounterDate), "dd-MMM-yyyy")})
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  value={newCommitDate}
                  onChange={(e) => setNewCommitDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {signal.type === "SIG_PULL_IN" || (signal.type as string) === "SIG_PULL_IN"
                    ? "Pull-in scenario: Counter with MRP Required Date or earlier"
                    : signal.type === "SIG_PUSH_OUT" || (signal.type as string) === "SIG_PUSH_OUT"
                      ? "Push-out scenario: Counter with MRP Required Date or later"
                      : "Select an appropriate counter date"}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <DetailRow label="Supplier" value={signal.supplier.supplier_name} isEditing={false} />
              <DetailRow
                label="Org Code"
                value={signal.po_line.org_code || "113SJC"}
                isEditing={false}
              />
              <DetailRow label="PO Number" value={signal.po_line.po_number} isEditing={false} />
              <DetailRow
                label="Item"
                value={isEditing ? editedData.item : signal.po_line.item || "-"}
                isEditing={isEditing}
                onEdit={(value) => handleFieldChange("item", value)}
              />
              <DetailRow
                label="Item Description"
                value={
                  isEditing ? editedData.item_description : signal.po_line.item_description || "-"
                }
                isEditing={isEditing}
                onEdit={(value) => handleFieldChange("item_description", value)}
              />
              <DetailRow
                label="PO Date"
                value={
                  isEditing
                    ? editedData.po_date
                    : signal.po_line.po_date
                      ? format(new Date(signal.po_line.po_date), "yyyy-MM-dd")
                      : "-"
                }
                isEditing={isEditing}
                fieldType="date"
                onEdit={(value) => handleFieldChange("po_date", value)}
              />
              <DetailRow
                label="PO Promise Date"
                value={
                  isEditing
                    ? editedData.po_promise_date
                    : signal.po_line.po_promise_date
                      ? format(new Date(signal.po_line.po_promise_date), "yyyy-MM-dd")
                      : "-"
                }
                isEditing={isEditing}
                fieldType="date"
                onEdit={(value) => handleFieldChange("po_promise_date", value)}
              />
              <DetailRow
                label="MRP Required Date"
                value={
                  isEditing
                    ? editedData.mrp_required_date
                    : signal.po_line.mrp_required_date
                      ? format(new Date(signal.po_line.mrp_required_date), "yyyy-MM-dd")
                      : "-"
                }
                isEditing={isEditing}
                fieldType="date"
                onEdit={(value) => handleFieldChange("mrp_required_date", value)}
              />
              <DetailRow
                label="Supplier Action"
                value={
                  isEditing
                    ? editedData.supplier_action
                    : signal.po_line.supplier_action || "PUSH OUT"
                }
                isEditing={isEditing}
                fieldType="select"
                options={["ACKNOWLEDGE", "OK/CONFIRM", "PULL IN", "PUSH OUT", "PAST DUE"]}
                onEdit={(value) => handleFieldChange("supplier_action", value)}
              />
              <DetailRow
                label="Supplier Commit"
                value={
                  isEditing
                    ? editedData.supplier_commit
                    : (signal.po_line as any).supplier_commit
                      ? format(new Date((signal.po_line as any).supplier_commit), "yyyy-MM-dd")
                      : "-"
                }
                isEditing={isEditing}
                fieldType="date"
                onEdit={(value) => handleFieldChange("supplier_commit", value)}
              />
              <DetailRow
                label="Commit (Supplier)"
                value={
                  isEditing
                    ? editedData.commit_date
                    : signal.po_line.commit_date
                      ? format(new Date(signal.po_line.commit_date), "yyyy-MM-dd")
                      : "-"
                }
                isEditing={isEditing}
                fieldType="date"
                onEdit={(value) => handleFieldChange("commit_date", value)}
              />
              <DetailRow
                label="Lead Time"
                value={
                  signal.po_line.lead_date
                    ? `PO + 16d = ${format(new Date(signal.po_line.lead_date), "yyyy-MM-dd")}`
                    : "-"
                }
              >
                {signal.po_line.lead_date &&
                  new Date(signal.po_line.lead_date) >
                    new Date(signal.po_line.mrp_required_date || "") && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                      Breached
                    </span>
                  )}
              </DetailRow>
              <DetailRow
                label="Exception"
                value={isEditing ? editedData.label : signal.label}
                displayValue={!isEditing ? signal.label : undefined}
                isEditing={isEditing}
                fieldType="select"
                options={[
                  "MRP Required < Supplier Commit",
                  "MRP Required > Supplier Commit",
                  "Acknowledge",
                  "No Ack T+5",
                  "OK/Confirm",
                  "Past Due",
                  "Cancel",
                  "Partial Commit",
                  "Cancel Request",
                  "Supplier No Response",
                ]}
                onEdit={(value) => handleFieldChange("label", value)}
              />
              <DetailRow
                label="Severity"
                value={isEditing ? editedData.severity : signal.severity}
                isEditing={isEditing}
                fieldType="select"
                options={["HIGH", "MEDIUM", "LOW"]}
                onEdit={(value) => handleFieldChange("severity", value)}
              />
              <DetailRow
                label="Status"
                value={isEditing ? editedData.status : signal.status}
                isEditing={isEditing}
                fieldType="select"
                options={["NEW", "MONITORING", "COMPLETED"]}
                onEdit={(value) => handleFieldChange("status", value)}
              />
              <DetailRow
                label="Recommendation"
                value={
                  isEditing
                    ? editedData.recommendation
                    : signal.recommendation || signal.recommended || ""
                }
                isEditing={isEditing}
                fieldType="select"
                options={[
                  "ACCEPT",
                  "COUNTER_DATE",
                  "REQUEST_TRACKING",
                  "ESCALATE",
                  "AI Auto-Remind T+N / Auto-Respond",
                ]}
                onEdit={(value) => handleFieldChange("recommendation", value)}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                What-if counter
              </h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <input
                    type="date"
                    value={whatIfDate}
                    onChange={(e) => setWhatIfDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="10/29/2025"
                  />
                </div>
                <button className="px-6 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-sm font-medium text-gray-900 dark:text-white">
                  Preview
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                Pick a date to compare vs MRP, lead time, and quarter.
              </p>
            </div>
          </div>
        )}

        {activeTab === "supplier_response" && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Supplier Responses
            </h3>
            {!supplierResponses || supplierResponses.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-400 text-center py-12">
                No supplier responses yet
              </div>
            ) : (
              <div className="space-y-4">
                {supplierResponses.map((response) => (
                  <div
                    key={response.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {response.response_type}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(response.response_date), "dd-MMM-yyyy")}
                      </span>
                    </div>

                    {response.proposed_date && (
                      <div className="flex items-center gap-2 mb-2 text-sm">
                        <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-gray-700 dark:text-gray-300">Proposed Date:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {format(new Date(response.proposed_date), "dd-MMM-yyyy")}
                        </span>
                      </div>
                    )}

                    {response.message && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3 pl-7">
                        {response.message}
                      </p>
                    )}

                    {response.contact_person && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 pl-7">
                        <User className="w-4 h-4" />
                        <span>{response.contact_person}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "exceptions" && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {signal.label}
                </span>
                <SeverityBadge severity={signal.severity} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{signal.rationale}</p>
            </div>
          </div>
        )}

        {activeTab === "workflow" && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Workflow Timeline
            </h3>
            <WorkflowTimeline history={workflowHistory || []} />
          </div>
        )}

        {activeTab === "notes" && (
          <div className="text-gray-600 dark:text-gray-400 text-center py-12">
            Notes content will appear here
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  {idx < timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-700 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {"event_type" in item ? item.message : `Action: ${item.action_type}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {format(new Date(item.created_at), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "attachments" && (
          <div className="text-gray-600 dark:text-gray-400 text-center py-12">
            Attachments will appear here
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  displayValue,
  children,
  isEditing,
  fieldType = "text",
  options,
  optionLabels,
  onEdit,
}: {
  label: string;
  value?: string;
  displayValue?: string;
  children?: React.ReactNode;
  isEditing?: boolean;
  fieldType?: "text" | "date" | "select";
  options?: string[];
  optionLabels?: Record<string, string>;
  onEdit?: (value: string) => void;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      {children ? (
        children
      ) : isEditing && onEdit ? (
        fieldType === "select" ? (
          <select
            value={value || ""}
            onChange={(e) => onEdit(e.target.value)}
            className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          >
            <option value="">Select...</option>
            {options?.map((option) => (
              <option key={option} value={option}>
                {optionLabels?.[option] || option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={fieldType}
            value={value || ""}
            onChange={(e) => onEdit(e.target.value)}
            className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
        )
      ) : (
        <span className="text-sm text-gray-900 dark:text-gray-200">{displayValue || value}</span>
      )}
    </div>
  );
}

function ActionButton({
  label,
  hotkey,
  onClick,
  disabled,
}: {
  label: string;
  hotkey: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
      title={`Hotkey: ${hotkey}`}
    >
      {label} <span className="text-xs text-gray-500">({hotkey})</span>
    </button>
  );
}

function SeverityBadge({ severity }: { severity: "HIGH" | "MEDIUM" | "LOW" | "high" | "low" }) {
  const normalizedSeverity = severity.toUpperCase() as "HIGH" | "MEDIUM" | "LOW";

  const styles = {
    HIGH: "bg-red-500/20 text-red-400 border-red-500",
    MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500",
    LOW: "bg-blue-500/20 text-blue-400 border-blue-500",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium border rounded ${styles[normalizedSeverity]}`}
    >
      {normalizedSeverity}
    </span>
  );
}
