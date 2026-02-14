"use client";

import { Upload, Download, Package } from "lucide-react";
import Breadcrumb from "@/components/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { SignalDrawer } from "../components/SignalDrawer";
import { DashboardMetrics } from "../components/DashboardMetrics";
import { useMrp } from "./hooks/useMrp";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { SignalsTable } from "./components/SignalsTable";
import { Pagination } from "./components/Pagination";
import { BulkActionModals } from "./components/BulkActionModals";

export default function WorkbenchPage() {
  const mrp = useMrp();

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/supply-chain-finance/mrp" className="mb-1.5" />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-slate-700" />
            <h1 className="text-2xl font-bold text-[#000000] mt-2">MRP Workbench</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => mrp.handleBulkAction("upload")}>
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
            <Button variant="outline" size="sm" onClick={mrp.handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full overflow-hidden bg-white text-gray-900">
          {/* Sidebar */}
          <aside
            className={`border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-300 ${
              mrp.sidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
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
              onBulkAction={mrp.handleBulkAction}
              metrics={mrp.metrics}
            />

            <div className="flex-1 overflow-auto">
              {mrp.showDashboard && (
                <div className="p-6 pt-4">
                  <DashboardMetrics
                    autoRefresh={mrp.autoRefresh}
                    onToggleRefresh={() => mrp.setAutoRefresh(!mrp.autoRefresh)}
                  />
                </div>
              )}

              <SignalsTable
                rows={mrp.rows}
                isLoading={mrp.isLoading}
                sort={mrp.sort}
                selectedRows={mrp.selectedRows}
                onSort={mrp.handleSort}
                onRowClick={mrp.handleRowClick}
                onToggleRow={mrp.toggleRowSelection}
              />
            </div>

            <Pagination
              page={mrp.page}
              pageSize={mrp.pageSize}
              total={mrp.total}
              totalPages={mrp.totalPages}
              onPageChange={mrp.setPage}
              onPageSizeChange={mrp.setPageSize}
            />
          </main>
        </div>
      </div>

      {/* Signal Detail Drawer */}
      {mrp.drawerSignalId && (
        <SignalDrawer
          signalId={mrp.drawerSignalId}
          onClose={() => mrp.setDrawerSignalId(null)}
          onAction={mrp.invalidateAll}
        />
      )}

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
