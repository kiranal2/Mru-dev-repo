export type TimelineEventType =
  | "Capture"
  | "Identify"
  | "Match"
  | "Exception"
  | "Posting"
  | "CustomerContact"
  | "Admin";

export type TimelineActor = "System" | "Analyst" | string;

export type TimelineStatusTag = "Success" | "Warning" | "Blocked";

export interface TimelineArtifact {
  artifactId: string;
  artifactType: "Remittance" | "Email" | "PDF" | "MatchSet" | "JEDraft" | "BankLine" | "Evidence";
  label: string;
  metadata?: {
    emailSubject?: string;
    emailFrom?: string;
    emailDate?: string;
    pdfUrl?: string;
    matchSetData?: any[];
    jeDraftLines?: any[];
    bankLineData?: any;
  };
}

export interface TimelineEvent {
  id: string;
  paymentId: string;
  ts: string;
  eventType: TimelineEventType;
  eventTitle: string;
  actor: TimelineActor;
  reason: string;
  confidence: number;
  artifacts: TimelineArtifact[];
  statusTag?: TimelineStatusTag;
}

class TimelineStore {
  private events: Map<string, TimelineEvent[]> = new Map();

  getEvents(paymentId: string): TimelineEvent[] {
    return this.events.get(paymentId) || [];
  }

  addEvent(event: TimelineEvent): void {
    const paymentEvents = this.events.get(event.paymentId) || [];
    paymentEvents.unshift(event); // Add to beginning
    this.events.set(event.paymentId, paymentEvents);
  }

  initializePaymentTimeline(paymentId: string): void {
    if (this.events.has(paymentId)) return;

    const initialEvents: TimelineEvent[] = [
      {
        id: `${paymentId}-1`,
        paymentId,
        ts: new Date(Date.now() - 7200000).toISOString(),
        eventType: "Capture",
        eventTitle: "Payment Received",
        actor: "System",
        reason: "Bank feed settlement identified new incoming payment transaction",
        confidence: 100,
        artifacts: [
          {
            artifactId: "bank-line-001",
            artifactType: "BankLine",
            label: "Bank Line",
            metadata: {
              bankLineData: { account: "****1234", amount: 15000 },
            },
          },
        ],
        statusTag: "Success",
      },
      {
        id: `${paymentId}-2`,
        paymentId,
        ts: new Date(Date.now() - 7000000).toISOString(),
        eventType: "Identify",
        eventTitle: "Customer Identified",
        actor: "System",
        reason: "Matched payer name to customer master using fuzzy logic and historical patterns",
        confidence: 95,
        artifacts: [
          {
            artifactId: "evidence-001",
            artifactType: "Evidence",
            label: "Evidence",
            metadata: {},
          },
        ],
        statusTag: "Success",
      },
      {
        id: `${paymentId}-3`,
        paymentId,
        ts: new Date(Date.now() - 6800000).toISOString(),
        eventType: "Capture",
        eventTitle: "Remittance Captured",
        actor: "System",
        reason:
          "Email parsing agent extracted remittance advice from inbox (ref: payment number match)",
        confidence: 88,
        artifacts: [
          {
            artifactId: "email-001",
            artifactType: "Email",
            label: "Email",
            metadata: {
              emailSubject: "Payment Advice - Invoice Settlement",
              emailFrom: "ap@customer.com",
              emailDate: new Date(Date.now() - 6900000).toISOString(),
            },
          },
          {
            artifactId: "remit-001",
            artifactType: "Remittance",
            label: "Remittance",
            metadata: {},
          },
        ],
        statusTag: "Success",
      },
      {
        id: `${paymentId}-4`,
        paymentId,
        ts: new Date(Date.now() - 6500000).toISOString(),
        eventType: "Capture",
        eventTitle: "Remittance Linked",
        actor: "System",
        reason:
          "Associated parsed remittance document with payment record based on payment number cross-reference",
        confidence: 92,
        artifacts: [
          {
            artifactId: "remit-001",
            artifactType: "Remittance",
            label: "Remittance",
            metadata: {},
          },
        ],
        statusTag: "Success",
      },
      {
        id: `${paymentId}-5`,
        paymentId,
        ts: new Date(Date.now() - 6000000).toISOString(),
        eventType: "Match",
        eventTitle: "Auto-Match Attempted",
        actor: "System",
        reason:
          "Matching engine analyzed 3 open invoices from remittance references against AR ledger",
        confidence: 70,
        artifacts: [
          {
            artifactId: "matchset-001",
            artifactType: "MatchSet",
            label: "Match Set",
            metadata: {
              matchSetData: [
                { invoice: "INV-2024-001", amount: 5000, matched: true },
                { invoice: "INV-2024-002", amount: 7500, matched: true },
                { invoice: "INV-2024-003", amount: 2500, matched: true },
              ],
            },
          },
        ],
        statusTag: "Success",
      },
      {
        id: `${paymentId}-6`,
        paymentId,
        ts: new Date(Date.now() - 5800000).toISOString(),
        eventType: "Match",
        eventTitle: "Auto-Matched",
        actor: "System",
        reason:
          "Successfully matched payment to 3 invoices totaling $15,000 with exact balance alignment",
        confidence: 90,
        artifacts: [
          {
            artifactId: "matchset-001",
            artifactType: "MatchSet",
            label: "Match Set",
            metadata: {
              matchSetData: [
                { invoice: "INV-2024-001", amount: 5000, matched: true },
                { invoice: "INV-2024-002", amount: 7500, matched: true },
                { invoice: "INV-2024-003", amount: 2500, matched: true },
              ],
            },
          },
          {
            artifactId: "jedraft-001",
            artifactType: "JEDraft",
            label: "JE Draft",
            metadata: {
              jeDraftLines: [
                { account: "1010", debit: 15000, credit: 0, description: "Cash Receipt" },
                { account: "1200", debit: 0, credit: 15000, description: "AR Clear" },
              ],
            },
          },
        ],
        statusTag: "Success",
      },
      {
        id: `${paymentId}-7`,
        paymentId,
        ts: new Date(Date.now() - 3600000).toISOString(),
        eventType: "Posting",
        eventTitle: "Moved to PendingToPost",
        actor: "System",
        reason: "Auto-match confidence exceeded 85% threshold, queued for posting approval",
        confidence: 90,
        artifacts: [],
        statusTag: "Success",
      },
    ];

    this.events.set(paymentId, initialEvents);
  }
}

export const timelineStore = new TimelineStore();
