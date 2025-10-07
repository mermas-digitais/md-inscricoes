"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, User, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeneroOption {
  value: string;
  label: string;
  description: string;
}

interface GeneroSelectorProps {
  value: string;
  onChange: (genero: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  allowedGenders?: string[];
  infoMessage?: string;
}

const generoOptions: GeneroOption[] = [
  {
    value: "feminino",
    label: "Feminino",
    description: "Identidade feminina",
  },
  {
    value: "masculino",
    label: "Masculino",
    description: "Identidade masculina",
  },
  {
    value: "nao-binario",
    label: "Não-binário",
    description: "Identidade não-binária",
  },
  {
    value: "transgenero",
    label: "Transgênero",
    description: "Identidade transgênero",
  },
  {
    value: "outro",
    label: "Outro",
    description: "Outra identidade",
  },
  {
    value: "prefiro_nao_informar",
    label: "Prefiro não informar",
    description: "Não desejo informar",
  },
];

export default function GeneroSelector({
  value,
  onChange,
  placeholder = "Selecione seu gênero",
  error,
  className,
  disabled = false,
  allowedGenders,
  infoMessage,
}: GeneroSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGenero, setSelectedGenero] = useState<GeneroOption | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Encontrar gênero selecionado
  useEffect(() => {
    const genero = generoOptions.find((opt) => opt.value === value);
    setSelectedGenero(genero || null);
  }, [value]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (genero: GeneroOption) => {
    onChange(genero.value);
    setSelectedGenero(genero);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Filtrar opções baseadas no allowedGenders
  const filteredOptions = allowedGenders
    ? generoOptions.filter((option) => allowedGenders.includes(option.value))
    : generoOptions;

  const getGeneroColor = (genero: string) => {
    switch (genero) {
      case "feminino":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "masculino":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "nao-binario":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "transgenero":
        return "bg-green-100 text-green-800 border-green-200";
      case "outro":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "prefiro_nao_informar":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className={cn("w-full", className)} ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-700 font-poppins mb-2">
        Gênero<span className="text-[#FF4A97] ml-1">*</span>
      </label>

      {/* Mensagem informativa */}
      {infoMessage && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                className="w-2.5 h-2.5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-blue-800 font-poppins">{infoMessage}</p>
          </div>
        </div>
      )}

      <div className="relative">
        {selectedGenero ? (
          // Mostrar gênero selecionado
          <div
            className={`flex items-center gap-2 p-3 border border-gray-300 rounded-md bg-white ${
              disabled ? "opacity-50" : ""
            }`}
          >
            <div className="flex-shrink-0">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedGenero.label}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {selectedGenero.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={getGeneroColor(selectedGenero.value)}
              >
                {selectedGenero.label}
              </Badge>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChange("");
                    setSelectedGenero(null);
                  }}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Mostrar input de seleção
          <div
            onClick={handleToggle}
            className={`w-full rounded-[65px] px-4 sm:px-6 py-3 sm:py-4 bg-[#F8F8F8] text-base text-gray-800 border-2 border-transparent transition-all duration-200 focus:ring-0 focus:outline-none focus:border-[#FF4A97] focus:bg-white font-poppins min-h-[48px] flex items-center justify-between ${
              error ? "border-red-500 bg-red-50" : ""
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span className={value ? "text-gray-800" : "text-[#C0C0C0]"}>
              {placeholder}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Dropdown */}
        {isOpen && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border-2 border-gray-200 max-h-60 overflow-hidden">
            <CardContent className="p-0">
              {/* Lista de opções */}
              <div className="max-h-60 overflow-y-auto pb-2">
                {filteredOptions.map((genero) => (
                  <button
                    key={genero.value}
                    type="button"
                    onClick={() => handleSelect(genero)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 last:pb-12 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-500 group-hover:text-[#FF4A97]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {genero.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {genero.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getGeneroColor(genero.value)}
                        >
                          {genero.label}
                        </Badge>
                        <Check className="w-4 h-4 text-transparent group-hover:text-[#FF4A97]" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <p className="text-red-500 text-sm mt-1 font-poppins">{error}</p>
      )}
    </div>
  );
}
