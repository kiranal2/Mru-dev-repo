import React from "react";

interface AgingCardData {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  isImprovement?: boolean;
}

interface AgingSummaryCardsProps {
  className?: string;
  onOpenLivePinModal?: () => void;
  onOpenCreateWatchModal?: () => void;
  onOpenCreateTemplateModal?: () => void;
  onExpand?: () => void;
}

const AgingSummaryCards: React.FC<AgingSummaryCardsProps> = ({
  className = "",
  onOpenLivePinModal,
  onOpenCreateWatchModal,
  onOpenCreateTemplateModal,
  onExpand,
}) => {
  // Mock data for aging summary cards
  const agingData: AgingCardData[] = [
    {
      title: "Total Amount Due:",
      value: "$2.4M",
      change: "↓ 2.5% Vs Baseline",
      changeType: "decrease",
    },
    {
      title: "1- 30 days",
      value: "$450k",
      change: "↓ 5.2% Improvement",
      changeType: "decrease",
      isImprovement: true,
    },
    {
      title: "31- 60 days",
      value: "$680k",
      change: "↑ 1.8% Vs Baseline",
      changeType: "increase",
    },
    {
      title: "61- 90 days",
      value: "$820k",
      change: "↑ 3.1% Vs Baseline",
      changeType: "increase",
    },
    {
      title: "90+ days",
      value: "$450k",
      change: "↓ 8.7% Improvement",
      changeType: "decrease",
      isImprovement: true,
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Action Buttons - Only show if handlers are provided */}
      {(onOpenLivePinModal || onOpenCreateWatchModal || onOpenCreateTemplateModal) && (
        <div className="flex justify-between items-center">
          <div></div> {/* Empty div for spacing */}
          <div className="flex items-center space-x-2">
            {onExpand && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onExpand();
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
                    stroke="#0A3B77"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>Expand</span>
              </button>
            )}

            {onOpenCreateTemplateModal && (
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
                    stroke="#0A3B77"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>Create Template</span>
              </button>
            )}

            {onOpenCreateWatchModal && (
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
                  stroke="#0A3B77"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Add to Watchlist</span>
              </button>
            )}

            {onOpenLivePinModal && (
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
                    stroke="#0A3B77"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>Pin</span>
              </button>
            )}

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
                  stroke="#0A3B77"
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
                  stroke="#0A3B77"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>Download</span>
            </button>
          </div>
        </div>
      )}

      {/* Aging Cards */}
      <div className="flex gap-3">
        {agingData.map((card, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-3 flex-1 min-w-[180px]"
          >
            {/* Title */}
            <div className="text-xs text-gray-600 mb-1">{card.title}</div>

            {/* Main Value */}
            <div className="text-lg font-bold text-black mb-2">{card.value}</div>

            {/* Change Indicator */}
            <div
              className={`text-xs flex items-center gap-1 ${
                card.changeType === "increase"
                  ? "text-green-600"
                  : card.isImprovement
                    ? "text-red-600"
                    : "text-red-600"
              }`}
            >
              <span className="text-xs">{card.changeType === "increase" ? "↑" : "↓"}</span>
              <span>{card.change}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgingSummaryCards;
