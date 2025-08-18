"use client";

import { useEffect, useState } from "react";
import { TermoConsentimento } from "@/components/termo-consentimento";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface TermoData {
  nomeParticipante: string;
  nomeResponsavel: string;
  cpfResponsavel: string;
}

export default function TermoPage() {
  const params = useParams();
  const cpf = params.cpf as string;
  const [data, setData] = useState<TermoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cpf) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/inscricao/${encodeURIComponent(cpf)}`
          );
          if (!response.ok) {
            throw new Error("Não foi possível carregar os dados do termo.");
          }
          const result = await response.json();
          setData(result);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [cpf]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-4 sm:p-6">
            <div className="flex-shrink-0 mb-4 sm:mb-0">
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
            <div className="flex-1 w-full space-y-3">
              <Skeleton className="h-6 w-3/4 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mx-auto sm:mx-0" />
              <Skeleton className="h-12 w-48 mx-auto sm:mx-0 mt-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Erro: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen">
        Nenhum dado encontrado.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <TermoConsentimento
        nomeParticipante={data.nomeParticipante}
        nomeResponsavel={data.nomeResponsavel}
        cpfResponsavel={data.cpfResponsavel}
      />
    </div>
  );
}
