"use client";

import { useMemo } from "react";
import { useIGRSCases } from "./use-igrs-cases";
import { useIGRSRole } from "@/lib/ai-chat-intelligence/role-context";

export function useJurisdictionFilteredCases(filters?: Parameters<typeof useIGRSCases>[0]) {
  const casesResult = useIGRSCases(filters);
  const { session, isInJurisdiction } = useIGRSRole();

  const filteredData = useMemo(() => {
    if (!session) return casesResult.data;
    return casesResult.data.filter((c) =>
      isInJurisdiction(c.office.district, c.office.srCode)
    );
  }, [casesResult.data, session, isInJurisdiction]);

  return {
    ...casesResult,
    data: filteredData,
    total: filteredData.length,
  };
}
