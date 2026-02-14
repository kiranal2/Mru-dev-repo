"use client";

import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DocumentUploadTabProps {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onSimulatedUpload: (type: "docx" | "pdf") => void;
  progress: number;
  status: string;
  parserLog: string[];
  onClearLog: () => void;
}

export function DocumentUploadTab({
  dragOver,
  setDragOver,
  onDrop,
  onFileSelect,
  fileInputRef,
  onSimulatedUpload,
  progress,
  status,
  parserLog,
  onClearLog,
}: DocumentUploadTabProps) {
  return (
    <Card className="p-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">UPLOAD AN SOP</h3>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="font-medium text-slate-700">
              Drag and drop your SOP here, or click to select
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Native: .txt .md .csv .json. Adapters: .docx .pdf
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files && onFileSelect(e.target.files[0])}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSimulatedUpload("docx")}
            >
              Simulate DOCX Upload
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSimulatedUpload("pdf")}
            >
              Simulate PDF Upload
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">PROGRESS</h3>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-slate-600">
              Status: <span className="font-medium">{status}</span>
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-700">PARSER LOG</h3>
            <Button variant="ghost" size="sm" onClick={onClearLog}>
              Clear Log
            </Button>
          </div>
          <Card className="p-3 bg-slate-900 text-slate-300 font-mono text-xs h-80 overflow-auto">
            {parserLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            {parserLog.length === 0 && (
              <div className="text-slate-500">No logs yet...</div>
            )}
          </Card>
        </div>
      </div>
    </Card>
  );
}
