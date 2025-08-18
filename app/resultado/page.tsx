"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BookOpen, AlertCircle, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Inscricao {
  id: string;
  nome: string;
  status: "Aprovada" | "Excedente" | "Inscrita";
  curso: "Robótica (Ensino Médio)" | "Jogos (Ensino Fundamental)";
  cpf: string;
}

async function getInscricoes(): Promise<Inscricao[]> {
  try {
    const response = await fetch("/api/resultado", {
      cache: "no-store", // Garante que os dados sejam sempre frescos
    });
    if (!response.ok) {
      throw new Error("Falha ao buscar dados");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar inscrições:", error);
    return []; // Retorna um array vazio em caso de erro
  }
}

export default function ResultadoPage() {
  const [inscricoesRobotica, setInscricoesRobotica] = useState<Inscricao[]>([]);
  const [inscricoesJogos, setInscricoesJogos] = useState<Inscricao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await getInscricoes();
      setInscricoesRobotica(
        data.filter((i) => i.curso === "Robótica (Ensino Médio)")
      );
      setInscricoesJogos(
        data.filter((i) => i.curso === "Jogos (Ensino Fundamental)")
      );
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const filteredRobotica = useMemo(() => {
    return inscricoesRobotica.filter((inscricao) =>
      inscricao.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inscricoesRobotica, searchTerm]);

  const filteredJogos = useMemo(() => {
    return inscricoesJogos.filter((inscricao) =>
      inscricao.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inscricoesJogos, searchTerm]);

  const renderContent = (inscricoes: Inscricao[]) => {
    if (inscricoes.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-white/80">Nenhum resultado encontrado.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inscricoes.map((inscricao) => (
          <Card
            key={inscricao.id}
            className={cn(
              "w-full shadow-lg rounded-xl border-l-4",
              inscricao.status === "Aprovada" || inscricao.status === "Inscrita"
                ? "border-[#FF4A97]"
                : "border-gray-400"
            )}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-[#6C2EB5] pr-2">
                  {inscricao.nome}
                </h3>
                <Badge
                  className={cn(
                    "text-white text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0",
                    inscricao.status === "Aprovada" ||
                      inscricao.status === "Inscrita"
                      ? "bg-[#FF4A97]"
                      : "bg-gray-400"
                  )}
                >
                  {inscricao.status === "Inscrita"
                    ? "Aprovada"
                    : inscricao.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span>{inscricao.curso}</span>
                </div>
              </div>

              <div
                className={cn(
                  "mt-3 p-3 rounded-lg flex items-start gap-3 text-sm",
                  inscricao.status === "Aprovada" ||
                    inscricao.status === "Inscrita"
                    ? "bg-green-50 text-green-800"
                    : "bg-yellow-50 text-yellow-800"
                )}
              >
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  {inscricao.status === "Aprovada" ||
                  inscricao.status === "Inscrita" ? (
                    <p>
                      <strong>Parabéns!</strong> Compareça no primeiro dia de
                      aula com sua{" "}
                      <Dialog>
                        <DialogTrigger asChild>
                          <span className="underline cursor-pointer font-semibold hover:text-green-900">
                            documentação completa
                          </span>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-[#6C2EB5] text-2xl">
                              Documentação Necessária
                            </DialogTitle>
                          </DialogHeader>
                          <ul className="list-disc list-inside space-y-2 my-4 text-gray-700">
                            <li>Identidade da aluna.</li>
                            <li>Declaração de matrícula da escola.</li>
                            <li className="flex items-center justify-between">
                              Termo de consentimento assinado pelo responsável.
                              <Link
                                href={`/termo/${encodeURIComponent(
                                  inscricao.cpf
                                )}`}
                                target="_blank"
                                className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-[#FF4A97] hover:bg-[#e64387] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4A97]"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Gerar Termo
                              </Link>
                            </li>
                          </ul>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button className="bg-[#FF4A97] hover:bg-[#e64387]">
                                Fechar
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      .
                    </p>
                  ) : (
                    <p>
                      Aguarde a segunda chamada, caso haja desistências. Fique
                      de olho no seu e-mail!
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#9854CB] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-screen">
        <img
          src="/assets/images/form_asset.svg"
          alt="Fundo do formulário"
          className="absolute top-0 left-0 w-full h-full object-cover object-top pointer-events-none select-none"
          style={{
            transform: "scale(1.0)",
            willChange: "transform",
          }}
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 ">
        <div className="w-full max-w-4xl mx-auto pt-32">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white">
              Resultado das Inscrições
            </h1>
            <p className="text-white/80 mt-2">
              Confira a lista de alunas selecionadas para os cursos.
            </p>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white" />
            <Input
              type="text"
              placeholder="Buscar pelo nome da aluna..."
              className="w-full rounded-full pl-10 pr-4 py-2 bg-white/20 placeholder:text-white text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Tabs defaultValue="robotica" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/20 p-1 rounded-full h-auto">
              <TabsTrigger
                value="robotica"
                className="data-[state=active]:bg-[#FF4A97] data-[state=active]:text-white rounded-full text-white text-sm whitespace-normal h-full py-2 flex items-center gap-2"
              >
                Robótica
                <Badge className="bg-white/20 text-white">
                  {filteredRobotica.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="jogos"
                className="data-[state=active]:bg-[#FF4A97] data-[state=active]:text-white rounded-full text-white text-sm whitespace-normal h-full py-2 flex items-center gap-2"
              >
                Jogos
                <Badge className="bg-white/20 text-white">
                  {filteredJogos.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="robotica" className="mt-4">
              {renderContent(filteredRobotica)}
            </TabsContent>
            <TabsContent value="jogos" className="mt-4">
              {renderContent(filteredJogos)}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
