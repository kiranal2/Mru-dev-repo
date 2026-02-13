"use client";

import { useState, useEffect, useRef } from "react";
import {
  TimelineEvent,
  TimelineEventType,
  TimelineActor,
  timelineStore,
} from "@/lib/timeline-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Clock,
  Bot,
  User2,
  Mail,
  File,
  Link2,
  Edit3,
  Building2,
  BarChart3,
  Paperclip,
  FileText,
} from "lucide-react";
import { ArtifactViewerModal } from "./ArtifactViewerModal";
import { TimelineArtifact } from "@/lib/timeline-store";

interface WhatHappenedTimelineProps {
  paymentId: string;
  onRefresh?: () => void;
}

export function WhatHappenedTimeline({ paymentId, onRefresh }: WhatHappenedTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSticky, setIsSticky] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<TimelineArtifact | null>(null);
  const [artifactModalOpen, setArtifactModalOpen] = useState(false);

  const [eventTypeFilter, setEventTypeFilter] = useState<string>("All");
  const [actorFilter, setActorFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    timelineStore.initializePaymentTimeline(paymentId);
    loadEvents();

    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const shouldBeSticky = rect.top < -50;
        setIsSticky(shouldBeSticky);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [paymentId]);

  const loadEvents = () => {
    const allEvents = timelineStore.getEvents(paymentId);
    setEvents(allEvents);
  };

  useEffect(() => {
    if (onRefresh) {
      loadEvents();
    }
  }, [onRefresh]);

  const handleArtifactClick = (artifact: TimelineArtifact) => {
    setSelectedArtifact(artifact);
    setArtifactModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case "Success":
        return "bg-green-100 text-green-800";
      case "Warning":
        return "bg-yellow-100 text-yellow-800";
      case "Blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const ArtifactIcon = ({ type }: { type: string }) => {
    const iconMap: Record<string, React.ReactNode> = {
      Remittance: <FileText className="w-3 h-3" />,
      Email: <Mail className="w-3 h-3" />,
      PDF: <File className="w-3 h-3" />,
      MatchSet: <Link2 className="w-3 h-3" />,
      JEDraft: <Edit3 className="w-3 h-3" />,
      BankLine: <Building2 className="w-3 h-3" />,
      Evidence: <BarChart3 className="w-3 h-3" />,
    };
    return <>{iconMap[type] || <Paperclip className="w-3 h-3" />}</>;
  };

  const filteredEvents = events.filter((event) => {
    if (eventTypeFilter !== "All" && event.eventType !== eventTypeFilter) return false;
    if (actorFilter !== "All" && event.actor !== actorFilter) return false;
    if (
      searchQuery &&
      !event.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !event.reason.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const renderTimeline = () => (
    <div className="space-y-4">
      {filteredEvents.slice(0, isExpanded ? filteredEvents.length : 5).map((event, index) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2"></div>
            {index !==
              Math.min(filteredEvents.length, isExpanded ? filteredEvents.length : 5) - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 mt-1 min-h-[40px]"></div>
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-sm">{event.eventTitle}</div>
                {event.statusTag && (
                  <Badge className={`text-xs ${getStatusBadgeColor(event.statusTag)}`}>
                    {event.statusTag}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {formatDate(event.ts)}
              </div>
            </div>

            <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
              {event.actor === "System" || event.actor.startsWith("Agent:") ? (
                <Bot className="w-3 h-3 text-slate-400" />
              ) : (
                <User2 className="w-3 h-3 text-slate-400" />
              )}
              <span className="font-medium">{event.actor}</span>
            </div>

            <div className="text-xs text-gray-700 mb-2">{event.reason}</div>

            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs text-gray-600">Confidence:</div>
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1 max-w-[120px] bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      event.confidence >= 80
                        ? "bg-green-500"
                        : event.confidence >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${event.confidence}%` }}
                  ></div>
                </div>
                <span className="text-xs font-semibold">{event.confidence}%</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {event.artifacts.length > 0 ? (
                event.artifacts.map((artifact) => (
                  <Button
                    key={artifact.artifactId}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleArtifactClick(artifact)}
                  >
                    <span className="mr-1">
                      <ArtifactIcon type={artifact.artifactType} />
                    </span>
                    {artifact.label}
                  </Button>
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">No artifacts</span>
              )}
            </div>
          </div>
        </div>
      ))}
      {filteredEvents.length > 5 && !isExpanded && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setIsExpanded(true)}
        >
          Show more ({filteredEvents.length - 5} more events)
        </Button>
      )}
    </div>
  );

  const StickyDock = () => (
    <div className="fixed bottom-4 right-4 z-50 w-[420px] shadow-2xl">
      <Card className="p-4 bg-white border-2 border-blue-500">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" /> What happened?
            <Badge variant="secondary" className="text-xs">
              {filteredEvents.length}
            </Badge>
          </h3>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>

        {isExpanded && <div className="max-h-[380px] overflow-y-auto">{renderTimeline()}</div>}
      </Card>
    </div>
  );

  return (
    <>
      <div ref={containerRef}>
        <Card className="p-5">
          <div className="mb-3">
            <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" /> What happened?
            </h2>
            <p className="text-xs text-gray-500">
              Every step the system/analyst took — with evidence.
            </p>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="h-8 text-xs w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Capture">Capture</SelectItem>
                <SelectItem value="Identify">Identify</SelectItem>
                <SelectItem value="Match">Match</SelectItem>
                <SelectItem value="Exception">Exception</SelectItem>
                <SelectItem value="Posting">Posting</SelectItem>
                <SelectItem value="CustomerContact">Customer Contact</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actorFilter} onValueChange={setActorFilter}>
              <SelectTrigger className="h-8 text-xs w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Actors</SelectItem>
                <SelectItem value="System">System</SelectItem>
                <SelectItem value="Analyst">Analyst</SelectItem>
                <SelectItem value="Agent: Matching">Agent: Matching</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderTimeline()}
        </Card>
      </div>

      {isSticky && <StickyDock />}

      <ArtifactViewerModal
        artifact={selectedArtifact}
        open={artifactModalOpen}
        onOpenChange={setArtifactModalOpen}
      />
    </>
  );
}
