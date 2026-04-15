import { PersonaProvider } from "@/lib/persona-context";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PersonaProvider>
      <div className="min-h-screen bg-white">
        {children}
      </div>
    </PersonaProvider>
  );
}
