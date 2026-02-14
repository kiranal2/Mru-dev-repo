"use client";

import { useState, useRef } from "react";
import { AgentProcessDesign, AgentProcessTaskId } from "@/lib/autonomy/processTypes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X, FileCheck } from "lucide-react";
import { ProcessWorkflowCanvas } from "./ProcessWorkflowCanvas";
import { ProcessAgentSidebar } from "./ProcessAgentSidebar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProcessDesignPanelProps {
  design: AgentProcessDesign;
  selectedTaskId: AgentProcessTaskId | null;
  onSelectTask: (taskId: AgentProcessTaskId) => void;
}

export function ProcessDesignPanel({
  design,
  selectedTaskId,
  onSelectTask,
}: ProcessDesignPanelProps) {
  const [promptText, setPromptText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (
        file.type === "application/pdf" ||
        file.type.includes("word") ||
        file.type === "text/plain"
      ) {
        setUploadedFile(file);
        toast.success(`Document "${file.name}" uploaded successfully`);
      } else {
        toast.error("Please upload a PDF, Word document, or text file");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadedFile(file);
      toast.success(`Document "${file.name}" uploaded successfully`);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePromptSubmit = () => {
    if (promptText.trim()) {
      toast.success("Processing prompt to generate workflow...");
      setPromptText("");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-[#6C5CE7]" />
            <h3 className="text-base font-semibold text-slate-900">Process Source</h3>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-sm font-medium text-slate-700">{design.name}</div>
              <Badge variant="outline" className="mt-1 text-xs">
                {design.sourceType}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 line-clamp-3">{design.sourceSummary}</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-4 h-4 text-slate-400" />
            <h3 className="text-base font-semibold text-slate-900">Upload / Prompt</h3>
          </div>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploadedFile ? (
              <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <FileCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-green-900 truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-green-700">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveFile}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                  dragOver
                    ? "border-[#6C5CE7] bg-[#6C5CE7] bg-opacity-10"
                    : "border-slate-300 bg-slate-50 hover:border-slate-400"
                )}
              >
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Drop SOP document here or click to browse</p>
                <p className="text-xs text-slate-400 mt-1">PDF, Word, or Text files</p>
              </div>
            )}

            <div className="text-xs text-slate-500 text-center">or</div>

            <div className="space-y-2">
              <Textarea
                placeholder="Describe the process you want to automate..."
                rows={2}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="text-xs resize-none"
              />
              <Button
                size="sm"
                onClick={handlePromptSubmit}
                disabled={!promptText.trim()}
                className="w-full bg-[#6C5CE7] hover:bg-[#5f4fd1] text-white text-xs h-8"
              >
                Generate from Prompt
              </Button>
            </div>

            <p className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded p-2">
              Currently viewing sample SOP FIN-AP-SOP-002. Upload a document or enter a prompt to
              create a new workflow.
            </p>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <ProcessWorkflowCanvas
          design={design}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
        />

        <ProcessAgentSidebar design={design} onSelectTask={onSelectTask} />
      </div>
    </div>
  );
}
