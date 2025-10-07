import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function DataPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading = false,
}: DataPaginationProps) {
  // Calcular range de itens exibidos
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Calcular páginas a serem exibidas
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Se temos poucas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para páginas com reticências
      if (currentPage <= 3) {
        // Início: 1, 2, 3, 4, ..., última
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Fim: 1, ..., antepenúltima, penúltima, última
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Meio: 1, ..., atual-1, atual, atual+1, ..., última
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Páginas simplificadas para mobile (apenas 3 no centro)
  const getMobilePages = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage === 1) {
        pages.push(1, 2, "...");
      } else if (currentPage === totalPages) {
        pages.push("...", totalPages - 1, totalPages);
      } else {
        pages.push(currentPage - 1, currentPage, currentPage + 1);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null; // Não mostrar paginação se há apenas 1 página ou menos
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50/30 border-t border-gray-100">
      {/* Informações sobre itens */}
      <div className="flex items-center text-sm text-gray-600 order-2 sm:order-1">
        <span className="hidden sm:inline">
          Mostrando{" "}
          <span className="font-semibold text-gray-800">{startItem}</span> a{" "}
          <span className="font-semibold text-gray-800">{endItem}</span> de{" "}
          <span className="font-semibold text-gray-800">{totalItems}</span>{" "}
          resultados
        </span>
        <span className="sm:hidden text-center">
          <span className="font-semibold text-gray-800">
            {startItem}-{endItem}
          </span>{" "}
          de <span className="font-semibold text-gray-800">{totalItems}</span>
        </span>
      </div>

      {/* Controles de paginação */}
      <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
        {/* Primeira página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
          className="p-2 sm:px-3 border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-lg"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Página anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="p-2 sm:px-3 border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Números das páginas - Desktop */}
        <div className="hidden sm:flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-2 py-2 text-gray-400 text-sm">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  disabled={isLoading}
                  className={`min-w-[2.5rem] h-9 text-sm font-medium transition-all duration-200 rounded-lg ${
                    currentPage === page
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-md hover:from-blue-600 hover:to-indigo-600"
                      : "border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                  }`}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Números das páginas - Mobile (simplificado) */}
        <div className="flex sm:hidden items-center gap-1">
          {getMobilePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-1 py-2 text-gray-400 text-sm">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  disabled={isLoading}
                  className={`min-w-[2rem] h-8 text-sm font-medium transition-all duration-200 rounded-lg ${
                    currentPage === page
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-md hover:from-blue-600 hover:to-indigo-600"
                      : "border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                  }`}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Próxima página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="p-2 sm:px-3 border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Última página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
          className="p-2 sm:px-3 border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-lg"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
