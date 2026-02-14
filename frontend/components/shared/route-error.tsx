"use client";

import { useEffect } from "react";

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4 text-sm">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#0A3B77] text-white text-sm rounded hover:bg-[#0A3B77]/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
