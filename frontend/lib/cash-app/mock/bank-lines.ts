import type { Payment, BankLine } from "../types";

const generateMockBankLines = (payments: Payment[]): BankLine[] => {
  const lines: BankLine[] = [];
  const candidatePayments = payments.slice(0, 18);

  candidatePayments.forEach((payment, idx) => {
    const isLinked = idx % 3 !== 0;
    const bankRef = payment.bank_txn_ref || `TR-${200000 + idx}`;
    const bankAccountToken =
      payment.bank_account_token || `****${(3000 + idx).toString().slice(-4)}`;
    const status =
      isLinked && payment.posted_status === "POSTED" && payment.bank_match_ready
        ? "LINKED_POSTED"
        : isLinked && payment.posted_status !== "POSTED"
          ? "LINKED_NOT_POSTED"
          : isLinked && payment.bank_match_ready === false
            ? "RISK"
            : "UNLINKED";

    lines.push({
      bank_line_id: `BL-${9000 + idx}`,
      bank_date: payment.received_at?.split("T")[0] || payment.date,
      amount: payment.amount,
      bank_txn_ref: bankRef,
      bank_account_token: bankAccountToken,
      linked_payment_id: isLinked ? payment.id : null,
      status,
    });
  });

  for (let i = 0; i < 6; i++) {
    lines.push({
      bank_line_id: `BL-${9100 + i}`,
      bank_date: `2024-12-${10 + i}`,
      amount: Math.floor(Math.random() * 90000) + 5000,
      bank_txn_ref: `TR-${300000 + i}`,
      bank_account_token: `****${(6100 + i).toString().slice(-4)}`,
      linked_payment_id: null,
      status: "UNLINKED",
    });
  }

  return lines;
};

export { generateMockBankLines };
