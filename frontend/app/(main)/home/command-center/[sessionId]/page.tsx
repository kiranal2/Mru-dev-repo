"use client";

import CommandCenterContainer from "@/app/(main)/home/command-center/CommandCenterContainer";

interface CommandCenterSessionPageProps {
  params: { sessionId: string };
}

export default function CommandCenterSessionPage({ params }: CommandCenterSessionPageProps) {
  return <CommandCenterContainer initialSessionId={params.sessionId} />;
}
