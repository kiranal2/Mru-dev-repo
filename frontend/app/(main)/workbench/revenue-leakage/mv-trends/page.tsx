"use client";

import { RevenueLeakageShell } from "@/components/revenue-leakage/revenue-leakage-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMVTrends } from "./hooks/useMVTrends";
import { VIEW_TABS } from "./constants";
import { DashboardView } from "./components/DashboardView";
import { MapView } from "./components/MapView";
import { ComparisonView } from "./components/ComparisonView";
import { AnomaliesView } from "./components/AnomaliesView";
import { FilterSheet } from "./components/FilterSheet";
import { HotspotDrawer } from "./components/HotspotDrawer";

export default function MVTrendsPage() {
  const {
    // View
    activeView,
    setActiveView,
    selectedQuarter,
    setSelectedQuarter,
    quarters,
    dashboard,

    // Data
    hotspots,
    sroTiles,
    officePairs,
    rateCardAnomalies,
    declaredTrends,
    seasonalPatterns,

    // Filters
    searchQuery,
    setSearchQuery,
    severityFilters,
    setSeverityFilters,
    typeFilter,
    setTypeFilter,
    sortBy,
    setSortBy,
    filterOpen,
    setFilterOpen,
    districtFilter,
    setDistrictFilter,
    sroFilter,
    setSroFilter,
    minTxns,
    setMinTxns,
    minLoss,
    setMinLoss,

    // Pagination
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    filteredHotspots,
    paginatedHotspots,

    // Drawer
    drawerOpen,
    setDrawerOpen,
    selectedHotspot,
    openHotspot,

    // Map
    mapView,
    setMapView,
    selectedSro,
    setSelectedSro,
    selectedDistrict,
    setSelectedDistrict,

    // Comparison
    expandedPair,
    setExpandedPair,

    // Derived
    topRules,
    severityDistribution,
    districtDataList,
  } = useMVTrends();

  return (
    <RevenueLeakageShell subtitle="Market value trend monitoring">
      <div className="px-6 py-3 space-y-4">
        {/* View tabs + quarter selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {VIEW_TABS.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  activeView === view.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500">Quarter</span>
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Quarter" />
              </SelectTrigger>
              <SelectContent>
                {quarters.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active view */}
        {activeView === "dashboard" && (
          <DashboardView
            dashboard={dashboard}
            severityDistribution={severityDistribution}
            topRules={topRules}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            severityFilters={severityFilters}
            setSeverityFilters={setSeverityFilters}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            setFilterOpen={setFilterOpen}
            paginatedHotspots={paginatedHotspots}
            filteredHotspots={filteredHotspots}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalPages={totalPages}
            openHotspot={openHotspot}
          />
        )}

        {activeView === "map" && (
          <MapView
            mapView={mapView}
            setMapView={setMapView}
            selectedDistrict={selectedDistrict}
            setSelectedDistrict={setSelectedDistrict}
            selectedSro={selectedSro}
            setSelectedSro={setSelectedSro}
            sroTiles={sroTiles}
            hotspots={hotspots}
            districtDataList={districtDataList}
            openHotspot={openHotspot}
          />
        )}

        {activeView === "comparison" && (
          <ComparisonView
            officePairs={officePairs}
            expandedPair={expandedPair}
            setExpandedPair={setExpandedPair}
          />
        )}

        {activeView === "anomalies" && (
          <AnomaliesView
            rateCardAnomalies={rateCardAnomalies}
            declaredTrends={declaredTrends}
            seasonalPatterns={seasonalPatterns}
          />
        )}
      </div>

      {/* Global drawers/sheets */}
      <FilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        sroFilter={sroFilter}
        setSroFilter={setSroFilter}
        districtFilter={districtFilter}
        setDistrictFilter={setDistrictFilter}
        minTxns={minTxns}
        setMinTxns={setMinTxns}
        minLoss={minLoss}
        setMinLoss={setMinLoss}
        hotspots={hotspots}
      />

      <HotspotDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        detail={selectedHotspot}
      />
    </RevenueLeakageShell>
  );
}
