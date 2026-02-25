"use client";

import CommandCenter from "@/components/pages/command-center";
import LivePinModal from "@/components/ui/live-pin-modal";
import { CreateWatchModal } from "@/components/ui/create-watch-modal";
import { CreateTemplateModal } from "@/components/modals/create-template-modal";
import { TemplateCreatedModal } from "@/components/modals/template-created-modal";
import PageForbidden from "@/app/ErrorPages/PageForbidden";

import { CommandCenterContainerProps } from "./types";
import { useCommandCenter } from "./hooks/useCommandCenter";

export default function CommandCenterContainer({ initialSessionId }: CommandCenterContainerProps) {
  const {
    // UI state
    loadingState,
    composerValue,
    activeChips,
    openDropdownId,
    showPlaceholder,
    showFinancialResults,
    messages,
    errors,
    isLoading,
    isConnected,
    currentStreamingEvents,
    currentStreamingMessage,
    messagesEndRef,

    // Session state
    chatSessions,
    activeSessionId,
    isLoadingSessions,
    sessionsLoadFailed,
    sessionRestoreStatus,

    // Modal state
    isLivePinModalOpen,
    isCreateWatchModalOpen,
    isCreateTemplateModalOpen,
    isTemplateCreatedModalOpen,
    downloadedFileName,

    // Handlers - composer
    handleTextareaChange,
    handleTextareaFocus,
    handleTextareaBlur,
    handleSendClick,

    // Handlers - chips & suggestions
    handleChipClick,
    handleRemoveChip,
    handlePromptSuggestionClick,

    // Handlers - sessions
    handleNewChat,
    handleSessionClick,
    handleCancelQuery,
    loadSessions,

    // Handlers - modals
    handleOpenLivePinModal,
    handleCloseLivePinModal,
    handleAddToLivePins,
    handleOpenCreateWatchModal,
    handleCloseCreateWatchModal,
    handleCreateWatch,
    handleOpenCreateTemplateModal,
    handleCloseCreateTemplateModal,
    handleSaveAndDownload,
    handleCloseTemplateCreatedModal,

    // Setters
    setOpenDropdownId,
    setShowFinancialResults,
  } = useCommandCenter({ initialSessionId });

  // Show 403 if session from URL doesn't belong to this user
  if (sessionRestoreStatus === "denied") {
    return <PageForbidden />;
  }

  // Show loading state while restoring session from URL
  if (initialSessionId && sessionRestoreStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          <p className="text-sm text-gray-500">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CommandCenter
        loadingState={loadingState}
        composerValue={composerValue}
        isLoading={isLoading}
        isConnected={isConnected}
        activeChips={activeChips}
        openDropdownId={openDropdownId}
        showPlaceholder={showPlaceholder}
        showFinancialResults={showFinancialResults}
        messages={messages}
        errors={errors}
        streamingEvents={currentStreamingEvents}
        currentStreamingMessage={currentStreamingMessage}
        onComposerChange={handleTextareaChange}
        onComposerFocus={handleTextareaFocus}
        onComposerBlur={handleTextareaBlur}
        onSendClick={handleSendClick}
        onChipClick={handleChipClick}
        onRemoveChip={handleRemoveChip}
        onPromptSuggestionClick={handlePromptSuggestionClick}
        onDropdownToggle={setOpenDropdownId}
        onTestUI={() => setShowFinancialResults(true)}
        onOpenLivePinModal={handleOpenLivePinModal}
        onOpenCreateWatchModal={handleOpenCreateWatchModal}
        onOpenCreateTemplateModal={handleOpenCreateTemplateModal}
        messagesEndRef={messagesEndRef}
        // Session management props
        onNewChat={handleNewChat}
        onCancelQuery={handleCancelQuery}
        chatSessions={chatSessions}
        activeSessionId={activeSessionId}
        onSessionClick={handleSessionClick}
        isLoadingSessions={isLoadingSessions}
        sessionsLoadFailed={sessionsLoadFailed}
        onRetrySessions={loadSessions}
      />

      <LivePinModal
        open={isLivePinModalOpen}
        onClose={handleCloseLivePinModal}
        onAddToLivePins={handleAddToLivePins}
      />

      <CreateWatchModal
        open={isCreateWatchModalOpen}
        onClose={handleCloseCreateWatchModal}
        onSuccess={handleCreateWatch}
        entityId="amazon-001"
        entityName="Amazon"
        params={{ status: "Open", prompt: composerValue }}
        invoiceData={[]}
      />

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
    </>
  );
}
