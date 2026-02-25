"use client";

import React, { useRef, useMemo, memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import GridTable from "@/components/ui/grid-table";
import AgingSummaryCards from "@/components/ui/aging-summary-cards";
import {
  Bot,
  FileText,
  BarChart3,
  AlertCircle,
  Clock,
  Star,
  Lightbulb,
  ArrowRight,
  ChevronRight,
  X,
  Plus,
  Square,
  WifiOff,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Users,
  PieChart,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChatSessionItem } from "@/lib/streaming-types";

type LoadingState = "loading" | "loaded";
type Chip = {
  id: string;
  text: string;
  isOpen?: boolean;
};

const QUICK_CHIPS = ["Invoices", "Payments", "Credit Memos", "Customers", "AR Balance", "AR Aging"];

type SuggestedPrompt = {
  id: string;
  icon: LucideIcon;
  text: string;
  category: string;
};

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: "sp-1", icon: TrendingUp, text: "Show me AR aging summary for all customers", category: "AR Aging" },
  { id: "sp-2", icon: Receipt, text: "List all open invoices over $100,000", category: "Invoices" },
  { id: "sp-3", icon: DollarSign, text: "Give me payment history for the last 30 days", category: "Payments" },
  { id: "sp-4", icon: Users, text: "Show top 10 customers by outstanding balance", category: "Customers" },
  { id: "sp-5", icon: AlertCircle, text: "What invoices are overdue by more than 60 days?", category: "Collections" },
  { id: "sp-6", icon: PieChart, text: "Break down AR balance by business unit", category: "Analysis" },
];

type Message = {
  id: string;
  message: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: string;
  isStreaming?: boolean;
  financialData?: { tables: any[]; charts: any[] };
  recommendations?: string[];
  nextSteps?: string[];
  dataAnalysis?: string;
  followUpPrompts?: string[];
};

// Streaming event type for display
interface StreamingEventDisplay {
  event_type: string;
  message: string;
  timestamp?: string;
}

interface CommandCenterProps {
  loadingState: LoadingState;
  composerValue: string;
  isLoading: boolean;
  isConnected: boolean;
  activeChips: Chip[];
  openDropdownId: string | null;
  showPlaceholder: boolean;
  showFinancialResults: boolean;
  messages: Message[];
  errors: any[];
  streamingEvents?: StreamingEventDisplay[];
  currentStreamingMessage?: string;
  onComposerChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onComposerFocus: () => void;
  onComposerBlur: () => void;
  onSendClick: () => void;
  onChipClick: (chipText: string) => void;
  onRemoveChip: (chipId: string) => void;
  onPromptSuggestionClick: (promptText: string) => void;
  onDropdownToggle: (chipId: string) => void;
  onTestUI: () => void;
  onOpenLivePinModal?: () => void;
  onOpenCreateWatchModal?: () => void;
  onOpenCreateTemplateModal?: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  // Session management props
  onNewChat?: () => void;
  onCancelQuery?: () => void;
  chatSessions?: ChatSessionItem[];
  activeSessionId?: string | null;
  onSessionClick?: (session: ChatSessionItem) => void;
  isLoadingSessions?: boolean;
  sessionsLoadFailed?: boolean;
  onRetrySessions?: () => void;
}

/** Detect the best label and value columns for a bar chart */
function detectChartColumns(
  columns: any[],
  rows: any[][]
): { labelIdx: number; valueIdx: number } | null {
  if (!columns || columns.length < 2 || !rows || rows.length === 0) return null;

  let labelIdx = 0; // default: first column
  let valueIdx = -1;

  // Find the first currency/number column
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const key = (col.key || col.title || "").toLowerCase();
    const format = (col.format || col.type || "").toLowerCase();
    if (
      format === "currency" ||
      format === "number" ||
      key.includes("amount") ||
      key.includes("balance") ||
      key.includes("total") ||
      key.includes("usd")
    ) {
      valueIdx = i;
      break;
    }
  }

  // Fallback: scan rows for numeric-looking data
  if (valueIdx === -1) {
    for (let i = 1; i < columns.length; i++) {
      const sample = String(rows[0]?.[i] || "");
      if (/^\$?[\d,]+(\.\d+)?%?$/.test(sample.trim())) {
        valueIdx = i;
        break;
      }
    }
  }

  if (valueIdx === -1) return null;
  return { labelIdx, valueIdx };
}

/** Parse a currency/number string to a raw number */
function parseNumericValue(val: string): number {
  if (!val) return 0;
  const cleaned = String(val).replace(/[$,%]/g, "").replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Client-side fallback follow-up prompts when backend doesn't return any */
function generateClientFollowUpPrompts(userMessage: string): string[] {
  const lower = (userMessage || "").toLowerCase();
  if (lower.includes("aging") || lower.includes("overdue")) {
    return [
      "Show collection history for critical accounts",
      "What is the write-off risk?",
      "Break down aging by business unit",
    ];
  }
  if (lower.includes("invoice") || lower.includes("open")) {
    return [
      "Which invoices are past due?",
      "Show payment terms breakdown",
      "Average days-to-pay for these customers?",
    ];
  }
  if (lower.includes("payment") || lower.includes("paid")) {
    return [
      "Compare payment trends month-over-month",
      "Show pending payments",
      "Payment method distribution this quarter",
    ];
  }
  return [
    "Show AR aging summary",
    "List open invoices over $100K",
    "Top customers by outstanding balance",
  ];
}

// Memoize message item component to prevent re-renders
const MessageItem = memo(
  ({
    message,
    index,
    isLoading,
    messagesLength,
    streamingEvents = [],
    currentStreamingMessage = "",
    onOpenLivePinModal,
    onOpenCreateWatchModal,
    onOpenCreateTemplateModal,
    onExpandTable,
    onPromptSuggestionClick,
    isLastAssistantMessage,
  }: {
    message: Message;
    index: number;
    isLoading: boolean;
    messagesLength: number;
    streamingEvents?: StreamingEventDisplay[];
    currentStreamingMessage?: string;
    onOpenLivePinModal?: () => void;
    onOpenCreateWatchModal?: () => void;
    onOpenCreateTemplateModal?: () => void;
    onExpandTable: (tableId: string) => void;
    onPromptSuggestionClick?: (text: string) => void;
    isLastAssistantMessage: boolean;
  }) => {
    const [chartVisibleForTable, setChartVisibleForTable] = useState<Record<string, boolean>>({});

    const toggleChart = useCallback((tableId: string) => {
      setChartVisibleForTable((prev) => ({ ...prev, [tableId]: !prev[tableId] }));
    }, []);
    const includesAging = useMemo(
      () => message.message.toLowerCase().includes("aging"),
      [message.message]
    );

    return (
      <div className="space-y-4">
        {/* User Message Bubble */}
        {message.role === "user" && (
          <div
            className="flex justify-end animate-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="max-w-4xl ml-12">
              <div className="flex items-end space-x-2">
                <div className="flex flex-col items-end space-y-1">
                  <span className="text-xs text-gray-500 mr-2">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="bg-[#D1ECFF] rounded-xl rounded-tr-none px-3 py-4 max-w-md">
                    <p className="text-sm text-[#191919] leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading message when processing - show streaming events */}
        {/* Show for the last user message when loading (could be last or second-to-last if placeholder assistant exists) */}
        {message.role === "user" && isLoading && index >= messagesLength - 2 && (
          <div className="flex justify-start animate-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-4xl mr-12 w-full">
              <div className="flex items-start space-x-2">
                <div className="flex flex-col items-start space-y-1 w-full">
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </span>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 w-full max-w-xl">
                    {/* Show streaming events if available */}
                    {streamingEvents.length > 0 ? (
                      <div className="space-y-2">
                        {streamingEvents.map((event, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 text-sm ${
                              idx === streamingEvents.length - 1
                                ? "text-gray-800 font-medium"
                                : "text-gray-500"
                            }`}
                          >
                            {/* Display the message as-is - backend already includes appropriate emojis */}
                            <span className="leading-relaxed">
                              {event.message || `Processing ${event.event_type}...`}
                            </span>
                            {idx === streamingEvents.length - 1 && (
                              <span className="flex ml-1">
                                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
                                  .
                                </span>
                                <span
                                  className="animate-bounce"
                                  style={{ animationDelay: "150ms" }}
                                >
                                  .
                                </span>
                                <span
                                  className="animate-bounce"
                                  style={{ animationDelay: "300ms" }}
                                >
                                  .
                                </span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : currentStreamingMessage ? (
                      <p className="text-sm text-gray-800 leading-relaxed flex items-center">
                        {currentStreamingMessage}
                        <span className="flex ml-1">
                          <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
                            .
                          </span>
                          <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
                            .
                          </span>
                          <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
                            .
                          </span>
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assistant Message with Data - Only show when NOT streaming */}
        {message.role === "assistant" && !message.isStreaming && (
          <div className="space-y-6">
            {/* Data Analysis Card */}
            {message.dataAnalysis ? (
              <div className="flex justify-start animate-in slide-in-from-bottom-4 duration-500">
                <div className="w-full">
                  <div className="bg-white overflow-hidden">
                    <span className="text-xs text-gray-500 mr-2">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="bg-[#EFEFEF] rounded-xl rounded-tl-none px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-6 h-6 text-slate-900" />
                        <h3 className="text-sm font-bold text-[#191919]">Meeru Analytics</h3>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-[#191919] leading-[22px]">
                        {message.dataAnalysis}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-start animate-in slide-in-from-bottom-4 duration-500">
                <div className="w-full">
                  <div className="bg-white overflow-hidden">
                    <span className="text-xs text-gray-500 mr-2">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="bg-[#EFEFEF] rounded-xl rounded-tl-none px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-6 h-6 text-slate-900" />
                        <h3 className="text-sm font-bold text-[#191919]">Meeru Analytics</h3>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-[#191919] leading-[22px]">
                        No data analysis available
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Aging Summary Cards - Show when user prompt contains 'aging' */}
            {includesAging && (
              <div className="flex justify-start animate-in slide-in-from-bottom-4 duration-500 mb-6">
                <div className="w-full">
                  <AgingSummaryCards
                    onOpenLivePinModal={onOpenLivePinModal}
                    onOpenCreateWatchModal={onOpenCreateWatchModal}
                    onOpenCreateTemplateModal={onOpenCreateTemplateModal}
                    onExpand={() => {
                      // Open the first table in dynamic sheets if available
                      if (
                        message.financialData?.tables &&
                        message.financialData.tables.length > 0
                      ) {
                        const firstTableId = `table-${message.id}-0`;
                        onExpandTable(firstTableId);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Financial Tables */}
            {message.financialData?.tables.map((table, ind) => {
              // Transform table data inline (moved out of useMemo to avoid hooks in loop)
              const headers = table.columns.map((column: any) => ({
                id: column.key,
                name: column.title,
                data_type: column.format,
                description: column.description || "",
                is_hidden: false,
              }));

              const data = table.rows.map((row: any) =>
                row.map((cell: any) => cell?.toString() || "")
              );

              const tableId = `table-${message.id}-${ind}`;

              return (
                <div
                  key={tableId}
                  className="flex justify-start animate-in slide-in-from-bottom-4 duration-500"
                >
                  <div className="w-full">
                    <div className="bg-white overflow-hidden">
                      {/* Table Header with Actions */}
                      <div className="bg-white pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm text-[#191919]">
                              Total {table.rows.length} records
                            </h3>
                          </div>

                          {/* Action Buttons - Hide when aging summary cards are shown */}
                          {!includesAging && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleChart(tableId)}
                                className="bg-white hover:bg-[#D1ECFF] text-[#000000] px-2 py-1.5 rounded-[8px] text-sm font-normal flex items-center space-x-2 transition-colors border border-[#D2D2D2]"
                              >
                                <BarChart3 size={18} className="text-slate-900" />
                                <span>{chartVisibleForTable[tableId] ? "Hide Chart" : "Visualize"}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onExpandTable(tableId);
                                }}
                                className="bg-white hover:bg-[#D1ECFF] text-[#000000] px-2 py-1.5 rounded-[8px] text-sm font-normal flex items-center space-x-2 transition-colors border border-[#D2D2D2]"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                >
                                  <path
                                    d="M15.75 6.75001L15.75 2.25001M15.75 2.25001H11.25M15.75 2.25001L9 9M7.5 2.25H5.85C4.58988 2.25 3.95982 2.25 3.47852 2.49524C3.05516 2.71095 2.71095 3.05516 2.49524 3.47852C2.25 3.95982 2.25 4.58988 2.25 5.85V12.15C2.25 13.4101 2.25 14.0402 2.49524 14.5215C2.71095 14.9448 3.05516 15.289 3.47852 15.5048C3.95982 15.75 4.58988 15.75 5.85 15.75H12.15C13.4101 15.75 14.0402 15.75 14.5215 15.5048C14.9448 15.289 15.289 14.9448 15.5048 14.5215C15.75 14.0402 15.75 13.4101 15.75 12.15V10.5"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                                <span>Expand</span>
                              </button>
                              <button
                                onClick={onOpenCreateTemplateModal}
                                className="bg-white hover:bg-[#D1ECFF] text-[#000000] px-2 py-1.5 rounded-[8px] text-sm font-normal flex items-center space-x-2 transition-colors border border-[#D2D2D2]"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                >
                                  <path
                                    d="M10.5 1.70215V4.80005C10.5 5.22009 10.5 5.43011 10.5817 5.59055C10.6537 5.73167 10.7684 5.8464 10.9095 5.91831C11.0699 6.00005 11.28 6.00005 11.7 6.00005H14.7979M10.5 12.75H6M12 9.75H6M15 7.49117V12.9C15 14.1601 15 14.7902 14.7548 15.2715C14.539 15.6948 14.1948 16.039 13.7715 16.2548C13.2902 16.5 12.6601 16.5 11.4 16.5H6.6C5.33988 16.5 4.70982 16.5 4.22852 16.2548C3.80516 16.039 3.46095 15.6948 3.24524 15.2715C3 14.7902 3 14.1601 3 12.9V5.1C3 3.83988 3 3.20982 3.24524 2.72852C3.46095 2.30516 3.80516 1.96095 4.22852 1.74524C4.70982 1.5 5.33988 1.5 6.6 1.5H9.00883C9.55916 1.5 9.83432 1.5 10.0933 1.56217C10.3229 1.61729 10.5423 1.7082 10.7436 1.83156C10.9707 1.9707 11.1653 2.16527 11.5544 2.55442L13.9456 4.94558C14.3347 5.33473 14.5293 5.5293 14.6684 5.75636C14.7918 5.95767 14.8827 6.17715 14.9378 6.40673C15 6.66568 15 6.94084 15 7.49117Z"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                                <span>Create Template</span>
                              </button>
                              <button
                                onClick={onOpenCreateWatchModal}
                                className="bg-white hover:bg-[#D1ECFF] text-[#000000] px-2 py-1.5 rounded-[8px] text-sm font-normal flex items-center space-x-2 transition-colors border border-[#D2D2D2]"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                <span>Add to Watchlist</span>
                              </button>
                              <button
                                onClick={onOpenLivePinModal}
                                className="bg-white hover:bg-[#D1ECFF] text-[#000000] px-2 py-1.5 rounded-[8px] text-sm font-normal flex items-center space-x-2 transition-colors border border-[#D2D2D2]"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                >
                                  <path
                                    d="M9.00008 11.25L9.00008 16.5M6.00008 5.4811V7.07906C6.00008 7.23508 6.00008 7.31308 5.98477 7.3877C5.97118 7.45389 5.94871 7.51795 5.91797 7.57813C5.88331 7.64596 5.83458 7.70687 5.73712 7.8287L4.55979 9.30037C4.06048 9.92449 3.81083 10.2366 3.81055 10.4992C3.8103 10.7276 3.91415 10.9437 4.09266 11.0862C4.29792 11.25 4.69755 11.25 5.49683 11.25H12.5033C13.3026 11.25 13.7022 11.25 13.9075 11.0862C14.086 10.9437 14.1899 10.7276 14.1896 10.4992C14.1893 10.2366 13.9397 9.92449 13.4404 9.30037L12.263 7.8287C12.1656 7.70687 12.1168 7.64596 12.0822 7.57813C12.0514 7.51795 12.029 7.45389 12.0154 7.3877C12.0001 7.31308 12.0001 7.23508 12.0001 7.07906V5.4811C12.0001 5.39476 12.0001 5.35158 12.005 5.30901C12.0093 5.27119 12.0165 5.23375 12.0265 5.19702C12.0378 5.15568 12.0538 5.1156 12.0859 5.03543L12.8418 3.14567C13.0623 2.59435 13.1726 2.3187 13.1266 2.09741C13.0864 1.9039 12.9714 1.73408 12.8067 1.62488C12.6183 1.5 12.3214 1.5 11.7276 1.5H6.27252C5.67873 1.5 5.38184 1.5 5.19346 1.62488C5.02872 1.73408 4.91375 1.9039 4.87354 2.09741C4.82756 2.3187 4.93782 2.59435 5.15835 3.14567L5.91425 5.03543C5.94632 5.1156 5.96235 5.15568 5.97363 5.19702C5.98365 5.23375 5.99086 5.27119 5.9952 5.30901C6.00008 5.35158 6.00008 5.39476 6.00008 5.4811Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span>Pin</span>
                              </button>
                              <button className="bg-white hover:bg-[#D1ECFF] text-[#000000] px-2 py-1.5 rounded-[8px] text-sm font-normal flex items-center space-x-2 transition-colors border border-[#D2D2D2]">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                >
                                  <path
                                    d="M8.46199 2.58999C8.63485 2.23978 8.72128 2.06468 8.83862 2.00874C8.94071 1.96006 9.05931 1.96006 9.1614 2.00874C9.27874 2.06468 9.36517 2.23978 9.53804 2.58999L11.178 5.91246C11.2291 6.01585 11.2546 6.06755 11.2919 6.10768C11.3249 6.14322 11.3645 6.17201 11.4085 6.19247C11.4582 6.21557 11.5152 6.2239 11.6293 6.24058L15.2977 6.77678C15.684 6.83324 15.8772 6.86148 15.9666 6.95583C16.0444 7.03792 16.0809 7.15072 16.0661 7.26283C16.0491 7.39168 15.9093 7.52788 15.6296 7.80029L12.9761 10.3848C12.8934 10.4654 12.852 10.5057 12.8253 10.5536C12.8017 10.596 12.7865 10.6427 12.7807 10.6909C12.7741 10.7453 12.7838 10.8022 12.8034 10.9161L13.4295 14.5666C13.4955 14.9516 13.5285 15.1441 13.4665 15.2584C13.4125 15.3578 13.3165 15.4275 13.2053 15.4481C13.0775 15.4718 12.9046 15.3809 12.5588 15.1991L9.27928 13.4744C9.1771 13.4206 9.12601 13.3938 9.07218 13.3832C9.02452 13.3739 8.9755 13.3739 8.92784 13.3832C8.87402 13.3938 8.82293 13.4206 8.72074 13.4744L5.44119 15.1991C5.09544 15.3809 4.92256 15.4718 4.79473 15.4481C4.68351 15.4275 4.58754 15.3578 4.53355 15.2584C4.4715 15.1441 4.50452 14.9516 4.57056 14.5666L5.19666 10.9161C5.21618 10.8022 5.22594 10.7453 5.21934 10.6909C5.21349 10.6427 5.19833 10.596 5.1747 10.5536C5.14802 10.5057 5.10666 10.4654 5.02394 10.3848L2.37042 7.80029C2.09075 7.52788 1.95091 7.39168 1.93389 7.26283C1.91909 7.15072 1.95567 7.03792 2.03344 6.95583C2.12283 6.86148 2.31598 6.83324 2.70228 6.77678L6.37073 6.24058C6.48482 6.2239 6.54186 6.21557 6.59154 6.19247C6.63552 6.17201 6.67512 6.14322 6.70814 6.10768C6.74543 6.06755 6.77095 6.01585 6.82198 5.91246L8.46199 2.58999Z"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                                <span>Favorite</span>
                              </button>
                              <button className="bg-white hover:bg-[#D1ECFF] text-[#000000] px-2 py-1.5 rounded-[8px] text-sm font-normal flex items-center space-x-2 transition-colors border border-[#D2D2D2]">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                >
                                  <path
                                    d="M15.75 11.25V12.15C15.75 13.4101 15.75 14.0402 15.5048 14.5215C15.289 14.9448 14.9448 15.289 14.5215 15.5048C14.0402 15.75 13.4101 15.75 12.15 15.75H5.85C4.58988 15.75 3.95982 15.75 3.47852 15.5048C3.05516 15.289 2.71095 14.9448 2.49524 14.5215C2.25 14.0402 2.25 13.4101 2.25 12.15V11.25M12.75 7.5L9 11.25M9 11.25L5.25 7.5M9 11.25V2.25"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                                <span>Download</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* GridTable Component */}
                      <GridTable
                        headers={headers}
                        data={data}
                        subjectArea="financial"
                        className="border-0"
                      />

                      {/* Inline Bar Chart */}
                      {chartVisibleForTable[tableId] && (() => {
                        const chartCols = detectChartColumns(table.columns, table.rows);
                        if (!chartCols) return null;
                        const { labelIdx, valueIdx } = chartCols;
                        const chartData = table.rows.map((row: any) => ({
                          label: String(row[labelIdx] || ""),
                          value: parseNumericValue(String(row[valueIdx] || "0")),
                          display: String(row[valueIdx] || ""),
                        }));
                        const maxValue = Math.max(...chartData.map((d: any) => d.value), 1);
                        const barHeight = 32;
                        const gap = 8;
                        const svgHeight = chartData.length * (barHeight + gap);
                        const labelWidth = 160;
                        const valueWidth = 120;
                        const barAreaWidth = 400;

                        return (
                          <div className="mt-4 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 mb-3">
                              <BarChart3 size={16} className="text-[#6B7EF3]" />
                              <span className="text-sm font-medium text-[#1E293B]">
                                {table.columns[valueIdx]?.title || "Value"} by {table.columns[labelIdx]?.title || "Category"}
                              </span>
                            </div>
                            <svg
                              width="100%"
                              height={svgHeight}
                              viewBox={`0 0 ${labelWidth + barAreaWidth + valueWidth} ${svgHeight}`}
                              className="overflow-visible"
                            >
                              {chartData.map((item: any, i: number) => {
                                const y = i * (barHeight + gap);
                                const barWidth = (item.value / maxValue) * barAreaWidth;
                                const truncatedLabel =
                                  item.label.length > 20 ? item.label.slice(0, 20) + "\u2026" : item.label;

                                return (
                                  <g key={i}>
                                    {/* Label */}
                                    <text
                                      x={labelWidth - 8}
                                      y={y + barHeight / 2}
                                      textAnchor="end"
                                      dominantBaseline="central"
                                      className="text-xs fill-[#475569]"
                                    >
                                      {truncatedLabel}
                                    </text>
                                    {/* Bar background */}
                                    <rect
                                      x={labelWidth}
                                      y={y + 2}
                                      width={barAreaWidth}
                                      height={barHeight - 4}
                                      rx={4}
                                      fill="#F1F5F9"
                                    />
                                    {/* Bar */}
                                    <rect
                                      x={labelWidth}
                                      y={y + 2}
                                      width={0}
                                      height={barHeight - 4}
                                      rx={4}
                                      fill="#6B7EF3"
                                    >
                                      <animate
                                        attributeName="width"
                                        from="0"
                                        to={barWidth}
                                        dur="0.6s"
                                        begin={`${i * 0.05}s`}
                                        fill="freeze"
                                        calcMode="spline"
                                        keySplines="0.25 0.1 0.25 1"
                                        keyTimes="0;1"
                                      />
                                    </rect>
                                    {/* Value */}
                                    <text
                                      x={labelWidth + barAreaWidth + 8}
                                      y={y + barHeight / 2}
                                      textAnchor="start"
                                      dominantBaseline="central"
                                      className="text-xs fill-[#334155] font-medium"
                                    >
                                      {item.display}
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Follow-up Prompt Suggestions — only on the last assistant message, when not loading */}
            {isLastAssistantMessage && !isLoading && (() => {
              const prompts = message.followUpPrompts && message.followUpPrompts.length > 0
                ? message.followUpPrompts
                : generateClientFollowUpPrompts(message.message || message.content);
              return (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {prompts.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => onPromptSuggestionClick?.(text)}
                      className="group inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#E2E8F0] bg-white text-sm text-[#334155] hover:border-[#6B7EF3] hover:bg-[#F5F8FF] hover:text-slate-900 transition-all duration-200 active:scale-[0.97]"
                    >
                      <Lightbulb size={14} className="text-[#94A3B8] group-hover:text-[#6B7EF3] transition-colors" />
                      <span className="leading-snug">{text}</span>
                      <ArrowRight size={12} className="text-[#CBD5E1] group-hover:text-[#6B7EF3] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Pie Charts */}
            {message.financialData?.charts.map((chart, chartIndex) => {
              // Memoize chart calculations
              const chartCalculations = useMemo(() => {
                const total = chart.data.reduce((sum: number, item: any) => sum + item.value, 0);
                return chart.data.map((segment: any, i: number) => {
                  const percentage = (segment.value / total) * 100;
                  const rotation = chart.data
                    .slice(0, i)
                    .reduce((sum: number, item: any) => sum + (item.value / total) * 360, 0);
                  return { ...segment, percentage, rotation, index: i };
                });
              }, [chart.data]);

              const chartTitle = useMemo(
                () =>
                  chart.title
                    .split("_")
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" "),
                [chart.title]
              );

              return (
                <div
                  key={`chart-${message.id}-${chartIndex}`}
                  className="flex justify-start animate-in slide-in-from-bottom-4 duration-500"
                >
                  <div className="max-w-4xl w-full">
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] px-6 py-4 border-b border-[#E2E8F0]">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-[#1E293B]">{chartTitle}</h3>
                            <p className="text-sm text-[#64748B] mt-1">Pie Chart Visualization</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-8">
                        <div className="flex items-center justify-center">
                          <div className="relative w-80 h-80">
                            {/* Simple Pie Chart using CSS */}
                            <div className="relative w-full h-full rounded-full overflow-hidden">
                              {chartCalculations.map((segment: any) => {
                                return (
                                  <div
                                    key={segment.index}
                                    className="absolute inset-0"
                                    style={{
                                      transform: `rotate(${segment.rotation}deg)`,
                                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((segment.percentage * Math.PI) / 180)}% ${50 - 50 * Math.sin((segment.percentage * Math.PI) / 180)}%)`,
                                    }}
                                  >
                                    <div
                                      className="w-full h-full"
                                      style={{ backgroundColor: segment.color }}
                                    />
                                  </div>
                                );
                              })}
                            </div>

                            {/* Legend */}
                            <div className="absolute -bottom-20 left-0 right-0">
                              <div className="flex flex-wrap justify-center gap-4">
                                {chart.data.map((segment: any, i: number) => (
                                  <div key={i} className="flex items-center space-x-2">
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: segment.color }}
                                    />
                                    <span className="text-sm text-[#475569] font-medium">
                                      {segment.label} ({segment.value})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

MessageItem.displayName = "MessageItem";

// Helper function to transform table data for dynamic sheets
const transformTableForDynamicSheets = (
  table: any,
  message: Message
): {
  name: string;
  entity: string;
  sourceType: "Prompt" | "Template" | "Recon";
  promptText?: string;
  description?: string;
  columns: any[];
  rows: any[];
  calculatedColumns: any[];
  filters: any[];
} => {
  console.log("Transforming table for dynamic sheets:", {
    tableColumns: table.columns,
    tableRowsCount: table.rows?.length,
    firstRow: table.rows?.[0],
  });

  // Transform columns to dynamic sheet format
  const columns = table.columns.map((column: any, idx: number) => {
    let fieldKey: string;
    let label: string;
    let dataType: "string" | "number" | "date" | "currency" | "boolean" = "string";

    if (typeof column === "string") {
      fieldKey = column.replace(/\s+/g, "_").toUpperCase();
      label = column;
    } else {
      // Try multiple possible property names for fieldKey
      // IMPORTANT: Use the original key as-is (don't transform) to match row data
      // The column.key comes from parseToolResultAsTable which uses: col.id || col.key || col.name
      fieldKey = column.key || column.fieldKey || column.id || column.name || `col_${idx}`;

      // Try multiple possible property names for label
      label = column.title || column.name || column.label || column.header || `Column ${idx + 1}`;

      // Infer data type from format or column properties
      const format = column.format || column.data_type || column.dataType || column.type || "";
      if (
        format.includes("currency") ||
        format.includes("money") ||
        format.includes("$") ||
        format.toLowerCase().includes("usd")
      ) {
        dataType = "currency";
      } else if (format.includes("date") || format.includes("time")) {
        dataType = "date";
      } else if (
        format.includes("number") ||
        format.includes("int") ||
        format.includes("float") ||
        format.includes("numeric")
      ) {
        dataType = "number";
      } else if (format.includes("boolean") || format.includes("bool")) {
        dataType = "boolean";
      }
    }

    return {
      id: `col-${idx}`,
      fieldKey,
      label,
      dataType,
      visible: true,
      pinned: idx === 0 ? "left" : null,
      sortable: true,
      width: dataType === "currency" ? 150 : dataType === "date" ? 120 : 140,
      order: idx,
    };
  });

  console.log(
    "Transformed columns:",
    columns.map((c: any) => ({ fieldKey: c.fieldKey, label: c.label }))
  );

  // Transform rows to objects with field keys
  // IMPORTANT: table.rows is typically an array of arrays (each row is an array of cell values)
  const rows = table.rows.map((row: any, rowIdx: number) => {
    const rowObj: any = {};

    // Handle array rows (most common case from API - rows are arrays of cell values)
    if (Array.isArray(row)) {
      table.columns.forEach((column: any, idx: number) => {
        let fieldKey: string;
        if (typeof column === "string") {
          fieldKey = column.replace(/\s+/g, "_").toUpperCase();
        } else {
          // Use the same logic as columns transformation - prioritize column.key
          // IMPORTANT: Must match exactly what was used in column transformation
          fieldKey = column.key || column.fieldKey || column.id || column.name || `col_${idx}`;
        }

        // Get value from array by index
        const cellValue = row[idx];
        rowObj[fieldKey] = cellValue !== undefined && cellValue !== null ? cellValue : "";
      });
    } else if (typeof row === "object" && row !== null) {
      // Handle object rows (if rows are already objects)
      table.columns.forEach((column: any, idx: number) => {
        let fieldKey: string;
        if (typeof column === "string") {
          fieldKey = column.replace(/\s+/g, "_").toUpperCase();
        } else {
          // IMPORTANT: Must match exactly what was used in column transformation
          fieldKey = column.key || column.fieldKey || column.id || column.name || `col_${idx}`;
        }

        // Try to get value from object using various key names
        const cellValue =
          row[fieldKey] || row[column.key] || row[column.id] || row[column.name] || "";

        rowObj[fieldKey] = cellValue !== undefined && cellValue !== null ? cellValue : "";
      });
    }

    if (rowIdx === 0) {
      console.log("First transformed row:", rowObj);
      console.log("Original row was:", row);
      console.log("Is array?", Array.isArray(row));
      console.log("Row length:", Array.isArray(row) ? row.length : "N/A");
    }

    return rowObj;
  });

  console.log("Transformed rows count:", rows.length);
  console.log("First row keys:", Object.keys(rows[0] || {}));

  // Extract prompt text from message
  const promptText = message.message || message.content || "";

  // Generate a name for the sheet
  const name = `Prompt Result - ${new Date().toLocaleDateString()}`;

  const result = {
    name,
    entity: "Consolidated",
    sourceType: "Prompt" as const,
    promptText,
    description: `Data from prompt: ${promptText.substring(0, 100)}...`,
    columns,
    rows,
    calculatedColumns: [],
    filters: [],
  };

  console.log("Final transformed data:", {
    name: result.name,
    columnsCount: result.columns.length,
    rowsCount: result.rows.length,
    columnFieldKeys: result.columns.map((c: any) => c.fieldKey),
    firstRowKeys: Object.keys(result.rows[0] || {}),
  });

  return result;
};

export default function CommandCenter({
  loadingState,
  composerValue,
  isLoading,
  isConnected,
  activeChips,
  openDropdownId,
  showPlaceholder,
  showFinancialResults,
  messages,
  errors,
  streamingEvents = [],
  currentStreamingMessage = "",
  onComposerChange,
  onComposerFocus,
  onComposerBlur,
  onSendClick,
  onChipClick,
  onRemoveChip,
  onPromptSuggestionClick,
  onDropdownToggle,
  onTestUI,
  onOpenLivePinModal,
  onOpenCreateWatchModal,
  onOpenCreateTemplateModal,
  messagesEndRef,
  onNewChat,
  onCancelQuery,
  chatSessions = [],
  activeSessionId,
  onSessionClick,
  isLoadingSessions = false,
  sessionsLoadFailed = false,
  onRetrySessions,
}: CommandCenterProps) {
  const router = useRouter();
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Handle expand button click - navigate to dynamic sheets with preview data
  const handleExpandTable = useCallback(
    (tableId: string) => {
      // Parse tableId format: "table-{messageId}-{tableIndex}"
      const match = tableId.match(/^table-(.+)-(\d+)$/);
      if (!match) return;

      const messageId = match[1];
      const tableIndex = parseInt(match[2]);

      const message = messages.find((m) => m.id === messageId);
      if (!message?.financialData?.tables) return;

      const table = message.financialData.tables[tableIndex];
      if (!table) return;

      // Transform table data for dynamic sheets
      console.log("=== EXPAND TABLE CLICKED ===");
      console.log("Table structure:", {
        columnsCount: table.columns?.length,
        rowsCount: table.rows?.length,
        firstColumn: table.columns?.[0],
        firstRow: table.rows?.[0],
      });

      const transformedData = transformTableForDynamicSheets(table, message);

      console.log("=== TRANSFORMATION COMPLETE ===");
      console.log("Transformed data:", {
        name: transformedData.name,
        columnsCount: transformedData.columns.length,
        rowsCount: transformedData.rows.length,
        firstRowSample: transformedData.rows[0],
        columnFieldKeys: transformedData.columns.map((c: any) => c.fieldKey),
      });

      // Store in sessionStorage for preview mode
      const dataToStore = JSON.stringify(transformedData);
      console.log("Storing data to sessionStorage, size:", dataToStore.length, "chars");
      sessionStorage.setItem("dynamicSheetPreview", dataToStore);

      // Verify it was stored
      const stored = sessionStorage.getItem("dynamicSheetPreview");
      console.log("Verification - stored data exists:", !!stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log("Verification - parsed rows count:", parsed.rows?.length);
      }

      // Navigate to dynamic sheets page in preview mode
      router.push("/home/dynamic-sheets?preview=true");
    },
    [messages, router]
  );

  // Format relative time for session sidebar
  const formatRelativeTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }, []);

  return (
    <main
      className={cn(
        "flex-1 h-full flex flex-col items-center justify-center transition-all duration-1000 ease-out",
        loadingState === "loading" ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
      )}
    >
      <div className="relative w-full flex-1 flex flex-col items-center justify-center min-h-0">
        <div className="w-full max-w-[1363px]">
          {/* AI Agent Mode Layout */}
          {showFinancialResults || messages.length > 0 ? (
            <div className="flex flex-col w-full h-[calc(100vh-65px)] max-w-[1363px] mx-auto px-4">
              {/* Header with Bot Icon */}
              <div className="flex items-center justify-between my-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Bot size={20} className="text-[#6B7EF3]" />
                    <span className="text-lg font-semibold text-[#0F172A]">Finance AI</span>
                  </div>
                </div>
                {/* New Chat button in header */}
                <button
                  onClick={onNewChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Plus size={14} />
                  <span>New Chat</span>
                </button>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto space-y-6 mb-4 pr-4 pb-4 scrollbar-hide">
                {/* Render all messages in chronological order with their data */}
                {(() => {
                  // Find the last assistant message index for follow-up prompts
                  let lastAssistantIndex = -1;
                  for (let i = messages.length - 1; i >= 0; i--) {
                    if (messages[i].role === "assistant" && !messages[i].isStreaming) {
                      lastAssistantIndex = i;
                      break;
                    }
                  }
                  return messages.map((message, index) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      index={index}
                      isLoading={isLoading}
                      messagesLength={messages.length}
                      streamingEvents={streamingEvents}
                      currentStreamingMessage={currentStreamingMessage}
                      onOpenLivePinModal={onOpenLivePinModal}
                      onOpenCreateWatchModal={onOpenCreateWatchModal}
                      onOpenCreateTemplateModal={onOpenCreateTemplateModal}
                      onExpandTable={handleExpandTable}
                      onPromptSuggestionClick={onPromptSuggestionClick}
                      isLastAssistantMessage={index === lastAssistantIndex}
                    />
                  ));
                })()}

                {/* Errors */}
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className="flex justify-start animate-in slide-in-from-bottom-4 duration-500"
                  >
                    <div className="max-w-2xl w-full">
                      <div className="bg-gradient-to-r from-[#FEE2E2] to-[#FECACA] border border-[#F87171] rounded-2xl p-5 shadow-lg">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-[#EF4444] rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-[#991B1B] mb-2">
                              Error Occurred
                            </h4>
                            <p className="text-sm text-[#B91C1C] leading-relaxed">
                              {error.message || "Unknown error"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input at Bottom */}
              <div className="flex items-end gap-4 bg-[#F2FDFF] rounded-[24px] p-2">
                <div className="flex-1">
                  <div
                    className="min-h-[128px] border border-[#656565] bg-white rounded-[24px] p-4 relative hover:border-[#6B7EF3] hover:shadow-lg transition-all duration-300 ease-out focus-within:border-[#6B7EF3] focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#6B7EF3]/20"
                    style={{
                      boxShadow: "0 4px 8px 0 rgba(14, 42, 82, 0.06)",
                    }}
                  >
                    {/* Top-left magic wand icon */}
                    <div className="absolute top-4 left-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_497_362)">
                          <path
                            d="M3.375 16.5V12.75M3.375 5.25V1.5M1.5 3.375H5.25M1.5 14.625H5.25M9.75 2.25L8.44937 5.63165C8.23786 6.18157 8.1321 6.45653 7.96765 6.68781C7.82189 6.8928 7.6428 7.07189 7.43781 7.21765C7.20653 7.3821 6.93157 7.48786 6.38165 7.69937L3 9L6.38165 10.3006C6.93157 10.5121 7.20653 10.6179 7.43781 10.7824C7.6428 10.9281 7.82189 11.1072 7.96765 11.3122C8.1321 11.5435 8.23786 11.8184 8.44937 12.3684L9.75 15.75L11.0506 12.3684C11.2621 11.8184 11.3679 11.5435 11.5324 11.3122C11.6781 11.1072 11.8572 10.9281 12.0622 10.7824C12.2935 10.6179 12.5684 10.5121 13.1184 10.3006L16.5 9L13.1184 7.69937C12.5684 7.48786 12.2935 7.3821 12.0622 7.21765C11.8572 7.07189 11.6781 6.8928 11.5324 6.68781C11.3679 6.45653 11.2621 6.18157 11.0506 5.63165L9.75 2.25Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_497_362">
                            <rect width="18" height="18" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>

                    <textarea
                      placeholder="Sample prompt: Give me 60 days and above aging details for Walmart"
                      value={composerValue}
                      onChange={onComposerChange}
                      onFocus={onComposerFocus}
                      onBlur={onComposerBlur}
                      className="w-full h-full flex-1 resize-none border-none outline-none text-[#0F172A] text-sm transition-all duration-200 placeholder:text-[#7C8A9A] pl-8"
                      aria-label="Enter your prompt"
                      rows={4}
                    />

                    {/* Bottom-left action icons */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsHistoryOpen(true)}
                        className="w-10 h-8 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:border-[#6B7EF3] hover:bg-[#EEF8FF] hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6B7EF3] focus:ring-offset-1"
                        aria-label="History"
                      >
                        <svg
                          className="w-5 h-5 text-[#7C8A9A]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Send / Cancel button */}
                    <div className="absolute bottom-4 right-4">
                      {isLoading ? (
                        <button
                          onClick={onCancelQuery}
                          className="w-[38px] h-[38px] rounded-full border border-[#EF4444] bg-[#EF4444] flex items-center justify-center hover:bg-[#DC2626] hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95"
                          aria-label="Cancel query"
                          title="Cancel query"
                        >
                          <Square size={16} className="text-white fill-white" />
                        </button>
                      ) : (
                        <button
                          onClick={onSendClick}
                          disabled={!composerValue.trim() || !isConnected}
                          className={cn(
                            "w-[38px] h-[38px] rounded-full border border-[#E5E7EB] bg-[#D2D2D2] flex items-center justify-center hover:border-primary hover:bg-primary hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 group",
                            (!composerValue.trim() || !isConnected) &&
                              "opacity-50 cursor-not-allowed"
                          )}
                          aria-label="Send prompt"
                        >
                          <svg
                            className="w-6 h-6 text-white group-hover:text-white transition-colors duration-200"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 12h14m-7-7l7 7-7 7"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[calc(100vh-120px)] overflow-y-auto">
              <div className="w-full max-w-[821px] mx-auto px-4 pb-8">
                {/* Hero Greeting */}
                <div
                  className={cn(
                    "text-center mb-8 md:mb-12 transition-all duration-1200 ease-out delay-200",
                    loadingState === "loading"
                      ? "opacity-0 translate-y-6"
                      : "opacity-100 translate-y-0"
                  )}
                >
                  <div
                    className={cn(
                      "text-[28px] text-[#0F172A] leading-tight transition-all duration-1000 ease-out delay-300",
                      loadingState === "loading"
                        ? "opacity-0 translate-y-4"
                        : "opacity-100 translate-y-0"
                    )}
                  ></div>
                  <div className="text-[28px] text-[#0F172A] leading-tight">
                    {greeting} Mai Lane,
                  </div>
                  <div
                    className={cn(
                      "text-[28px] text-[#0F172A] leading-tight transition-all duration-1000 ease-out delay-500",
                      loadingState === "loading"
                        ? "opacity-0 translate-y-4"
                        : "opacity-100 translate-y-0"
                    )}
                  >
                    How can I{" "}
                    <span className="text-[#6B7EF3] hover:underline cursor-pointer">
                      help you today?
                    </span>
                  </div>
                </div>

                {/* Prompt Composer */}
                <div
                  className={cn(
                    "w-full max-w-[821px] rounded-[24px] mx-auto mb-4 transition-all duration-1000 ease-out delay-700 bg-[#F2FDFF] p-2",
                    loadingState === "loading"
                      ? "opacity-0 translate-y-8 scale-95"
                      : "opacity-100 translate-y-0 scale-100"
                  )}
                >
                  <div className="h-[207px] border border-[#656565] bg-white rounded-[24px] p-4 relative hover:border-[#6B7EF3] hover:shadow-lg transition-all duration-300 ease-out focus-within:border-[#6B7EF3] focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#6B7EF3]/20">
                    {/* Textarea */}
                    <textarea
                      placeholder="Sample prompt: Give me 60 days and above aging details for Walmart"
                      value={composerValue}
                      onChange={onComposerChange}
                      onFocus={onComposerFocus}
                      onBlur={onComposerBlur}
                      className="w-full h-full flex-1 resize-none border-none outline-none text-[#0F172A] text-sm transition-all duration-200"
                      aria-label="Enter your prompt"
                    />

                    {/* Bottom controls */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Control Icons */}
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setIsHistoryOpen(true)}
                              aria-label="History"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                            >
                              <Clock size={14} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" sideOffset={8}>
                            History
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <CircularButton icon={<Star size={14} />} aria-label="Favorites" />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" sideOffset={8}>
                            Favorites
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <CircularButton
                              icon={<Lightbulb size={14} />}
                              aria-label="Suggestions"
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" sideOffset={8}>
                            Suggestions
                          </TooltipContent>
                        </Tooltip>

                        {/* Active Chips */}
                        <div className="flex flex-wrap items-center gap-2 max-w-[320px] ml-2 relative">
                          {activeChips.map((chip) => (
                            <div key={chip.id} className="relative">
                              <button
                                onClick={() => onDropdownToggle(chip.id)}
                                className={cn(
                                  "inline-flex items-center gap-1 h-6 px-2 border rounded-full text-xs font-medium transition-all duration-150 ease-out",
                                  openDropdownId === chip.id
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-slate-900 border-slate-300 hover:bg-primary hover:text-white"
                                )}
                                aria-label={`Toggle ${chip.text} options`}
                              >
                                <span>{chip.text}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveChip(chip.id);
                                  }}
                                  className="w-3 h-3 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-150 ease-out"
                                  aria-label={`Remove ${chip.text} chip`}
                                >
                                  <X size={8} />
                                </button>
                              </button>

                              {/* Dropdown */}
                              {openDropdownId === chip.id && (
                                <div
                                  className="fixed bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50"
                                  style={{
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: "720px",
                                    maxWidth: "90vw",
                                    top: "calc(50vh + 66px + 132px + 8px)",
                                  }}
                                >
                                  <div className="p-2">
                                    <div className="space-y-1">
                                      {[
                                        `Show me ${chip.text.toLowerCase()} overdue for more than 50 days`,
                                        `Show ${chip.text.toLowerCase()} for period Aug 2024`,
                                        `Analyze ${chip.text.toLowerCase()} by Business Unit`,
                                        `View most recent ${chip.text.toLowerCase().slice(0, -1)}`,
                                        `Get ${chip.text.toLowerCase()} by Market`,
                                      ].map((suggestion) => (
                                        <button
                                          key={suggestion}
                                          onClick={() => {
                                            onDropdownToggle(chip.id);
                                            onPromptSuggestionClick(suggestion);
                                          }}
                                          className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] rounded-md transition-colors duration-150 flex items-center gap-2"
                                        >
                                          <ChevronRight size={12} className="text-[#9CA3AF]" />
                                          {suggestion}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={onSendClick}
                          disabled={!composerValue.trim() || !isConnected || isLoading}
                          className={cn(
                            "w-[38px] h-[38px] rounded-full border border-[#E5E7EB] bg-[#D2D2D2] flex items-center justify-center hover:border-indigo-400 hover:bg-primary hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 group",
                            (!composerValue.trim() || !isConnected || isLoading) &&
                              "opacity-50 cursor-not-allowed"
                          )}
                          aria-label="Send prompt"
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <ArrowRight
                              size={24}
                              className="text-[#6B7280] group-hover:text-white transition-colors duration-200"
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suggested Prompts */}
                <div
                  className={cn(
                    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-6 transition-all duration-1000 ease-out delay-900",
                    loadingState === "loading"
                      ? "opacity-0 translate-y-6"
                      : "opacity-100 translate-y-0"
                  )}
                >
                  {SUGGESTED_PROMPTS.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={prompt.id}
                        onClick={() => onPromptSuggestionClick(prompt.text)}
                        className="group flex items-start gap-3 text-left px-4 py-3.5 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#6B7EF3]/40 hover:bg-[#F5F8FF] hover:shadow-md transition-all duration-200 ease-out active:scale-[0.98]"
                        style={{ animationDelay: `${900 + idx * 80}ms` }}
                      >
                        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center group-hover:bg-[#6B7EF3]/15 transition-colors duration-200">
                          <Icon size={16} className="text-[#6B7EF3]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1E293B] leading-snug group-hover:text-slate-900 transition-colors duration-200">
                            {prompt.text}
                          </p>
                          <span className="text-[11px] text-[#94A3B8] mt-1 inline-block">{prompt.category}</span>
                        </div>
                        <ArrowRight size={14} className="mt-1 flex-shrink-0 text-[#CBD5E1] group-hover:text-[#6B7EF3] group-hover:translate-x-0.5 transition-all duration-200" />
                      </button>
                    );
                  })}
                </div>

                {/* Quick Filter Chips */}
                <div
                  className={cn(
                    "flex flex-wrap items-center justify-center gap-2 mt-2 transition-all duration-1000 ease-out delay-1100",
                    loadingState === "loading"
                      ? "opacity-0 translate-y-6"
                      : "opacity-100 translate-y-0"
                  )}
                >
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => onChipClick(chip)}
                      className={cn(
                        "h-8 px-[14px] border rounded-full text-sm hover:shadow-md hover:scale-105 transition-all duration-200 ease-out active:scale-95",
                        activeChips.some((activeChip) => activeChip.text === chip)
                          ? "bg-primary text-white border-primary"
                          : "bg-[#F7FAFC] text-[#6B7280] border-[#E5E7EB] hover:border-slate-300 hover:bg-white hover:text-slate-900"
                      )}
                      aria-label={`Quick action: ${chip}`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat History Drawer – slides in from the right */}
      {isHistoryOpen && (
        <button
          type="button"
          aria-label="Close history"
          className="fixed inset-0 z-30"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 w-[400px] max-w-[85vw] bg-white border-l border-[#E5E7EB] shadow-xl flex flex-col z-40 transition-transform duration-300 ease-out",
          isHistoryOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!isHistoryOpen}
      >
        <div className="border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-900" />
            <h2 className="text-lg font-semibold text-[#191919]">Chat History</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setIsHistoryOpen(false)}
            className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-[#64748B] p-4 shrink-0">
          {isLoadingSessions
            ? "Loading\u2026"
            : sessionsLoadFailed
              ? "Unable to load sessions"
              : `${chatSessions.length} session${chatSessions.length !== 1 ? "s" : ""}`}
        </p>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoadingSessions ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-[#64748B]">Loading sessions\u2026</p>
            </div>
          ) : sessionsLoadFailed ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <WifiOff className="w-12 h-12 text-[#F59E0B] mb-3" />
              <p className="text-sm font-medium text-[#92400E]">Connection issue</p>
              <p className="text-xs text-[#94A3B8] mt-1">
                We couldn&apos;t load your sessions right now. Please check your connection and try
                again.
              </p>
              {onRetrySessions && (
                <button
                  type="button"
                  onClick={onRetrySessions}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              )}
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-12 h-12 text-[#CBD5E1] mb-3" />
              <p className="text-sm text-[#64748B]">No chat history yet</p>
              <p className="text-xs text-[#94A3B8] mt-1">Your sessions will appear here</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {chatSessions.map((s) => (
                <li
                  key={s.session_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSessionClick?.(s);
                    setIsHistoryOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSessionClick?.(s);
                      setIsHistoryOpen(false);
                    }
                  }}
                  className={cn(
                    "rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-left transition-colors hover:border-[#CBD5E1] hover:bg-[#F1F5F9] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                    activeSessionId === s.session_id && "border-blue-500 bg-blue-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-900 truncate">
                      {s.title || "Untitled"}
                    </span>
                    <span className="text-xs text-[#64748B] shrink-0">
                      {s.message_count} msg{s.message_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {s.updated_at && (
                    <p className="text-[10px] text-[#94A3B8] mt-1">
                      {formatRelativeTime(s.updated_at)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

interface CircularButtonProps {
  icon: React.ReactNode;
  "aria-label": string;
  onClick?: () => void;
}

function CircularButton({ icon, "aria-label": ariaLabel, onClick }: CircularButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:border-[#6B7EF3] hover:bg-[#EEF8FF] hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6B7EF3] focus:ring-offset-1"
      aria-label={ariaLabel}
    >
      <span className="text-[#7C8A9A]">{icon}</span>
    </button>
  );
}
