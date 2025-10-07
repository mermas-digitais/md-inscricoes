"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-5 pr-10 shadow-2xl transition-all duration-500 ease-out data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full backdrop-blur-lg backdrop-saturate-150",
  {
    variants: {
      variant: {
        default:
          "border-blue-200/50 bg-gradient-to-br from-white via-blue-50/40 to-blue-100/30 text-gray-900 shadow-xl ring-1 ring-blue-900/10 hover:shadow-2xl",
        destructive:
          "border-red-200/50 bg-gradient-to-br from-red-50/95 via-red-100/50 to-red-200/30 text-red-900 shadow-xl ring-1 ring-red-900/15 hover:shadow-2xl",
        success:
          "border-emerald-200/50 bg-gradient-to-br from-emerald-50/95 via-emerald-100/50 to-emerald-200/30 text-emerald-900 shadow-xl ring-1 ring-emerald-900/15 hover:shadow-2xl",
        warning:
          "border-amber-200/50 bg-gradient-to-br from-amber-50/95 via-amber-100/50 to-amber-200/30 text-amber-900 shadow-xl ring-1 ring-amber-900/15 hover:shadow-2xl",
        info: "border-blue-300/50 bg-gradient-to-br from-blue-50/95 via-blue-100/60 to-blue-200/40 text-blue-900 shadow-xl ring-1 ring-blue-900/20 hover:shadow-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-blue-200/50 bg-gradient-to-r from-blue-50 to-blue-100 px-4 text-sm font-medium text-blue-700 ring-offset-background transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 hover:text-blue-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-red-200/50 group-[.destructive]:bg-gradient-to-r group-[.destructive]:from-red-50 group-[.destructive]:to-red-100 group-[.destructive]:text-red-700 group-[.destructive]:hover:from-red-100 group-[.destructive]:hover:to-red-200 group-[.destructive]:hover:text-red-800 group-[.destructive]:focus:ring-red-500",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 opacity-70 transition-all duration-200 hover:text-gray-600 hover:opacity-100 hover:bg-white/50 hover:shadow-md focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 group-hover:opacity-100 group-[.destructive]:text-red-400 group-[.destructive]:hover:text-red-600 group-[.destructive]:hover:bg-red-100/80 group-[.destructive]:focus:ring-red-400 group-[.success]:text-emerald-400 group-[.success]:hover:text-emerald-600 group-[.success]:hover:bg-emerald-100/80 group-[.warning]:text-amber-500 group-[.warning]:hover:text-amber-700 group-[.warning]:hover:bg-amber-100/80 group-[.info]:text-blue-400 group-[.info]:hover:text-blue-600 group-[.info]:hover:bg-blue-100/80",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-sm font-semibold leading-tight tracking-tight",
      className
    )}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90 leading-relaxed", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
