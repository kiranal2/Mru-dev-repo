"use client";

import React from "react";
import { AlertCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface InterruptEvent {
  interruptId: string;
  message: string;
  options: Array<{ value: string; label: string }>;
  agent: string;
  context?: any;
  timestamp: string;
}

interface InterruptModalProps {
  interrupt: InterruptEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onRespond: (interruptId: string, value: string) => void;
  className?: string;
}

export const InterruptModal: React.FC<InterruptModalProps> = ({
  interrupt,
  isOpen,
  onClose,
  onRespond,
  className
}) => {
  if (!interrupt) return null;

  const handleResponse = (value: string) => {
    onRespond(interrupt.interruptId, value);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
              <AlertCircle className="w-4 h-4 text-orange-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Agent Interruption
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600">
            <div className="flex items-center space-x-2 mt-2">
              <Bot className="w-4 h-4 text-gray-500" />
              <span>{interrupt.agent} needs your input</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {interrupt.message}
            </p>
          </div>

          {interrupt.context && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Context:</h4>
              <div className="bg-blue-50 rounded-lg p-3">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(interrupt.context, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          {interrupt.options.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              onClick={() => handleResponse(option.value)}
              className="w-full sm:w-auto"
            >
              {option.label}
            </Button>
          ))}
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Button>
        </DialogFooter>

        <div className="text-xs text-gray-400 text-center pt-2 border-t">
          {new Date(interrupt.timestamp).toLocaleString()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
