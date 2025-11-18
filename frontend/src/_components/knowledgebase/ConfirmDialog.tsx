"use client";
import { useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  deleting: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  deleting,
}: ConfirmDialogProps) {
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1E1E1E] border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-xl">
          <Dialog.Title className="text-white text-lg font-semibold">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-gray-400 mt-2">
            {description}
          </Dialog.Description>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white"
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-70"
            >
              {deleting ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Deleting Knowledge Base
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
