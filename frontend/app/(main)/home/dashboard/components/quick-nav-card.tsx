"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

interface QuickNavCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  accentColor?: string;
}

export function QuickNavCard({ title, description, icon, route, accentColor = "border-l-primary" }: QuickNavCardProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(route)}
      className={`w-full text-left bg-white rounded-xl border border-slate-200 ${accentColor} border-l-[3px] p-4 hover:shadow-sm transition-all group`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
            {icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{description}</div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors mt-1" />
      </div>
    </button>
  );
}
