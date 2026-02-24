import { IGRSRoleProvider } from "@/lib/ai-chat-intelligence/role-context";

export default function AIChatIntelligenceLayout({ children }: { children: React.ReactNode }) {
  return <IGRSRoleProvider>{children}</IGRSRoleProvider>;
}
