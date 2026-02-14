'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EditTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName?: string;
  templateDescription?: string;
  onSave?: (name: string, description: string) => void;
}

export function EditTemplateModal({
  open,
  onOpenChange,
  templateName = '',
  templateDescription = '',
  onSave,
}: EditTemplateModalProps) {
  const [name, setName] = useState(templateName);
  const [description, setDescription] = useState(templateDescription);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName(templateName);
      setDescription(templateDescription);
      // Lock body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Reset to original values when modal closes
      setName(templateName);
      setDescription(templateDescription);
      // Ensure body is not locked
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }
    
    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [open, templateName, templateDescription]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name is required',
        description: 'Please enter a template name.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave?.(name, description);
      
      toast({
        title: 'Template updated successfully',
        description: 'The template has been saved.',
        variant: 'success',
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'There was an error saving the template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Edit Template</DialogTitle>
        </DialogHeader>
        
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name"
              className="w-full"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter template description"
              className="w-full min-h-[100px] resize-y"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
