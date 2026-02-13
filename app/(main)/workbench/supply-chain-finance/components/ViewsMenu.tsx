"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ViewsService } from "../services/ViewsService";

type Props = {
  onApply: (params: Record<string, any>) => void;
  onSave: (name: string) => void;
};

export function ViewsMenu({ onApply, onSave }: Props) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState("");

  const { data: views } = useQuery({
    queryKey: ["saved-views"],
    queryFn: () => ViewsService.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (viewId: string) => ViewsService.delete(viewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-views"] });
    },
  });

  const handleSave = () => {
    if (!viewName.trim()) {
      alert("Please enter a view name");
      return;
    }
    onSave(viewName);
    setViewName("");
    setShowSaveDialog(false);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Views <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem
            onClick={() => {
              setShowSaveDialog(true);
              setIsOpen(false);
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Current View
          </DropdownMenuItem>

          {views && views.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {views.map((view) => (
                <DropdownMenuItem
                  key={view.view_id}
                  className="flex items-center justify-between group"
                  onSelect={() => {
                    onApply(view.params);
                    setIsOpen(false);
                  }}
                >
                  <span className="flex-1">{view.name}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete view "${view.name}"?`)) {
                        deleteMutation.mutate(view.view_id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
            <DialogDescription>
              Enter a name for this view to save your current filters and settings.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="text"
            placeholder="View name"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setShowSaveDialog(false);
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
