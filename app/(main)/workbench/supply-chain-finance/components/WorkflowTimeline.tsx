import { CheckCircle2, Clock, AlertCircle, User } from "lucide-react";
import { WorkflowHistoryEntry } from "../services/WorkflowService";
import { format, differenceInDays } from "date-fns";

interface WorkflowTimelineProps {
  history: WorkflowHistoryEntry[];
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Resolution":
      return "text-green-400 border-green-500 bg-green-500/10";
    case "Awaiting Supplier":
      return "text-blue-400 border-blue-500 bg-blue-500/10";
    case "Buyer Action":
      return "text-amber-400 border-amber-500 bg-amber-500/10";
    case "Risk":
      return "text-red-400 border-red-500 bg-red-500/10";
    case "Escalated":
      return "text-purple-400 border-purple-500 bg-purple-500/10";
    default:
      return "text-gray-400 border-gray-500 bg-gray-500/10";
  }
};

const getCategoryIcon = (category: string, isCurrent: boolean) => {
  if (category === "Resolution") {
    return <CheckCircle2 className="w-5 h-5" />;
  }
  if (category === "Risk" || category === "Escalated") {
    return <AlertCircle className="w-5 h-5" />;
  }
  if (isCurrent) {
    return <Clock className="w-5 h-5" />;
  }
  return <User className="w-5 h-5" />;
};

const getSLAStatus = (slaDueDate: string | null, statusDate: string, isCurrent: boolean) => {
  if (!slaDueDate || !isCurrent) return null;

  const today = new Date();
  const dueDate = new Date(slaDueDate);
  const daysRemaining = differenceInDays(dueDate, today);

  if (daysRemaining < 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500">
        {Math.abs(daysRemaining)} days overdue
      </span>
    );
  } else if (daysRemaining === 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500">
        Due today
      </span>
    );
  } else if (daysRemaining <= 2) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500">
        {daysRemaining} days remaining
      </span>
    );
  } else {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500">
        {daysRemaining} days remaining
      </span>
    );
  }
};

export function WorkflowTimeline({ history }: WorkflowTimelineProps) {
  if (!history || history.length === 0) {
    return <div className="text-center py-8 text-gray-400">No workflow history available</div>;
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => {
        const isLast = index === history.length - 1;
        const categoryColor = getCategoryColor(entry.workflow_category);
        const icon = getCategoryIcon(entry.workflow_category, entry.is_current);
        const slaStatus = getSLAStatus(entry.sla_due_date, entry.status_date, entry.is_current);

        return (
          <div key={entry.id} className="relative">
            {!isLast && <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-700" />}

            <div
              className={`relative flex gap-4 p-4 rounded-lg border ${
                entry.is_current
                  ? "border-blue-500 bg-blue-500/5"
                  : "border-gray-700 bg-gray-800/50"
              }`}
            >
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${categoryColor}`}
              >
                {icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{entry.workflow_status}</h4>
                      {entry.is_current && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {format(new Date(entry.status_date), "dd-MMM-yyyy")}
                      {entry.action_by && ` • Action by: ${entry.action_by}`}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColor}`}>
                      {entry.workflow_category}
                    </span>
                    {slaStatus}
                  </div>
                </div>

                {entry.details && (
                  <p className="text-sm text-gray-300 leading-relaxed">{entry.details}</p>
                )}

                {entry.sla_days !== null && !entry.is_current && (
                  <p className="text-xs text-gray-500 mt-2">
                    SLA: {entry.sla_days} {entry.sla_days === 1 ? "day" : "days"}
                    {entry.sla_due_date &&
                      ` (Due: ${format(new Date(entry.sla_due_date), "dd-MMM-yyyy")})`}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
