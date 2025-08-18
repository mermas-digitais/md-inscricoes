"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle, AlertTriangle, XCircle, Info, Bell } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  const getToastIcon = (variant: string) => {
    switch (variant) {
      case "success":
        return (
          <CheckCircle className="h-5 w-5 text-emerald-600 drop-shadow-sm" />
        );
      case "destructive":
        return <XCircle className="h-5 w-5 text-red-600 drop-shadow-sm" />;
      case "warning":
        return (
          <AlertTriangle className="h-5 w-5 text-amber-600 drop-shadow-sm" />
        );
      case "info":
        return <Info className="h-5 w-5 text-blue-600 drop-shadow-sm" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600 drop-shadow-sm" />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getToastIcon(variant || "default")}
              </div>
              <div className="grid gap-1.5 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
