"use client";

import { User, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type Persona = 'ACCOUNTANT' | 'CONTROLLER' | 'CFO';

interface PersonaSwitcherProps {
  currentPersona: Persona;
  onPersonaChange: (persona: Persona) => void;
}

export function PersonaSwitcher({ currentPersona, onPersonaChange }: PersonaSwitcherProps) {
  const personas = [
    {
      value: 'ACCOUNTANT' as Persona,
      label: 'Accountant',
      icon: User,
      description: 'Task-level details'
    },
    {
      value: 'CONTROLLER' as Persona,
      label: 'Controller',
      icon: Users,
      description: 'Team oversight'
    },
    {
      value: 'CFO' as Persona,
      label: 'CFO / CXO',
      icon: Building2,
      description: 'Executive summary'
    }
  ];

  const currentPersonaData = personas.find(p => p.value === currentPersona);
  const CurrentIcon = currentPersonaData?.icon || User;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="font-medium">{currentPersonaData?.label}</span>
          <span className="text-xs text-slate-500 ml-1">View</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-slate-500 uppercase">Switch Persona</p>
        </div>
        <DropdownMenuSeparator />
        {personas.map((persona) => {
          const Icon = persona.icon;
          return (
            <DropdownMenuItem
              key={persona.value}
              onClick={() => onPersonaChange(persona.value)}
              className="cursor-pointer"
            >
              <div className="flex items-start gap-3 py-1">
                <Icon className="h-4 w-4 mt-0.5 text-slate-600" />
                <div>
                  <div className="font-medium text-sm">{persona.label}</div>
                  <div className="text-xs text-slate-500">{persona.description}</div>
                </div>
                {currentPersona === persona.value && (
                  <div className="ml-auto">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
