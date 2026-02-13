"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CashApplicationPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/workbench/order-to-cash/cash-application/payments");
  }, [router]);

  return null;
}
