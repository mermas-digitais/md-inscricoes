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

  if (totalPages <= 1) {
    return null; // Não mostrar paginação se há apenas 1 página ou menos
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      {/* Informações sobre itens */}
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Mostrando <span className="font-medium">{startItem}</span> a{" "}
          <span className="font-medium">{endItem}</span> de{" "}
          <span className="font-medium">{totalItems}</span> resultados
        </span>
      </div>

      {/* Controles de paginação */}
      <div className="flex items-center gap-2">
        {/* Primeira página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
          className="p-2"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Página anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="p-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Números das páginas */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  disabled={isLoading}
                  className={`px-3 py-2 ${
                    currentPage === page
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent"
                      : "hover:bg-pink-50 hover:border-pink-300"
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
          className="p-2"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Última página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
          className="p-2"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
