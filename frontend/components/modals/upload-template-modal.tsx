'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';

interface UploadTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UploadTemplateModal({ open, onOpenChange, onSuccess }: UploadTemplateModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    // Simulate file upload
    try {
      // In a real implementation, you would upload the file to your backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Template uploaded successfully', {
        description: `File "${selectedFile.name}" has been uploaded.`,
      });
      
      setSelectedFile(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Upload failed', {
        description: 'There was an error uploading the template. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setIsDragging(false);
      // Ensure body is not locked
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    } else {
      // Lock body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Upload New Template</DialogTitle>
        </DialogHeader>
        
        <div className="mt-6">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInputChange}
          />
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
            className={`
              relative flex flex-col items-center justify-center
              border-2 border-dashed rounded-lg p-12
              cursor-pointer transition-colors
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}
            `}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg border border-gray-300 bg-white">
                <UploadCloud className="w-6 h-6 text-gray-900" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">
                  <span className="font-bold">Click to upload</span> your customized template file or drag and drop.
                </p>
              </div>
            </div>
          </div>
          
          {selectedFile && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
