import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
}

const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 font-poppins flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]";

    const variants = {
      primary:
        "bg-gradient-to-r from-[#FF4A97] to-[#FFCD34] hover:brightness-105 text-white shadow-md focus:ring-[#FF4A97]",
      secondary:
        "bg-white border-2 border-[#FF4A97] text-[#FF4A97] hover:bg-[#FF4A97] hover:text-white focus:ring-[#FF4A97]",
      ghost:
        "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300",
    };

    const sizes = {
      sm: "rounded-[45px] px-3 sm:px-4 py-2 text-sm",
      md: "rounded-[65px] px-4 sm:px-6 py-3 sm:py-4 text-base",
      lg: "rounded-[65px] px-6 sm:px-8 py-4 sm:py-5 text-lg",
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          "w-full",
          className
        )}
        disabled={disabled || isLoading}
        ref={ref}
        style={
          variant === "primary"
            ? {
                background: "linear-gradient(90deg, #FF4A97 0%, #FFCD34 100%)",
              }
            : undefined
        }
        {...props}
      >
        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
        {isLoading ? loadingText || "Carregando..." : children}
      </button>
    );
  }
);

CustomButton.displayName = "CustomButton";

export { CustomButton };
