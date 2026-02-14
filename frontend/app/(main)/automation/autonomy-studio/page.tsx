"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AutonomyCapabilitiesShell } from "@/components/autonomy/capabilities/autonomy-capabilities-shell";
import Breadcrumb from "@/components/layout/breadcrumb";

import type { InputMode } from "./types";
import { useAutonomyStudio } from "./hooks/useAutonomyStudio";
import { PromptStepIndicator } from "./components/PromptStepIndicator";
import { PromptInputStep } from "./components/PromptInputStep";
import { PromptConfigStep } from "./components/PromptConfigStep";
import { PromptFinalStep } from "./components/PromptFinalStep";
import { DocumentUploadTab } from "./components/DocumentUploadTab";
import { DocumentSOPTab } from "./components/DocumentSOPTab";
import { DocumentBreakdownTab } from "./components/DocumentBreakdownTab";
import { DocumentWorkflowTab } from "./components/DocumentWorkflowTab";

export default function AutonomyStudioPage() {
  const {
    inputMode,
    setInputMode,
    promptStep,
    setPromptStep,
    promptText,
    setPromptText,
    automationState,
    setAutomationState,
    handleBuild,
    handleFinalize,
    filteredInvoices,
    calculateNextRun,
    documentTab,
    unlocked,
    progress,
    status,
    parserLog,
    setParserLog,
    dragOver,
    setDragOver,
    currentSOP,
    sopText,
    setSOPText,
    tasks,
    setTasks,
    nodes,
    edges,
    nodeForm,
    setNodeForm,
    fileInputRef,
    handleDrop,
    handleFileSelect,
    handleSimulatedUpload,
    gotoDocumentTab,
    addTask,
    updateTask,
    autoSuggest,
    addNode,
    selectNode,
    applyNodeChanges,
    deleteNode,
    handleConnectFrom,
    handleConnectTo,
    seedDefaultNodes,
  } = useAutonomyStudio();

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="automation/autonomy-studio" className="mb-1.5" />
        <h1 className="text-2xl font-bold text-[#000000] mt-2">Autonomy Studio</h1>
        <p className="text-sm text-[#606060]">
          Create automations using natural language or document upload
        </p>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="w-full p-6">
          <Tabs
            value={inputMode}
            onValueChange={(v) => setInputMode(v as InputMode)}
            className="mb-6"
          >
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="prompt">Prompt Mode</TabsTrigger>
              <TabsTrigger value="document">Document Mode</TabsTrigger>
              <TabsTrigger value="process">Process Autonomy</TabsTrigger>
            </TabsList>

            {/* Prompt Mode */}
            <TabsContent value="prompt" className="space-y-4">
              <PromptStepIndicator promptStep={promptStep} />

              {promptStep === "input" && (
                <PromptInputStep
                  promptText={promptText}
                  setPromptText={setPromptText}
                  onBuild={handleBuild}
                />
              )}

              {promptStep === "config" && (
                <PromptConfigStep
                  automationState={automationState}
                  setAutomationState={setAutomationState}
                  filteredInvoices={filteredInvoices}
                  calculateNextRun={calculateNextRun}
                  onFinalize={handleFinalize}
                  onEditPrompt={() => setPromptStep("input")}
                />
              )}

              {promptStep === "final" && (
                <PromptFinalStep
                  automationState={automationState}
                  onCreateAnother={() => {
                    setPromptStep("input");
                    setPromptText("");
                  }}
                />
              )}
            </TabsContent>

            {/* Document Mode */}
            <TabsContent value="document" className="space-y-4">
              <div className="flex gap-2 mb-4 flex-wrap">
                <Button
                  variant={documentTab === "upload" ? "default" : "outline"}
                  onClick={() => gotoDocumentTab("upload")}
                  className={unlocked ? "" : "opacity-100"}
                >
                  0) Upload
                </Button>
                <Button
                  variant={documentTab === "sop" ? "default" : "outline"}
                  onClick={() => gotoDocumentTab("sop")}
                  disabled={!unlocked}
                >
                  1) SOP
                </Button>
                <Button
                  variant={documentTab === "breakdown" ? "default" : "outline"}
                  onClick={() => gotoDocumentTab("breakdown")}
                  disabled={!unlocked}
                >
                  2) AI Task Breakdown
                </Button>
                <Button
                  variant={documentTab === "workflow" ? "default" : "outline"}
                  onClick={() => gotoDocumentTab("workflow")}
                  disabled={!unlocked}
                >
                  3) Workflow
                </Button>
              </div>

              {documentTab === "upload" && (
                <DocumentUploadTab
                  dragOver={dragOver}
                  setDragOver={setDragOver}
                  onDrop={handleDrop}
                  onFileSelect={handleFileSelect}
                  fileInputRef={fileInputRef}
                  onSimulatedUpload={handleSimulatedUpload}
                  progress={progress}
                  status={status}
                  parserLog={parserLog}
                  onClearLog={() => setParserLog([])}
                />
              )}

              {documentTab === "sop" && (
                <DocumentSOPTab
                  sopText={sopText}
                  setSOPText={setSOPText}
                  currentSOP={currentSOP}
                />
              )}

              {documentTab === "breakdown" && (
                <DocumentBreakdownTab
                  tasks={tasks}
                  onAddTask={addTask}
                  onUpdateTask={updateTask}
                  onRecommendAutomations={() => {
                    setTasks(tasks.map((t) => ({ ...t, automation: autoSuggest(t.title) })));
                    alert("Automations updated based on task names.");
                  }}
                  onContinueToWorkflow={() => gotoDocumentTab("workflow")}
                />
              )}

              {documentTab === "workflow" && (
                <DocumentWorkflowTab
                  nodes={nodes}
                  edges={edges}
                  nodeForm={nodeForm}
                  setNodeForm={setNodeForm}
                  onAddNode={addNode}
                  onSelectNode={selectNode}
                  onApplyNodeChanges={applyNodeChanges}
                  onDeleteNode={deleteNode}
                  onConnectFrom={handleConnectFrom}
                  onConnectTo={handleConnectTo}
                  onResetLayout={seedDefaultNodes}
                />
              )}
            </TabsContent>

            {/* Process Autonomy */}
            <TabsContent value="process" className="space-y-4">
              <AutonomyCapabilitiesShell />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
