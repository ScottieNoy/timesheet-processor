'use client';

import { Dialog as HeadlessDialog } from '@headlessui/react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
}: DialogProps) {
  return (
    <HeadlessDialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <HeadlessDialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />

        <div className="relative bg-white rounded max-w-md mx-auto p-6">
          <HeadlessDialog.Title className="text-lg font-medium mb-4">
            {title}
          </HeadlessDialog.Title>
          
          {description && (
            <HeadlessDialog.Description className="text-sm text-gray-500 mb-4">
              {description}
            </HeadlessDialog.Description>
          )}

          {children}
        </div>
      </div>
    </HeadlessDialog>
  );
}
