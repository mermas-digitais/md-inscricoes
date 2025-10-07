"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Search,
  Share2,
  X,
  FileText,
  Gamepad2,
  Bot,
} from "lucide-react";
import Link from "next/link";
import { TermoConsentimento } from "@/components/termo-consentimento";

interface InscricaoData {
  id: string;
  nome_completo: string;
  curso_interesse: string;
  created_at: string;
  status?: string;
}

// Resultados possíveis da consulta por CPF
interface ResultadoInscricaoTradicional extends InscricaoData {
  kind: "inscricao";
}

interface ResultadoEventoParticipante {
  kind: "evento_participante";
  equipe: {
    id: string;
    nome_equipe: string;
    modalidade: string | null;
    status: string;
  } | null;
  orientador: {
    nome: string;
    escola: string;
  } | null;
  membros: Array<{
    id: string;
    nome: string;
    genero: string;
  }>;
}

interface ResultadoOrientador {
  kind: "orientador";
  orientador: {
    id: string;
    nome: string;
    escola: string;
  };
  equipes: Array<{
    id: string;
    nome_equipe: string;
    modalidade: string | null;
    status: string;
    membros: Array<{
      id: string;
      nome: string;
      genero: string;
    }>;
  }>;
}

type ConsultaResultado =
  | ResultadoInscricaoTradicional
  | ResultadoEventoParticipante
  | ResultadoOrientador;

const formatCPF = (cpf: string) => {
  if (!cpf) return "";
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatPhone = (phone: string) => {
  if (!phone) return "";
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";

  console.log("formatDate - Input:", dateString);

  try {
    // Método mais direto: forçar apenas a parte da data
    const dateOnly = dateString.split("T")[0]; // Remove hora se existir
    console.log("formatDate - Date only:", dateOnly);

    // Verificar se está no formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      console.log("formatDate - Not in YYYY-MM-DD format, returning original");
      return dateString;
    }

    // Split manual e reconstrução como string brasileira
    const [year, month, day] = dateOnly.split("-");
    const brazilianFormat = `${day}/${month}/${year}`;

    console.log("formatDate - Manual format result:", brazilianFormat);

    return brazilianFormat;
  } catch (error) {
    console.error("Erro ao formatar data:", error, "Input:", dateString);
    return dateString; // Retorna original em caso de erro
  }
};

const getStatusBadge = (status?: string) => {
  console.log("Status recebido no badge:", status);

  switch (status?.toUpperCase()) {
    case "EXCEDENTE":
    case "EXCEDENTES":
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 transition-colors text-xs sm:text-sm">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          Excedente
        </Badge>
      );
    case "CANCELADA":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 transition-colors text-xs sm:text-sm">
          <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          Cancelada
        </Badge>
      );
    case "MATRICULADA":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors text-xs sm:text-sm">
          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          Matriculada
        </Badge>
      );
    case "INSCRITA":
    default:
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 transition-colors text-xs sm:text-sm">
          <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          Inscrita
        </Badge>
      );
  }
};

const cursoDisplayNames: { [key: string]: string } = {
  Jogos: "Desenvolvimento de Jogos Digitais",
  Robótica: "Robótica Educacional e Inteligência Artificial",
  "programacao-web": "Programação Web",
  "design-grafico": "Design Gráfico",
  "marketing-digital": "Marketing Digital",
  "analise-dados": "Análise de Dados",
  "mobile-development": "Desenvolvimento Mobile",
  "ux-ui": "UX/UI Design",
};

const getNextSteps = (status?: string, inscricao?: InscricaoData) => {
  const statusUpper = status?.toUpperCase();

  if (statusUpper === "EXCEDENTE" || statusUpper === "EXCEDENTES") {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white/60 rounded-xl border border-purple-100">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-[#FF4A97] to-[#FF6B9D] text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mt-0.5 shadow-lg flex-shrink-0">
            1
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-purple-700 text-base sm:text-lg">
              Inscrição registrada
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Você está na lista de excedentes
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white/60 rounded-xl border border-purple-100">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-[#FF4A97] to-[#FF6B9D] text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mt-0.5 shadow-lg flex-shrink-0">
            2
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-purple-700 text-base sm:text-lg">
              Aguardar comunicação
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Fique de olho no seu email para ver se abriu uma vaga nova e você
              foi selecionada
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (statusUpper === "CANCELADA") {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mt-0.5 shadow-lg flex-shrink-0">
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-red-700 text-base sm:text-lg">
              Inscrição cancelada
            </p>
            <p className="text-xs sm:text-sm text-red-600 mt-1">
              Sua inscrição foi cancelada. Entre em contato conosco se tiver
              dúvidas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Status inscrita/matriculada
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white/60 rounded-xl border border-purple-100">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-[#FF4A97] to-[#FF6B9D] text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mt-0.5 shadow-lg flex-shrink-0">
          1
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-purple-700 text-base sm:text-lg">
            Confirmação recebida
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Sua inscrição foi registrada com sucesso
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white/60 rounded-xl border border-purple-100">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-[#FF4A97] to-[#FF6B9D] text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mt-0.5 shadow-lg flex-shrink-0">
          2
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-purple-700 text-base sm:text-lg mb-2 sm:mb-3">
            Comparecer no primeiro dia de aula
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 mb-2 sm:mb-3">
            Traga os seguintes documentos:
          </p>
          <ul className="text-xs sm:text-sm text-gray-600 space-y-1 mb-3 sm:mb-4">
            <li>• RG/CPF</li>
            <li>• Termo de consentimento assinado pelos pais</li>
            <li>• Declaração de matrícula</li>
          </ul>

          {inscricao && (
            <TermoConsentimento
              nomeResponsavel={inscricao.nome_responsavel || ""}
              cpfResponsavel={inscricao.cpf_responsavel || ""}
              nomeParticipante={inscricao.nome_completo}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default function AcompanharPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cpfFromUrl = searchParams.get("cpf");

  const [cpf, setCpf] = useState(cpfFromUrl || "");
  const [inscricao, setInscricao] = useState<InscricaoData | null>(null);
  const [resultado, setResultado] = useState<ConsultaResultado | null>(null);
  const [multiResultados, setMultiResultados] = useState<
    ConsultaResultado[] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Auto-search se CPF veio da URL
  useEffect(() => {
    if (cpfFromUrl && cpfFromUrl.length >= 11) {
      handleSearch(cpfFromUrl);
    }
  }, [cpfFromUrl]);

  const handleSearch = async (cpfToSearch?: string) => {
    const cpfValue = cpfToSearch || cpf;

    if (!cpfValue || cpfValue.length < 11) {
      setError("CPF deve ter pelo menos 11 dígitos");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const encodedCpf = encodeURIComponent(cpfValue);
      console.log(
        "Fazendo requisição para:",
        `/api/inscricao/consultar?cpf=${encodedCpf}`
      );

      const response = await fetch(
        `/api/inscricao/consultar?cpf=${encodedCpf}`
      );
      const data = await response.json();

      console.log("Resposta da API:", data);
      console.log("Status da resposta:", response.status);

      if (response.ok) {
        console.log("Dados da inscrição:", data);
        if (data.kind === "multi") {
          const results = (data.results || []) as ConsultaResultado[];
          setMultiResultados(results);
          // Priorizar orientador no topo já vem da API; limpar single
          setResultado(null);
          setInscricao(null);
        } else {
          setResultado(data);
          setMultiResultados(null);
          if (data.kind === "inscricao") {
            setInscricao(data as InscricaoData);
          } else {
            setInscricao(null);
          }
        }
        setError("");
      } else {
        setResultado(null);
        setMultiResultados(null);
        setInscricao(null);
        setError(data.error || "Erro ao buscar inscrição");
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      setInscricao(null);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      setCpf(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && cpf.replace(/\D/g, "").length === 11 && !loading) {
      handleNewSearch();
    }
  };

  const handleNewSearch = () => {
    const cpfValue = cpf.replace(/\D/g, "");
    if (cpfValue.length === 11) {
      router.push(`/acompanhar?cpf=${encodeURIComponent(cpf)}`);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/acompanhar?cpf=${encodeURIComponent(
      cpf
    )}`;

    if (navigator.share) {
      navigator.share({
        title: "Minha Inscrição - Mermãs Digitais",
        text: "Confira o status da minha inscrição nos cursos Mermãs Digitais!",
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Camada 1: Fundo roxo - sempre 100% da altura */}
      <div className="absolute inset-0 w-full h-full bg-[#9854CB]"></div>

      {/* Camada 2: Imagem de fundo fixa no topo - acima do fundo roxo */}
      <div className="absolute top-0 left-0 right-0 bottom-0 z-10">
        <img
          src="/assets/images/monitor_asset.svg"
          alt="Fundo do acompanhar"
          className="absolute top-0 left-0 w-full h-full object-cover object-top pointer-events-none select-none"
          style={{
            transform: "scale(1.0)",
            willChange: "transform",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Camada 3: Conteúdo scrollável - ocupa mesma altura que o fundo */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Espaçamento superior responsivo - reduzido para posicionar conteúdo mais acima */}
        <div className="h-16 sm:h-20 md:h-24 lg:h-28 flex-shrink-0"></div>

        {/* Container do conteúdo principal */}
        <div className="flex-1 flex items-start justify-center px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pb-16 sm:pb-24 md:pb-32">
          <div className="w-full max-w-4xl">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-paytone-one">
                    Acompanhar Inscrição
                  </h1>
                  <p className="text-white/80 mt-1 sm:mt-2 font-poppins text-sm sm:text-base">
                    Consulte o status da sua inscrição nos cursos Mermãs
                    Digitais
                  </p>
                </div>

                {inscricao && (
                  <>
                    {console.log(
                      "Inscrição encontrada, mostrando botão compartilhar:",
                      inscricao
                    )}
                    <button
                      onClick={handleShare}
                      className="w-full sm:w-auto rounded-[65px] px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-xs sm:text-sm transition-all duration-200 hover:bg-white/20 hover:border-white/30 font-poppins flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      Compartilhar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Search Section */}
            <div className="rounded-2xl bg-white shadow-lg px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 font-poppins mb-6 sm:mb-8">
              {/* Header do formulário */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                  CONSULTA DE INSCRIÇÃO
                </div>
                <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm font-poppins">
                  Digite seu CPF para acompanhar sua inscrição
                </p>
              </div>

              {/* Formulário de busca */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label
                    htmlFor="cpf"
                    className="block text-xs sm:text-sm font-semibold text-gray-700 font-poppins mb-1"
                  >
                    CPF do candidato
                    <span className="text-[#FF4A97] ml-1">*</span>
                  </label>
                  <input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    onKeyPress={handleKeyPress}
                    maxLength={14}
                    className="w-full rounded-[65px] px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 bg-[#F8F8F8] text-sm sm:text-base text-gray-800 border-2 border-transparent transition-all duration-200 focus:ring-0 focus:outline-none focus:border-[#FF4A97] focus:bg-white font-poppins disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] sm:min-h-[48px]"
                  />
                </div>

                <div className="flex justify-center pt-2 sm:pt-4">
                  <button
                    onClick={handleNewSearch}
                    disabled={loading || cpf.length < 14}
                    className="w-full max-w-xs rounded-[65px] px-4 sm:px-6 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-[#FF4A97] to-[#FF6B9D] hover:from-[#E6397A] hover:to-[#E65A8A] text-white font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FF4A97] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-poppins min-h-[40px] sm:min-h-[48px] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                        Buscar Inscrição
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <Alert className="mb-6 sm:mb-8 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <Card className="mb-6 sm:mb-8">
                <CardHeader>
                  <Skeleton className="h-4 sm:h-6 w-32 sm:w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <Skeleton className="h-3 sm:h-4 w-full" />
                    <Skeleton className="h-3 sm:h-4 w-3/4" />
                    <Skeleton className="h-3 sm:h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results - inscrição tradicional */}
            {inscricao && !multiResultados && (
              <div className="space-y-4 sm:space-y-6">
                {/* Status Card */}
                <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 font-poppins">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-purple-200 text-[#6C2EB5] text-xs font-semibold">
                      <FileText className="w-3 h-3" />
                      STATUS DA INSCRIÇÃO
                    </div>
                    <p className="text-gray-600 mt-2 text-xs sm:text-sm font-poppins">
                      Informações sobre sua inscrição
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl text-purple-800 font-semibold text-center sm:text-left">
                      Status da Inscrição
                    </h2>
                    <div className="flex justify-center sm:justify-end">
                      {getStatusBadge(inscricao.status)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Curso selecionado
                      </p>
                      <p className="inline-flex items-center gap-2 font-semibold text-sm sm:text-lg text-purple-800 break-words">
                        <Badge className="bg-white text-purple-700 border-purple-300">
                          {cursoDisplayNames[inscricao.curso_interesse] ||
                            inscricao.curso_interesse}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Data da inscrição
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        {formatDate(inscricao.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="rounded-2xl bg-white shadow-lg px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 font-poppins">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                      DADOS PESSOAIS
                    </div>
                    <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm font-poppins">
                      Informações pessoais do candidato
                    </p>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          Nome completo
                        </p>
                        <p className="font-semibold text-sm sm:text-base break-words">
                          {inscricao.nome_completo}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          CPF
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {formatCPF(inscricao.cpf)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          Data de nascimento
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {formatDate(inscricao.data_nascimento)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          Telefone do responsável
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {formatPhone(inscricao.telefone)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        Email
                      </p>
                      <p className="font-semibold flex items-center gap-2 text-sm sm:text-base break-all">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                        {inscricao.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Responsible Info */}
                <div className="rounded-2xl bg-white shadow-lg px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 font-poppins">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                      DADOS DO RESPONSÁVEL
                    </div>
                    <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm font-poppins">
                      Informações do responsável legal
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        Nome do responsável
                      </p>
                      <p className="font-semibold text-sm sm:text-base break-words">
                        {inscricao.nome_responsavel || "Não informado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        CPF do responsável
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        {inscricao.cpf_responsavel
                          ? formatCPF(inscricao.cpf_responsavel)
                          : "Não informado"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div className="rounded-2xl bg-white shadow-lg px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 font-poppins">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                      ENDEREÇO
                    </div>
                    <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm font-poppins">
                      Localização do candidato
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="sm:col-span-2 lg:col-span-2">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        Endereço
                      </p>
                      <p className="font-semibold text-sm sm:text-base break-words">
                        {inscricao.endereco}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        CEP
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        {inscricao.cep}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        Cidade
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        {inscricao.cidade}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        Estado
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        {inscricao.estado}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Course Info */}
                <div className="rounded-2xl bg-white shadow-lg px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 font-poppins">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                      INFORMAÇÕES ESCOLARES
                    </div>
                    <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm font-poppins">
                      Dados escolares do candidato
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        Série
                      </p>
                      <p className="font-semibold text-sm sm:text-base capitalize">
                        Não informado
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        Escola
                      </p>
                      <p className="font-semibold text-sm sm:text-base break-words">
                        Não informado
                      </p>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 font-poppins border-2 border-purple-200">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                      PRÓXIMOS PASSOS
                    </div>
                    <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm font-poppins">
                      O que acontece após sua inscrição
                    </p>
                  </div>
                  {getNextSteps(inscricao.status, inscricao)}
                </div>
              </div>
            )}

            {/* Results - participante de evento (MDX25) */}
            {resultado &&
              (resultado as any).kind === "evento_participante" &&
              !multiResultados && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 font-poppins">
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-purple-200 text-[#6C2EB5] text-xs font-semibold">
                        <Users className="w-3 h-3" />
                        INSCRIÇÃO EM EQUIPE (EVENTO)
                      </div>
                      <p className="text-gray-600 mt-2 text-xs sm:text-sm font-poppins">
                        Detalhes da sua equipe no evento
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Nome da equipe
                        </p>
                        <p className="font-semibold text-sm sm:text-lg text-purple-700 break-words">
                          {(resultado as any).equipe?.nome_equipe || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Modalidade
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-purple-700 border border-purple-300">
                            {(resultado as any).equipe?.modalidade || "-"}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Status
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-purple-700 border border-purple-300">
                            {(resultado as any).equipe?.status || "-"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {(resultado as any).orientador && (
                      <div className="mb-4">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          Orientador(a)
                        </p>
                        <p className="font-semibold text-sm sm:text-base break-words">
                          {(resultado as any).orientador!.nome} —{" "}
                          {(resultado as any).orientador!.escola}
                        </p>
                      </div>
                    )}

                    <Separator />

                    <div className="mt-4">
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">
                        Membros da equipe
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(() => {
                          const membros = (resultado as any)
                            .membros as Array<any>;
                          const total = membros.length;
                          const feminino = membros.filter(
                            (m) => m.genero === "feminino"
                          ).length;
                          const outros = total - feminino;
                          return (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-xs">
                                <User className="w-3 h-3" /> {total} membros
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs">
                                ♀ {feminino} feminino
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                {outros} outros
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(resultado as any).membros.map((m: any) => (
                          <div
                            key={m.id}
                            className="p-3 border border-gray-200 rounded-lg bg-white/60"
                          >
                            <p className="font-semibold text-sm sm:text-base break-words">
                              {m.nome}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 capitalize">
                              Gênero: {m.genero}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Results - orientador (todas as suas equipes) */}
            {resultado &&
              (resultado as any).kind === "orientador" &&
              !multiResultados && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 font-poppins">
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-purple-200 text-[#6C2EB5] text-xs font-semibold">
                        <GraduationCap className="w-3 h-3" />
                        ORIENTADOR — SUAS EQUIPES NO EVENTO
                      </div>
                      <p className="text-gray-600 mt-2 text-xs sm:text-sm font-poppins">
                        Listagem de equipes vinculadas ao seu CPF
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        Orientador(a)
                      </p>
                      <p className="font-semibold text-sm sm:text-base break-words">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-purple-200">
                          <User className="w-3 h-3 text-purple-700" />
                          {(resultado as any).orientador.nome} —{" "}
                          {(resultado as any).orientador.escola}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      {(resultado as any).equipes.map((eq: any) => (
                        <div
                          key={eq.id}
                          className="p-4 border-2 border-purple-200 rounded-xl bg-white/70"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Equipe
                              </p>
                              <p className="font-semibold text-sm sm:text-base break-words text-purple-800">
                                {eq.nome_equipe}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Modalidade
                              </p>
                              <p className="font-semibold text-sm sm:text-base">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                  {(eq.modalidade || "").toUpperCase() ===
                                  "JOGOS" ? (
                                    <Gamepad2 className="w-3.5 h-3.5" />
                                  ) : (eq.modalidade || "").toUpperCase() ===
                                    "ROBOTICA" ? (
                                    <Bot className="w-3.5 h-3.5" />
                                  ) : null}
                                  {eq.modalidade || "-"}
                                </span>
                              </p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Status
                              </p>
                              <p className="font-semibold text-sm sm:text-base">
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                  {eq.status}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {eq.membros.map((m: any) => (
                              <div
                                key={m.id}
                                className="p-3 border border-gray-200 rounded-lg"
                              >
                                <p className="font-semibold text-sm sm:text-base break-words">
                                  {m.nome}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 capitalize">
                                  Gênero: {m.genero}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {/* Results - múltiplos (prioriza orientador no topo) */}
            {multiResultados && (
              <div className="space-y-6">
                {multiResultados.map((res, idx) => (
                  <div key={idx}>
                    {res.kind === "orientador" ? (
                      <>
                        {/* Orientador Card */}
                        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 font-poppins">
                          <div className="text-center mb-4 sm:mb-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-purple-200 text-[#6C2EB5] text-xs font-semibold">
                              <GraduationCap className="w-3 h-3" />
                              ORIENTADOR — SUAS EQUIPES NO EVENTO
                            </div>
                          </div>
                          <div className="mb-4">
                            <p className="text-xs sm:text-sm text-gray-600 mb-1">
                              Orientador(a)
                            </p>
                            <p className="font-semibold text-sm sm:text-base break-words">
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-purple-200">
                                <User className="w-3 h-3 text-purple-700" />
                                {(res as any).orientador.nome} —{" "}
                                {(res as any).orientador.escola}
                              </span>
                            </p>
                          </div>
                          <div className="space-y-3">
                            {(res as any).equipes.map((eq: any) => (
                              <div
                                key={eq.id}
                                className="p-4 border-2 border-purple-200 rounded-xl bg-white/70"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3">
                                  <div>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                      Equipe
                                    </p>
                                    <p className="font-semibold text-sm sm:text-base break-words text-purple-800">
                                      {eq.nome_equipe}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                      Modalidade
                                    </p>
                                    <p className="font-semibold text-sm sm:text-base">
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                        {(eq.modalidade || "").toUpperCase() ===
                                        "JOGOS" ? (
                                          <Gamepad2 className="w-3.5 h-3.5" />
                                        ) : (
                                            eq.modalidade || ""
                                          ).toUpperCase() === "ROBOTICA" ? (
                                          <Bot className="w-3.5 h-3.5" />
                                        ) : null}
                                        {eq.modalidade || "-"}
                                      </span>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                      Status
                                    </p>
                                    <p className="font-semibold text-sm sm:text-base">
                                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                        {eq.status}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {eq.membros.map((m: any) => (
                                    <div
                                      key={m.id}
                                      className="p-3 border border-purple-200 rounded-lg bg-white/60"
                                    >
                                      <p className="font-semibold text-sm sm:text-base break-words text-purple-800">
                                        {m.nome}
                                      </p>
                                      <span className="inline-block mt-1 text-xs sm:text-sm px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                                        {m.genero}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : res.kind === "evento_participante" ? (
                      <>
                        {/* Equipe Card */}
                        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 font-poppins">
                          <div className="text-center mb-4 sm:mb-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-purple-200 text-[#6C2EB5] text-xs font-semibold">
                              <Users className="w-3 h-3" />
                              INSCRIÇÃO EM EQUIPE (EVENTO)
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Nome da equipe
                              </p>
                              <p className="font-semibold text-sm sm:text-lg text-purple-700 break-words">
                                {(res as any).equipe?.nome_equipe || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Modalidade
                              </p>
                              <p className="font-semibold text-sm sm:text-base">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-purple-700 border border-purple-300">
                                  {(res as any).equipe?.modalidade || "-"}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : res.kind === "inscricao" ? (
                      <>
                        {/* Inscrição Card */}
                        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 font-poppins">
                          <div className="text-center mb-4 sm:mb-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-purple-200 text-[#6C2EB5] text-xs font-semibold">
                              <FileText className="w-3 h-3" />
                              STATUS DA INSCRIÇÃO
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Curso selecionado
                              </p>
                              <p className="inline-flex items-center gap-2 font-semibold text-sm sm:text-lg text-purple-800 break-words">
                                <Badge className="bg-white text-purple-700 border-purple-300">
                                  {cursoDisplayNames[
                                    (res as any).curso_interesse
                                  ] || (res as any).curso_interesse}
                                </Badge>
                              </p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Data da inscrição
                              </p>
                              <p className="font-semibold text-sm sm:text-base">
                                {formatDate((res as any).created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-8 sm:mt-12 text-white">
              <p className="text-xs sm:text-sm">
                © 2025 Mermãs Digitais. Construindo o futuro digital feminino.
              </p>
            </div>
          </div>
        </div>

        {/* Footer com mais espaçamento */}
        <div className="flex-shrink-0 pb-4 sm:pb-8 pt-8 sm:pt-16">
          <div className="flex justify-center px-3 sm:px-4">
            <div className="w-full max-w-sm sm:max-w-md">
              <img
                src="/assets/images/footer.svg"
                alt="Footer com logos"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
