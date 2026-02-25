"use client";

import { Upload, Download, Package, LayoutDashboard } from "lucide-react";
import Breadcrumb from "@/components/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardMetrics } from "../components/DashboardMetrics";
import { useMrp } from "./hooks/useMrp";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { SignalsTable } from "./components/SignalsTable";
import { Pagination } from "./components/Pagination";
import { BulkActionModals } from "./components/BulkActionModals";
import { SignalDetailSheet } from "./components/SignalDetailSheet";

export default function WorkbenchPage() {
  const mrp = useMrp();

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 flex-shrink-0 border-b border-slate-200 bg-white px-6 py-2">
        <Breadcrumb activeRoute="workbench/supply-chain-finance/mrp" className="mb-1.5" />
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-800 p-1.5">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">MRP Workbench</h1>
              <p className="text-xs text-slate-500">Supply chain exception management & PO tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={mrp.showDashboard ? "default" : "outline"}
              size="sm"
              className={`h-8 text-xs ${mrp.showDashboard ? "bg-slate-800 hover:bg-slate-700" : "border-slate-300 bg-white"}`}
              onClick={() => mrp.setShowDashboard(!mrp.showDashboard)}
            >
              <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
              Dashboard
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs border-slate-300 bg-white" onClick={() => mrp.handleBulkAction("upload")}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload CSV
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs border-slate-300 bg-white" onClick={mrp.handleExport}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full overflow-hidden bg-white text-gray-900">
          {/* Sidebar */}
          <aside
            className={`border-r border-slate-200 bg-slate-50/80 flex flex-col transition-all duration-300 ${
              mrp.sidebarCollapsed ? "w-0 overflow-hidden" : "w-72"
            }`}
          >
            <Sidebar
              searchQuery={mrp.searchQuery}
              onSearchChange={mrp.setSearchQuery}
              selectedSuppliers={mrp.selectedSuppliers}
              onSupplierChange={mrp.setSelectedSuppliers}
              suppliers={mrp.suppliers}
              selectedSeverities={mrp.selectedSeverities}
              onSeverityToggle={(severity) =>
                mrp.setSelectedSeverities((prev: ("HIGH" | "MEDIUM" | "LOW")[]) =>
                  prev.includes(severity)
                    ? prev.filter((s: string) => s !== severity)
                    : [...prev, severity]
                )
              }
              severityCounts={mrp.severityCounts}
              quickView={mrp.quickView}
              expandedGroups={mrp.expandedGroups}
              groupedCounts={mrp.groupedCounts}
              onToggleGroup={mrp.toggleGroup}
              onQuickViewClick={mrp.handleQuickViewClick}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <Toolbar
              sidebarCollapsed={mrp.sidebarCollapsed}
              onToggleSidebar={() => mrp.setSidebarCollapsed(!mrp.sidebarCollapsed)}
              showDashboard={mrp.showDashboard}
              onToggleDashboard={() => mrp.setShowDashboard(!mrp.showDashboard)}
              onNewPO={() => mrp.handleBulkAction("new_po")}
              onApplyView={mrp.handleApplyView}
              onSaveView={mrp.handleSaveView}
              selectedRows={mrp.selectedRows}
              rowCount={mrp.rows.length}
              onSelectAll={mrp.handleSelectAll}
              onClearSelection={mrp.clearSelection}
              onBulkAction={mrp.handleBulkAction}
              metrics={mrp.metrics}
              searchQuery={mrp.searchQuery}
              onSearchChange={mrp.setSearchQuery}
            />

            <div className="flex-1 overflow-auto p-4 md:p-5 space-y-4">
              {mrp.showDashboard && (
                <DashboardMetrics
                  autoRefresh={mrp.autoRefresh}
                  onToggleRefresh={() => mrp.setAutoRefresh(!mrp.autoRefresh)}
                />
              )}

              <Card>
                <CardContent className="p-0 overflow-hidden">
                  <SignalsTable
                    rows={mrp.rows}
                    isLoading={mrp.isLoading}
                    sort={mrp.sort}
                    selectedRows={mrp.selectedRows}
                    onSort={mrp.handleSort}
                    onRowClick={mrp.handleRowClick}
                    onToggleRow={mrp.toggleRowSelection}
                    onSelectAll={mrp.handleSelectAll}
                  />

                  <Pagination
                    page={mrp.page}
                    pageSize={mrp.pageSize}
                    total={mrp.total}
                    totalPages={mrp.totalPages}
                    onPageChange={mrp.setPage}
                    onPageSizeChange={mrp.setPageSize}
                  />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Signal Detail Sheet — works with local data */}
      <SignalDetailSheet
        signal={mrp.activeSignal}
        open={!!mrp.activeSignal}
        onClose={() => mrp.setDrawerSignalId(null)}
      />

      {/* Bulk Action Modals */}
      <BulkActionModals
        bulkActionModal={mrp.bulkActionModal}
        selectedRowCount={mrp.selectedRows.size}
        onConfirmBulkAction={mrp.confirmBulkAction}
        bulkActionPending={mrp.bulkActionMutation.isPending}
        counterDate={mrp.counterDate}
        onCounterDateChange={mrp.setCounterDate}
        trackingMessage={mrp.trackingMessage}
        onTrackingMessageChange={mrp.setTrackingMessage}
        escalateMessage={mrp.escalateMessage}
        onEscalateMessageChange={mrp.setEscalateMessage}
        uploadFile={mrp.uploadFile}
        uploadResult={mrp.uploadResult}
        uploadPending={mrp.uploadMutation.isPending}
        fileInputRef={mrp.fileInputRef}
        onFileSelect={mrp.handleFileSelect}
        onConfirmUpload={mrp.confirmUpload}
        newPOForm={mrp.newPOForm}
        onNewPOFormChange={mrp.setNewPOForm}
        suppliers={mrp.suppliers}
        createPOPending={mrp.createPOMutation.isPending}
        onCreatePO={() => mrp.createPOMutation.mutate(mrp.newPOForm)}
        onClose={() => mrp.setBulkActionModal(null)}
        onCloseUpload={() => {
          mrp.setBulkActionModal(null);
          mrp.setUploadFile(null);
          mrp.setUploadResult(null);
        }}
        onCloseCounter={() => {
          mrp.setBulkActionModal(null);
          mrp.setCounterDate("");
        }}
      />
    </div>
  );
}
