'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ArrowRight,
  Clock,
  Star,
  Lightbulb,
  X,
  ChevronRight,
  TrendingUp,
  Receipt,
  DollarSign,
  AlertCircle,
  Users,
  PieChart,
  type LucideIcon,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Chip = {
  id: string;
  text: string;
  isOpen?: boolean;
};

type SuggestedPrompt = {
  id: string;
  icon: LucideIcon;
  text: string;
  category: string;
};

const QUICK_CHIPS = [
  'Invoices',
  'Payments',
  'Credit Memos',
  'Customers',
  'AR Balance',
  'AR Aging'
];

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: "sp-1", icon: TrendingUp, text: "Show me AR aging summary for all customers", category: "AR Aging" },
  { id: "sp-2", icon: Receipt, text: "List all open invoices over $100,000", category: "Invoices" },
  { id: "sp-3", icon: DollarSign, text: "Give me payment history for the last 30 days", category: "Payments" },
  { id: "sp-4", icon: Users, text: "Show top 10 customers by outstanding balance", category: "Customers" },
  { id: "sp-5", icon: AlertCircle, text: "What invoices are overdue by more than 60 days?", category: "Collections" },
  { id: "sp-6", icon: PieChart, text: "Break down AR balance by business unit", category: "Analysis" },
];

const FAVORITE_PROMPTS: SuggestedPrompt[] = [
  { id: "fav-1", icon: TrendingUp, text: "Show me AR aging summary for all customers", category: "AR Aging" },
  { id: "fav-2", icon: Receipt, text: "List all open invoices over $100,000", category: "Invoices" },
  { id: "fav-3", icon: DollarSign, text: "What is unapplied cash by entity?", category: "Cash App" },
  { id: "fav-4", icon: AlertCircle, text: "Show overdue invoices by business unit", category: "Collections" },
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
  onHistoryClick?: () => void;
  onPopulateComposer?: (text: string) => void;
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
  onTestUI,
  onHistoryClick,
  onPopulateComposer,
}: PromptComposerProps) {
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [sessionFavorites, setSessionFavorites] = useState<SuggestedPrompt[]>([]);

  const closeAllPanels = useCallback(() => {
    setIsFavoritesOpen(false);
    setIsSuggestionsOpen(false);
  }, []);

  const openFavorites = useCallback(() => {
    setIsFavoritesOpen(true);
    setIsSuggestionsOpen(false);
  }, []);

  const openSuggestions = useCallback(() => {
    setIsSuggestionsOpen(true);
    setIsFavoritesOpen(false);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAllPanels();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeAllPanels]);

  const allFavorites = useMemo(
    () => [...FAVORITE_PROMPTS, ...sessionFavorites],
    [sessionFavorites]
  );

  const handlePopulate = useCallback(
    (text: string) => {
      if (onPopulateComposer) onPopulateComposer(text);
      closeAllPanels();
    },
    [onPopulateComposer, closeAllPanels]
  );

  const handleSaveFavorite = useCallback(() => {
    if (!composerValue.trim()) return;
    const newFav: SuggestedPrompt = {
      id: `fav-user-${Date.now()}`,
      icon: Star,
      text: composerValue.trim(),
      category: 'My Prompts',
    };
    setSessionFavorites((prev) => [...prev, newFav]);
    setIsFavoritesOpen(false);
  }, [composerValue]);

  return (
    <div className="animated-border-box w-full max-w-[821px] mx-auto mb-4 transition-all duration-1000 ease-out delay-700">
      {/* Inner content with white bg */}
      <div
        className="h-[207px] bg-white rounded-[22px] p-4 relative z-10"
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
            {/* History */}
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <CircularButton
                  icon={<Clock size={14} />}
                  aria-label="History"
                  onClick={() => { closeAllPanels(); onHistoryClick?.(); }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" align="center" sideOffset={8}>
                History
              </TooltipContent>
            </Tooltip>

            {/* Favorites */}
            <div className="relative">
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => isFavoritesOpen ? closeAllPanels() : openFavorites()}
                    className={cn(
                      "w-7 h-7 rounded-full border bg-white flex items-center justify-center hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6B7EF3] focus:ring-offset-1",
                      isFavoritesOpen
                        ? "border-primary text-primary bg-primary/5"
                        : "border-[#E5E7EB] text-[#7C8A9A] hover:border-[#6B7EF3] hover:bg-[#EEF8FF]"
                    )}
                    aria-label="Favorites"
                  >
                    <Star size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" sideOffset={8}>
                  Favorites
                </TooltipContent>
              </Tooltip>
              {isFavoritesOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-40" aria-label="Close favorites" onClick={closeAllPanels} />
                  <div className="absolute bottom-full left-0 mb-2 w-[360px] max-h-[280px] bg-white border border-slate-200 rounded-xl shadow-elevation-3 z-50 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 shrink-0">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-amber-500" />
                        <span className="text-sm font-semibold text-slate-900">Favorites</span>
                      </div>
                      <button type="button" onClick={closeAllPanels} className="p-1 rounded-md hover:bg-slate-100 text-slate-400"><X size={14} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 py-1.5">
                      {allFavorites.map((fav) => {
                        const Icon = fav.icon;
                        return (
                          <button key={fav.id} type="button" onClick={() => handlePopulate(fav.text)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-start gap-2.5 group">
                            <Icon size={14} className="text-primary mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-slate-700 leading-snug truncate group-hover:text-slate-900">{fav.text}</p>
                              <span className="text-[11px] text-slate-400">{fav.category}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {composerValue.trim() && (
                      <div className="border-t border-slate-100 px-2 py-1.5 shrink-0">
                        <button type="button" onClick={handleSaveFavorite} className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-2 text-sm text-amber-600 font-medium">
                          <Star size={14} />
                          Save current prompt
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Suggestions */}
            <div className="relative">
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => isSuggestionsOpen ? closeAllPanels() : openSuggestions()}
                    className={cn(
                      "w-7 h-7 rounded-full border bg-white flex items-center justify-center hover:scale-110 hover:shadow-md transition-all duration-200 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6B7EF3] focus:ring-offset-1",
                      isSuggestionsOpen
                        ? "border-primary text-primary bg-primary/5"
                        : "border-[#E5E7EB] text-[#7C8A9A] hover:border-[#6B7EF3] hover:bg-[#EEF8FF]"
                    )}
                    aria-label="Suggestions"
                  >
                    <Lightbulb size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" sideOffset={8}>
                  Suggestions
                </TooltipContent>
              </Tooltip>
              {isSuggestionsOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-40" aria-label="Close suggestions" onClick={closeAllPanels} />
                  <div className="absolute bottom-full left-0 mb-2 w-[360px] max-h-[280px] bg-white border border-slate-200 rounded-xl shadow-elevation-3 z-50 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 shrink-0">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={14} className="text-amber-500" />
                        <span className="text-sm font-semibold text-slate-900">Suggestions</span>
                      </div>
                      <button type="button" onClick={closeAllPanels} className="p-1 rounded-md hover:bg-slate-100 text-slate-400"><X size={14} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 py-1.5">
                      {SUGGESTED_PROMPTS.map((sug) => {
                        const Icon = sug.icon;
                        return (
                          <button key={sug.id} type="button" onClick={() => handlePopulate(sug.text)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-start gap-2.5 group">
                            <Icon size={14} className="text-primary mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-slate-700 leading-snug truncate group-hover:text-slate-900">{sug.text}</p>
                              <span className="text-[11px] text-slate-400">{sug.category}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

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
