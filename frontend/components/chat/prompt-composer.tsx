'use client';

import React from 'react';
import { ArrowRight, Clock, Star, Lightbulb, X, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Chip = {
  id: string;
  text: string;
  isOpen?: boolean;
};

const QUICK_CHIPS = [
  'Invoices',
  'Payments', 
  'Credit Memos',
  'Customers',
  'AR Balance',
  'AR Aging'
];

interface PromptComposerProps {
  composerValue: string;
  isLoading: boolean;
  isConnected: boolean;
  activeChips: Chip[];
  openDropdownId: string | null;
  showPlaceholder: boolean;
  onComposerChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onComposerFocus: () => void;
  onComposerBlur: () => void;
  onSendClick: () => void;
  onChipClick: (chipText: string) => void;
  onRemoveChip: (chipId: string) => void;
  onDropdownToggle: (chipId: string) => void;
  onTestUI: () => void;
}

export default function PromptComposer({
  composerValue,
  isLoading,
  isConnected,
  activeChips,
  openDropdownId,
  showPlaceholder,
  onComposerChange,
  onComposerFocus,
  onComposerBlur,
  onSendClick,
  onChipClick,
  onRemoveChip,
  onDropdownToggle,
  onTestUI
}: PromptComposerProps) {
  return (
    <div className="w-full max-w-[821px] rounded-[24px] mx-auto mb-4 transition-all duration-1000 ease-out delay-700 bg-[#F2FDFF] p-2">
      <div 
        className="h-[207px] border border-[#656565] bg-white rounded-[24px] p-4 relative hover:border-[#6B7EF3] hover:shadow-lg transition-all duration-300 ease-out focus-within:border-[#6B7EF3] focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#6B7EF3]/20"
      >
        {/* Textarea */}
        <textarea
          placeholder='Sample prompt: Give me 60 days and above aging details for Walmart'
          value={composerValue}
          onChange={onComposerChange}
          onFocus={onComposerFocus}
          onBlur={onComposerBlur}
          className="w-full h-full flex-1 resize-none border-none outline-none text-[#0F172A] text-sm transition-all duration-200"
          aria-label="Enter your prompt"
        />

        {/* Bottom controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Control Icons */}
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <CircularButton
                  icon={<Clock size={14} />}
                  aria-label="History"
                />
              </TooltipTrigger>
              <TooltipContent side="top" align="center" sideOffset={8}>
                History
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <CircularButton
                  icon={<Star size={14} />}
                  aria-label="Favorites"
                />
              </TooltipTrigger>
              <TooltipContent side="top" align="center" sideOffset={8}>
                Favorites
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <CircularButton
                  icon={<Lightbulb size={14} />}
                  aria-label="Suggestions"
                />
              </TooltipTrigger>
              <TooltipContent side="top" align="center" sideOffset={8}>
                Suggestions
              </TooltipContent>
            </Tooltip>
            
            {/* Active Chips */}
            <div className="flex flex-wrap items-center gap-2 max-w-[320px] ml-2 relative">
              {activeChips.map((chip) => (
                <div 
                  key={chip.id}
                  className="relative"
                >
                  <button
                    onClick={() => onDropdownToggle(chip.id)}
                    className={cn(
                      "inline-flex items-center gap-1 h-6 px-2 border rounded-full text-xs font-medium transition-all duration-150 ease-out",
                      openDropdownId === chip.id
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-primary border-primary hover:bg-primary hover:text-white"
                    )}
                    aria-label={`Toggle ${chip.text} options`}
                  >
                    <span>{chip.text}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveChip(chip.id);
                      }}
                      className="w-3 h-3 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-150 ease-out"
                      aria-label={`Remove ${chip.text} chip`}
                    >
                      <X size={8} />
                    </button>
                  </button>
                  
                  {/* Dropdown */}
                  {openDropdownId === chip.id && (
                    <div 
                      className="fixed bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50" 
                      style={{
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '720px',
                        maxWidth: '90vw',
                        top: 'calc(50vh + 66px + 132px + 8px)'
                      }}
                    >
                      <div className="p-2">
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              onDropdownToggle(chip.id);
                              alert('Demo: Show me invoices overdue for more than 50 days');
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] rounded-md transition-colors duration-150 flex items-center gap-2"
                          >
                            <ChevronRight size={12} className="text-[#9CA3AF]" />
                            Show me {chip.text.toLowerCase()} overdue for more than 50 days
                          </button>
                          <button
                            onClick={() => {
                              onDropdownToggle(chip.id);
                              alert(`Demo: Show ${chip.text.toLowerCase()} for period Aug 2024`);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] rounded-md transition-colors duration-150 flex items-center gap-2"
                          >
                            <ChevronRight size={12} className="text-[#9CA3AF]" />
                            Show {chip.text.toLowerCase()} for period Aug 2024
                          </button>
                          <button
                            onClick={() => {
                              onDropdownToggle(chip.id);
                              alert(`Demo: Analyze ${chip.text.toLowerCase()} by Business Unit`);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] rounded-md transition-colors duration-150 flex items-center gap-2"
                          >
                            <ChevronRight size={12} className="text-[#9CA3AF]" />
                            Analyze {chip.text.toLowerCase()} by Business Unit
                          </button>
                          <button
                            onClick={() => {
                              onDropdownToggle(chip.id);
                              alert(`Demo: View most recent ${chip.text.toLowerCase().slice(0, -1)}`);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] rounded-md transition-colors duration-150 flex items-center gap-2"
                          >
                            <ChevronRight size={12} className="text-[#9CA3AF]" />
                            View most recent {chip.text.toLowerCase().slice(0, -1)}
                          </button>
                          <button
                            onClick={() => {
                              onDropdownToggle(chip.id);
                              alert(`Demo: Get ${chip.text.toLowerCase()} by Market`);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-[#F3F4F6] rounded-md transition-colors duration-150 flex items-center gap-2"
                          >
                            <ChevronRight size={12} className="text-[#9CA3AF]" />
                            Get {chip.text.toLowerCase()} by Market
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onSendClick}
              disabled={!composerValue.trim() || !isConnected || isLoading}
              className={cn(
                "w-[38px] h-[38px] rounded-full border border-[#E5E7EB] bg-[#D2D2D2] flex items-center justify-center hover:border-[#6B7EF3] hover:bg-primary hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 group",
                (!composerValue.trim() || !isConnected || isLoading) && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Send prompt"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ArrowRight size={24} className="text-white group-hover:text-white transition-colors duration-200" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Chips Component
interface QuickChipsProps {
  activeChips: Chip[];
  onChipClick: (chipText: string) => void;
  onTestUI: () => void;
  loadingState: 'loading' | 'loaded';
}

export function QuickChips({ activeChips, onChipClick, onTestUI, loadingState }: QuickChipsProps) {
  return (
    <div className={cn(
      "flex flex-wrap items-center justify-center gap-[16px] my-4 transition-all duration-1000 ease-out delay-900",
      loadingState === 'loading' 
        ? "opacity-0 translate-y-6" 
        : "opacity-100 translate-y-0"
    )}>
      {QUICK_CHIPS.map((chip) => (
        <button
          key={chip}
          onClick={() => onChipClick(chip)}
          className={cn(
            "h-8 px-[14px] border rounded-full text-sm hover:shadow-md hover:scale-105 transition-all duration-200 ease-out active:scale-95",
            activeChips.some(activeChip => activeChip.text === chip)
              ? "bg-[#6B7EF3] text-white border-[#6B7EF3]"
              : "bg-[#F7FAFC] text-[#6B7280] border-[#E5E7EB] hover:border-[#6B7EF3] hover:bg-[#EEF8FF] hover:text-[#6B7EF3]"
          )}
          aria-label={`Quick action: ${chip}`}
        >
          {chip}
        </button>
      ))}
      <button
        onClick={onTestUI}
        className="h-8 px-[14px] border rounded-full text-sm hover:shadow-md hover:scale-105 transition-all duration-200 ease-out active:scale-95 bg-[#6B7EF3] text-white border-[#6B7EF3] hover:bg-[#5A67D8]"
        aria-label="Test UI"
      >
        Test UI
      </button>
    </div>
  );
}

interface CircularButtonProps {
  icon: React.ReactNode;
  'aria-label': string;
  onClick?: () => void;
}

function CircularButton({ icon, 'aria-label': ariaLabel, onClick }: CircularButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:border-[#6B7EF3] hover:bg-[#EEF8FF] hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6B7EF3] focus:ring-offset-1"
      aria-label={ariaLabel}
    >
      <span className="text-[#7C8A9A]">{icon}</span>
    </button>
  );
}
