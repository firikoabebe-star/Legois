"use client";

import { useUIStore } from "@/store/ui.store";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts, removeToast } = useUIStore();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, type, ...props }) {
        return (
          <Toast
            key={id}
            variant={
              type === "error"
                ? "destructive"
                : type === "success"
                  ? "success"
                  : type === "warning"
                    ? "warning"
                    : "default"
            }
            {...props}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            <ToastClose onClick={() => removeToast(id)} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
