'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TemplateCreatedModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
}

export function TemplateCreatedModal({ open, onClose, fileName }: TemplateCreatedModalProps) {
  const router = useRouter();

  const handleGoToDataTemplates = () => {
    router.push('/home/workspace/data-template');
    onClose();
  };

  const handleStayOnCommandCenter = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleStayOnCommandCenter}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Draft template created.</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-700">
            Your data template <strong>{fileName}</strong> has been downloaded and is ready to be customized. Once you have finished editing your template, you will need to upload it to save and run it.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleStayOnCommandCenter}
            className="px-4 py-2 border-gray-300 text-gray-900"
          >
            Stay on Command Center
          </Button>
          <Button
            onClick={handleGoToDataTemplates}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white"
          >
            Go to Data Templates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

