'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Home, Pin, Eye, ArrowRight, RefreshCw, CheckSquare, Search, Bell, Paperclip, Send } from 'lucide-react';
import Breadcrumb from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReconciliationsSection } from '@/components/workspace/reconciliations-section';
import { WorklistManagementSection } from '@/components/workspace/worklist-management-section';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CreateTemplateModal } from '@/components/modals/create-template-modal';
import { TemplateCreatedModal } from '@/components/modals/template-created-modal';
import { DataBindingsWidget } from '@/components/workspace/data-bindings-widget';
import { usePins, useWatchlist, useActivityFeed } from '@/hooks/data';

function MyWorkspacePageContent() {
  const { data: pins, loading: pinsLoading, error: pinsError } = usePins();
  const { data: watchlistItems, loading: watchlistLoading, error: watchlistError } = useWatchlist();
  const { data: activityFeed, loading: activityLoading, error: activityError } = useActivityFeed();

  const [refreshing, setRefreshing] = useState(false);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [isTemplateCreatedModalOpen, setIsTemplateCreatedModalOpen] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState('');

  const loading = pinsLoading || watchlistLoading || activityLoading;

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleRefreshCounters = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleOpenCreateTemplateModal = () => {
    setIsCreateTemplateModalOpen(true);
  };

  const handleCloseCreateTemplateModal = () => {
    setIsCreateTemplateModalOpen(false);
  };

  const handleSaveAndDownload = (name: string, description: string) => {
    // Generate dummy table data
    const dummyData = [
      ['Account', 'Balance', 'Status', 'Date'],
      ['AR-001', '$125,000.00', 'Open', '2024-01-15'],
      ['AR-002', '$85,500.00', 'Open', '2024-01-16'],
      ['AR-003', '$234,200.00', 'Closed', '2024-01-17'],
      ['AR-004', '$67,800.00', 'Open', '2024-01-18'],
      ['AR-005', '$156,900.00', 'Open', '2024-01-19'],
    ];

    // Convert to CSV format
    const csvContent = dummyData.map(row => row.join(',')).join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generate filename based on template name
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedName}_recon.xlsx`;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Set downloaded filename and show success modal
    setDownloadedFileName(fileName);
    setIsCreateTemplateModalOpen(false);
    setIsTemplateCreatedModalOpen(true);
  };

  const handleCloseTemplateCreatedModal = () => {
    setIsTemplateCreatedModalOpen(false);
    setDownloadedFileName('');
  };

  // Derive counters from activity feed data
  const counters = {
    approvalsDue: activityFeed.filter(e => e.type === 'user_action').length || 7,
    reviewsDue: activityFeed.filter(e => e.type === 'case_updated' || e.type === 'task_completed').length || 12,
    followUps: activityFeed.filter(e => e.type === 'rule_triggered').length || 3,
    asOf: activityFeed.length > 0 ? activityFeed[0].timestamp : new Date().toISOString(),
  };

  // Derive team feed from activity events
  const teamFeed = activityFeed.map(event => ({
    id: event.id,
    author: event.actor,
    avatar: '',
    text: event.description || event.title,
    timestamp: event.timestamp,
    attachments: [] as string[],
    mentions: [] as string[],
  }));

  return (
    <div className="flex flex-col bg-white" style={{ height: '100%', minHeight: 0 }}>
      {/* Header with Breadcrumb and Title */}
      <header className="sticky top-0 z-10 bg-white  px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="home/workspace/my-workspace" className="mb-1.5" />
        <h1 className="text-2xl font-bold text-[#000000] mt-2 mb-1">My Workspace</h1>
        <p className="text-sm text-[#606060]">Your personalized dashboard and activity overview</p>
      <div className="border-b border-[#B7B7B7] mt-4"></div></header>

      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-[1363px] mx-auto p-6">

      <div className="space-y-6">
         {/* Top Band - Counters */}
         <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[#606060]">Quick Stats</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshCounters}
                disabled={refreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Approvals Due */}
              <Link
                href="/worklist?filter=approvals_due"
                className="flex items-start gap-4 p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-white">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-3xl font-semibold text-slate-900">
                    {counters?.approvalsDue || 0}
                  </div>
                  <div className="text-sm text-[#606060] mt-1">Approvals Due</div>
                  {counters?.asOf && (
                    <div className="text-xs text-slate-500 mt-1">
                      as of {new Date(counters.asOf).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>

              {/* Reviews Due */}
              <Link
                href="/worklist?filter=reviews_due"
                className="flex items-start gap-4 p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-green-50">
                  <Search className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-3xl font-semibold text-slate-900">
                    {counters?.reviewsDue || 0}
                  </div>
                  <div className="text-sm text-[#606060] mt-1">Reviews Due</div>
                  {counters?.asOf && (
                    <div className="text-xs text-slate-500 mt-1">
                      as of {new Date(counters.asOf).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>

              {/* Follow-ups */}
              <Link
                href="/worklist?filter=followups"
                className="flex items-start gap-4 p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-amber-50">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-3xl font-semibold text-slate-900">
                    {counters?.followUps || 0}
                  </div>
                  <div className="text-sm text-[#606060] mt-1">Follow-ups</div>
                  {counters?.asOf && (
                    <div className="text-xs text-slate-500 mt-1">
                      as of {new Date(counters.asOf).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

    
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Pin className="h-5 w-5 text-slate-700" />
              Live Tracking
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Pin className="h-4 w-4" />
                    Live Pins
                  </span>
                  <Link
                    href="/home/workspace/live-pins"
                    className="text-sm font-normal text-[#6B7EF3] hover:text-[#5A6FE3] flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pinsLoading ? (
                  <div className="text-sm text-slate-500">Loading...</div>
                ) : pinsError ? (
                  <div className="text-sm text-red-500">Error: {pinsError}</div>
                ) : pins.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No live pins yet. Add pins from your results to track key metrics.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pins.map((pin) => (
                      <div
                        key={pin.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm text-slate-900">{pin.label}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {pin.module} • Last refreshed {new Date(pin.lastRefreshed).toLocaleDateString()}
                          </div>
                        </div>
                        <RefreshCw className="h-4 w-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Watchlist
                  </span>
                  <Link
                    href="/home/workspace/watchlist"
                    className="text-sm font-normal text-[#6B7EF3] hover:text-[#5A6FE3] flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {watchlistLoading ? (
                  <div className="text-sm text-slate-500">Loading...</div>
                ) : watchlistError ? (
                  <div className="text-sm text-red-500">Error: {watchlistError}</div>
                ) : watchlistItems.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No watchlist items yet. Set up thresholds to monitor key metrics.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {watchlistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm text-slate-900">{item.label}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {item.entityType} • Status: {item.status}
                          </div>
                        </div>
                        <Eye className="h-4 w-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

            {/* Team Feed */}
            <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Composer */}
            <div className="space-y-2">
              <Textarea
                placeholder="Share an update... (@mention team members)"
                className="min-h-[80px]"
                rows={4}  
              />
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attach
                </Button>
                <Button
                  size="sm"
                 
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Post
                </Button>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-3 pt-2">
              {teamFeed.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4">
                  No posts yet. Be the first to share an update!
                </div>
              ) : (
                teamFeed.map((post) => (
                  <div key={post.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-slate-900">
                            {post.author}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatTimeAgo(post.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700">{post.text}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link
              href="/workspace/feed"
              className="text-sm text-[#6B7EF3] hover:text-[#5A6FE3] flex items-center gap-1 pt-2"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReconciliationsSection />
          <WorklistManagementSection />
        </div> */}
          <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Close Acceleration Dashboard
          </h2>

          <div className="space-y-6">
            <DataBindingsWidget />
            <ReconciliationsSection />
            <WorklistManagementSection />
          </div>
        </section>
        

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="pt-6">
              {activityLoading ? (
                <div className="text-sm text-slate-500 text-center py-8">Loading...</div>
              ) : activityError ? (
                <div className="text-sm text-red-500 text-center py-8">Error: {activityError}</div>
              ) : activityFeed.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-8">
                  No recent activity to display
                </div>
              ) : (
                <div className="space-y-3">
                  {activityFeed.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-slate-900">{event.title}</div>
                        <div className="text-xs text-slate-500 mt-1">{event.description}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {event.actor} • {formatTimeAgo(event.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium text-slate-900">Run Query</div>
                  <div className="text-sm text-slate-500 mt-1">Execute a new data query</div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={handleOpenCreateTemplateModal}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium text-slate-900">Create Template</div>
                  <div className="text-sm text-slate-500 mt-1">Build a new data template</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-medium text-slate-900">View Reports</div>
                  <div className="text-sm text-slate-500 mt-1">Access financial reports</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        </div>
      </div>
      
      <CreateTemplateModal
        open={isCreateTemplateModalOpen}
        onClose={handleCloseCreateTemplateModal}
        onSaveAndDownload={handleSaveAndDownload}
      />

      <TemplateCreatedModal
        open={isTemplateCreatedModalOpen}
        onClose={handleCloseTemplateCreatedModal}
        fileName={downloadedFileName}
      />
    </div>
    </div>
  );
}

export default function Page() {
  return <MyWorkspacePageContent />;
}
