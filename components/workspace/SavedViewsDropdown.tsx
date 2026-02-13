"use client";

import { useState } from "react";
import { Save, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SavedView {
  id: string;
  name: string;
  filters: any;
}

interface SavedViewsDropdownProps {
  workbenchType: 'close' | 'reconciliation';
  currentFilters: any;
  onApplyView: (filters: any) => void;
}

export function SavedViewsDropdown({ workbenchType, currentFilters, onApplyView }: SavedViewsDropdownProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [savedViews, setSavedViews] = useState<SavedView[]>([
    { id: '1', name: 'My Open Items', filters: { status: 'OPEN', assignee: 'me' } },
    { id: '2', name: 'High Priority', filters: { priority: 'HIGH' } },
    { id: '3', name: 'Late Tasks', filters: { late: true } }
  ]);

  const handleSaveView = () => {
    const newView = {
      id: Date.now().toString(),
      name: viewName,
      filters: currentFilters
    };
    setSavedViews([...savedViews, newView]);
    setSaveDialogOpen(false);
    setViewName('');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="w-4 h-4 mr-2" />
            Saved Views
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {savedViews.map((view) => (
            <DropdownMenuItem
              key={view.id}
              onClick={() => onApplyView(view.filters)}
            >
              {view.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
            <Save className="w-4 h-4 mr-2" />
            Save Current View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Save View</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="viewName">View Name</Label>
              <Input
                id="viewName"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="e.g., My Open Items"
              />
            </div>
            <div className="text-xs text-slate-500">
              This will save your current filters and sorting preferences.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveView} disabled={!viewName}>
              Save View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
