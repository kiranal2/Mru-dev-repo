'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSaveAndDownload: (name: string, description: string) => void;
}

export function CreateTemplateModal({ open, onClose, onSaveAndDownload }: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSaveAndDownload = () => {
    if (name.trim() && description.trim()) {
      onSaveAndDownload(name, description);
      setName('');
      setDescription('');
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a template</DialogTitle>
          <DialogDescription>
            Templates are reports that can be generated with a single click.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-900">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name of the template"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-900">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="mt-1.5 min-h-[100px] resize-y"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAndDownload}
            disabled={!name.trim() || !description.trim()}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white"
          >
            Save and Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

