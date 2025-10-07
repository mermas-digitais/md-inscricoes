import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CustomInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isRequired?: boolean;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ className, label, error, isRequired, type, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-semibold text-gray-700 font-poppins mb-2"
          >
            {label}
            {isRequired && <span className="text-[#FF4A97] ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "w-full rounded-[65px] px-4 sm:px-6 py-3 sm:py-4 bg-[#F8F8F8] text-base text-gray-800 border-2 border-transparent transition-all duration-200",
            "focus:ring-0 focus:outline-none focus:border-[#FF4A97] focus:bg-white",
            "placeholder:text-[#C0C0C0] font-poppins",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "text-base min-h-[48px]", // Altura mínima para mobile
            error && "border-red-500 bg-red-50",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-red-500 text-sm mt-1 font-poppins">{error}</p>
        )}
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";

export { CustomInput };
