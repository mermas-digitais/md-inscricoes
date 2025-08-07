import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface CodeInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  length?: number;
  label?: string;
  error?: string;
  className?: string;
}

export function CodeInput({
  value,
  onChange,
  length = 6,
  label,
  error,
  className,
}: CodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (index: number, inputValue: string) => {
    const newValue = [...value];
    newValue[index] = inputValue.replace(/\D/g, "").slice(0, 1);
    onChange(newValue);

    // Auto-focus próximo input
    if (inputValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace - foca input anterior se atual estiver vazio
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    const newValue = Array(length).fill("");
    for (let i = 0; i < pastedData.length; i++) {
      newValue[i] = pastedData[i];
    }

    onChange(newValue);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 font-['Poppins'] mb-2">
          {label}
        </label>
      )}
      <div className={cn("flex gap-2 px-2 sm:px-4 justify-center", className)}>
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            value={value[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-bold bg-[#F8F8F8] border-2 border-transparent rounded-2xl transition-all duration-200",
              "focus:ring-0 focus:outline-none focus:border-[#FF4A97] focus:bg-white",
              "font-['Poppins'] text-gray-800",
              error && "border-red-500 bg-red-50"
            )}
            maxLength={1}
            inputMode="numeric"
          />
        ))}
      </div>
      {error && (
        <p className="text-red-600 text-sm mt-2 font-['Poppins'] font-medium text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
