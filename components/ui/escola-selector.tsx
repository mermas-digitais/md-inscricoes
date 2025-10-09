"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, School, MapPin, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Escola {
  id: number;
  nome: string;
  rede: string;
  publica: boolean;
  uf: string;
  municipio: string;
}

interface EscolaSelectorProps {
  value: string;
  onChange: (escola: string) => void;
  escolaridade?: string; // Nova prop para filtrar por escolaridade
  placeholder?: string;
  className?: string;
  error?: string;
}

export default function EscolaSelector({
  value,
  onChange,
  escolaridade,
  placeholder = "Digite o nome da sua escola...",
  className,
  error,
}: EscolaSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Função para determinar a rede de escola baseado na escolaridade
  const getRedeEscolaFiltro = (escolaridade: string): string | null => {
    if (escolaridade === "Ensino Fundamental 2") {
      return "municipal";
    } else if (escolaridade === "Ensino Médio") {
      return "estadual";
    }
    return null; // Sem filtro se não especificado
  };

  // Buscar escolas iniciais baseadas na escolaridade (sem termo de busca)
  useEffect(() => {
    const loadInitialEscolas = async () => {
      if (!escolaridade) return;

      setIsLoading(true);
      try {
        const redeFiltro = getRedeEscolaFiltro(escolaridade);
        const url = redeFiltro
          ? `/api/escolas?rede=${encodeURIComponent(redeFiltro)}&limit=50`
          : `/api/escolas?limit=50`;

        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          setEscolas(data.escolas || []);
        } else {
          setEscolas([]);
        }
      } catch (error) {
        console.error("Erro ao carregar escolas iniciais:", error);
        setEscolas([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialEscolas();
  }, [escolaridade]);

  // Buscar escolas quando o termo de busca muda
  useEffect(() => {
    const searchEscolas = async () => {
      if (searchTerm.length < 2) {
        // Se não há busca mas há escolaridade, recarregar escolas iniciais
        if (escolaridade) {
          const redeFiltro = getRedeEscolaFiltro(escolaridade);
          const url = redeFiltro
            ? `/api/escolas?rede=${encodeURIComponent(redeFiltro)}&limit=50`
            : `/api/escolas?limit=50`;

          setIsLoading(true);
          try {
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              setEscolas(data.escolas || []);
            }
          } catch (error) {
            console.error("Erro ao recarregar escolas:", error);
          } finally {
            setIsLoading(false);
          }
        } else {
          setEscolas([]);
        }
        return;
      }

      setIsLoading(true);
      try {
        const redeFiltro = getRedeEscolaFiltro(escolaridade || "");
        let url = `/api/escolas?search=${encodeURIComponent(searchTerm)}`;

        if (redeFiltro) {
          url += `&rede=${encodeURIComponent(redeFiltro)}`;
        }

        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          setEscolas(data.escolas || []);
        } else {
          setEscolas([]);
        }
      } catch (error) {
        console.error("Erro ao buscar escolas:", error);
        setEscolas([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchEscolas, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, escolaridade]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sincronizar valor externo com seleção interna
  useEffect(() => {
    if (value && !selectedEscola) {
      // Se há um valor mas nenhuma escola selecionada, procurar pela escola
      const escola = escolas.find((e) => e.nome === value);
      if (escola) {
        setSelectedEscola(escola);
        setSearchTerm("");
      } else {
        setSearchTerm(value);
      }
    } else if (!value && selectedEscola) {
      setSelectedEscola(null);
    }
  }, [value, selectedEscola, escolas]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setShowDropdown(true);

    // Se está digitando, limpar seleção anterior
    if (selectedEscola) {
      setSelectedEscola(null);
      onChange("");
    }

    // Se está digitando algo, enviar como valor personalizado
    if (newValue.trim()) {
      onChange(newValue);
    }
  };

  const handleEscolaSelect = (escola: Escola) => {
    setSelectedEscola(escola);
    setSearchTerm("");
    setShowDropdown(false);
    onChange(escola.nome);
    inputRef.current?.blur();
  };

  const handleClearSelection = () => {
    setSelectedEscola(null);
    setSearchTerm("");
    onChange("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (!selectedEscola) {
      setShowDropdown(true);
    }
  };

  const getRedeColor = (rede: string) => {
    switch (rede) {
      case "municipal":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "estadual":
        return "bg-green-100 text-green-800 border-green-200";
      case "federal":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "particular":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className={cn("w-full", className)} ref={dropdownRef}>
      <label
        htmlFor="escola"
        className="block text-sm font-semibold text-gray-700 font-poppins mb-2"
      >
        Minha escola<span className="text-[#FF4A97] ml-1">*</span>
      </label>

      <div className="relative">
        {selectedEscola ? (
          // Mostrar escola selecionada
          <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-md bg-white">
            <School className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedEscola.nome}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={getRedeColor(selectedEscola.rede)}
                >
                  {selectedEscola.rede}
                </Badge>
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="w-3 h-3 mr-1" />
                  {selectedEscola.municipio}, {selectedEscola.uf}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="text-gray-400 hover:text-gray-600 p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          // Mostrar campo de busca com estilo CustomInput
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              className={cn(
                "w-full rounded-[65px] px-4 sm:px-6 py-3 sm:py-4 bg-[#F8F8F8] text-base text-gray-800 border-2 border-transparent transition-all duration-200",
                "focus:ring-0 focus:outline-none focus:border-[#FF4A97] focus:bg-white",
                "placeholder:text-[#C0C0C0] font-poppins",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "text-base min-h-[48px] pl-10",
                error && "border-red-500 bg-red-50"
              )}
            />
          </div>
        )}

        {/* Dropdown de resultados */}
        {showDropdown && !selectedEscola && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto border border-gray-200 shadow-lg">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    Buscando escolas...
                  </div>
                </div>
              ) : escolas.length > 0 ? (
                <div>
                  {escolas.map((escola) => (
                    <button
                      key={escola.id}
                      type="button"
                      onClick={() => handleEscolaSelect(escola)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <School className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {escola.nome}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={getRedeColor(escola.rede)}
                            >
                              {escola.rede}
                            </Badge>
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="w-3 h-3 mr-1" />
                              {escola.municipio}, {escola.uf}
                            </div>
                          </div>
                        </div>
                        <Check className="w-4 h-4 text-transparent group-hover:text-purple-600" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchTerm.length >= 2 ? (
                <div className="p-4 text-center text-gray-500">
                  <School className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nenhuma escola encontrada</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Você pode digitar o nome da sua escola mesmo assim
                  </p>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">
                    Digite pelo menos 2 caracteres para buscar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <p className="text-gray-500 text-xs mt-1">
        {escolaridade
          ? `Digite o nome da sua escola ou selecione da lista${
              escolaridade === "Ensino Fundamental 2"
                ? " (filtrada para escolas municipais)"
                : escolaridade === "Ensino Médio"
                ? " (filtrada para escolas estaduais)"
                : ""
            }`
          : "Digite o nome da sua escola ou selecione da lista"}
      </p>
      {error && (
        <p className="text-red-500 text-sm mt-1 font-poppins">{error}</p>
      )}
    </div>
  );
}
