"use client";

import { WhatHappenedTimeline } from "@/components/cash-app/what-happened-timeline";
import { CreateJEModal } from "@/components/cash-app/create-je-modal";
import { JEBuildModal } from "@/components/cash-app/je-build-modal";

import { usePaymentDetail } from "./hooks/usePaymentDetail";
import { PaymentNotFound } from "./components/PaymentNotFound";
import { PaymentHeader } from "./components/PaymentHeader";
import { PaymentDetailsCard } from "./components/PaymentDetailsCard";
import { PaymentDataTabs } from "./components/PaymentDataTabs";
import { ActionSidebar } from "./components/ActionSidebar";
import { ActionModal } from "./components/ActionModal";
import { EmailComposerModal } from "./components/EmailComposerModal";

export default function PaymentDetailPage() {
  const {
    // Core state
    router,
    user,
    payment,
    timelineRefreshKey,

    // Modal state
    showActionModal,
    setShowActionModal,
    currentAction,
    selectedJeTypeCode,
    setSelectedJeTypeCode,
    assignTo,
    setAssignTo,
    showCreateJEModal,
    setShowCreateJEModal,
    showJEBuildModal,
    setShowJEBuildModal,

    // Email composer state
    showEmailComposer,
    setShowEmailComposer,
    selectedTemplateId,
    emailSubject,
    setEmailSubject,
    emailBody,
    setEmailBody,
    toRecipients,
    setToRecipients,
    ccRecipients,
    setCcRecipients,
    toInput,
    setToInput,
    ccInput,
    setCcInput,
    saveRecipients,
    setSaveRecipients,
    includeInternalCc,
    setIncludeInternalCc,
    includePaymentSummaryLink,
    setIncludePaymentSummaryLink,
    includeRemittanceUploadLink,
    setIncludeRemittanceUploadLink,
    attachmentOptions,
    setAttachmentOptions,
    attachmentSelections,
    setAttachmentSelections,

    // Computed
    resolvedJeTypeLabel,
    postingGate,
    approvePostDisabled,
    approvePostReason,

    // Actions
    handleAction,
    executeAction,
    handleJESubmit,
    handleJEApprove,
    handleJEReject,
    handleOpenJEBuild,
    handleChangeJeType,
    handleSaveJEDraft,
    handleSubmitJE,

    // Email actions
    openEmailComposer,
    handleTemplateChange,
    handleSendEmail,
    addRecipient,
    removeRecipient,
    resolveTemplateBody,
    getContactForCustomer,
    getTemplateById,

    // Formatters
    formatCurrency,
  } = usePaymentDetail();

  if (!payment) {
    return <PaymentNotFound onGoBack={() => router.back()} />;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex-1 overflow-auto">
        <div className="px-6 pt-4 pb-6">
          <PaymentHeader
            payment={payment}
            resolvedJeTypeLabel={resolvedJeTypeLabel}
            onGoBack={() => router.back()}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left column: details, data tabs, timeline */}
            <div className="lg:col-span-2 space-y-4">
              <PaymentDetailsCard
                payment={payment}
                resolvedJeTypeLabel={resolvedJeTypeLabel}
                formatCurrency={formatCurrency}
              />

              <PaymentDataTabs
                payment={payment}
                formatCurrency={formatCurrency}
              />

              <WhatHappenedTimeline
                paymentId={payment.id}
                key={timelineRefreshKey}
                onRefresh={() => {}}
              />
            </div>

            {/* Right column: AI recommendation, actions, evidence */}
            <ActionSidebar
              payment={payment}
              resolvedJeTypeLabel={resolvedJeTypeLabel}
              postingGate={postingGate}
              approvePostDisabled={approvePostDisabled}
              approvePostReason={approvePostReason}
              isAdmin={user?.role === "ADMIN"}
              onAction={handleAction}
              onApprovePost={() => handleAction("approve-post")}
              onApprove={() => handleAction("approve")}
              onInvestigate={() =>
                router.push(
                  `/workbench/order-to-cash/cash-application/matching-studio?paymentId=${payment.id}`
                )
              }
              onOpenEmailComposer={openEmailComposer}
              onOpenJEBuild={handleOpenJEBuild}
              onShowCreateJE={() => setShowCreateJEModal(true)}
              onJEApprove={handleJEApprove}
              onJEReject={handleJEReject}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ActionModal
        open={showActionModal}
        onOpenChange={setShowActionModal}
        currentAction={currentAction}
        selectedJeTypeCode={selectedJeTypeCode}
        onJeTypeCodeChange={setSelectedJeTypeCode}
        assignTo={assignTo}
        onAssignToChange={setAssignTo}
        onConfirm={() => executeAction()}
      />

      <CreateJEModal
        open={showCreateJEModal}
        onOpenChange={setShowCreateJEModal}
        payment={payment}
        onSubmit={handleJESubmit}
      />

      {resolvedJeTypeLabel && (
        <JEBuildModal
          open={showJEBuildModal}
          onOpenChange={setShowJEBuildModal}
          payment={payment}
          jeTypeCode={payment.je_type_code || payment.je_type || "UNAPPLIED"}
          jeTypeLabel={resolvedJeTypeLabel}
          onChangeType={handleChangeJeType}
          onSaveDraft={handleSaveJEDraft}
          onSubmit={handleSubmitJE}
        />
      )}

      <EmailComposerModal
        open={showEmailComposer}
        onOpenChange={setShowEmailComposer}
        payment={payment}
        selectedTemplateId={selectedTemplateId}
        emailSubject={emailSubject}
        onEmailSubjectChange={setEmailSubject}
        emailBody={emailBody}
        onEmailBodyChange={setEmailBody}
        toRecipients={toRecipients}
        setToRecipients={setToRecipients}
        ccRecipients={ccRecipients}
        setCcRecipients={setCcRecipients}
        toInput={toInput}
        setToInput={setToInput}
        ccInput={ccInput}
        setCcInput={setCcInput}
        saveRecipients={saveRecipients}
        setSaveRecipients={setSaveRecipients}
        includeInternalCc={includeInternalCc}
        setIncludeInternalCc={setIncludeInternalCc}
        includePaymentSummaryLink={includePaymentSummaryLink}
        setIncludePaymentSummaryLink={setIncludePaymentSummaryLink}
        includeRemittanceUploadLink={includeRemittanceUploadLink}
        setIncludeRemittanceUploadLink={setIncludeRemittanceUploadLink}
        attachmentOptions={attachmentOptions}
        setAttachmentOptions={setAttachmentOptions}
        attachmentSelections={attachmentSelections}
        setAttachmentSelections={setAttachmentSelections}
        hasContactForCustomer={!!getContactForCustomer(payment.customerId)}
        onTemplateChange={handleTemplateChange}
        onSendEmail={handleSendEmail}
        addRecipient={addRecipient}
        removeRecipient={removeRecipient}
        resolvedBody={resolveTemplateBody()}
        getTemplateName={(id) => getTemplateById(id).name}
      />
    </div>
  );
}
