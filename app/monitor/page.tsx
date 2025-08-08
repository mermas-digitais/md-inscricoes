"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeInput } from "@/components/ui/code-input";
import {
  Search,
  Eye,
  Upload,
  Check,
  X,
  FileText,
  Mail,
  ArrowLeft,
  LogOut,
  BarChart3,
  Users,
  Gamepad2,
  Bot,
  GraduationCap,
  Calendar,
  Clock,
  Wifi,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Inscricao {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  data_nascimento: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  nome_responsavel: string;
  telefone_whatsapp: string;
  escolaridade: string;
  ano_escolar: string;
  status: "INSCRITA" | "MATRICULADA" | "CANCELADA" | "EXCEDENTE";
  curso: string;
  created_at: string;
  documento_rg_cpf?: string;
  documento_declaracao?: string;
  documento_termo?: string;
}

export default function MonitorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const monitorEmail = searchParams.get("email");

  const [step, setStep] = useState<"email" | "otp" | "dashboard">("email");
  const [email, setEmail] = useState(monitorEmail || "");
  const [monitorName, setMonitorName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [filteredInscricoes, setFilteredInscricoes] = useState<Inscricao[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInscricoes, setIsLoadingInscricoes] = useState(false);

  // Ref para scroll automático para a lista
  const inscricoesListRef = useRef<HTMLDivElement>(null);

  // Ref para controlar o debounce do scroll
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar sessão existente ao carregar a página
  useEffect(() => {
    const checkExistingSession = () => {
      const sessionData = localStorage.getItem("monitorSession");
      if (sessionData) {
        try {
          const {
            email: sessionEmail,
            nome: sessionNome,
            timestamp,
          } = JSON.parse(sessionData);
          const now = Date.now();
          const sessionTimeout = 30 * 60 * 1000; // 30 minutos em millisegundos

          // Verificar se a sessão ainda é válida
          if (now - timestamp < sessionTimeout) {
            setIsAuthenticated(true);
            setEmail(sessionEmail);
            setMonitorName(sessionNome || "");
            setStep("dashboard");
            return true;
          } else {
            // Sessão expirada, limpar localStorage
            localStorage.removeItem("monitorSession");
          }
        } catch (error) {
          localStorage.removeItem("monitorSession");
        }
      }
      return false;
    };

    // Se não tem email na URL, verificar sessão existente
    if (!monitorEmail) {
      checkExistingSession();
    }
  }, [monitorEmail]);

  // Se já tem email na URL, verificar se já está autenticado
  useEffect(() => {
    if (monitorEmail) {
      setEmail(monitorEmail);
      // Verificar se há sessão válida
      const sessionData = localStorage.getItem("monitorSession");
      if (sessionData) {
        try {
          const {
            email: sessionEmail,
            nome: sessionNome,
            timestamp,
          } = JSON.parse(sessionData);
          const now = Date.now();
          const sessionTimeout = 30 * 60 * 1000;

          if (
            now - timestamp < sessionTimeout &&
            sessionEmail === monitorEmail
          ) {
            setIsAuthenticated(true);
            setMonitorName(sessionNome || "");
            setStep("dashboard");
          } else {
            setStep("otp");
          }
        } catch (error) {
          setStep("otp");
        }
      } else {
        setStep("otp");
      }
    }
  }, [monitorEmail]);

  // Carregar inscrições quando entrar no dashboard
  useEffect(() => {
    if (step === "dashboard" && isAuthenticated) {
      loadInscricoes();
    }
  }, [step, isAuthenticated]);

  // Atualizar tempo restante da sessão
  useEffect(() => {
    if (isAuthenticated) {
      const updateSessionTime = () => {
        const sessionData = localStorage.getItem("monitorSession");
        if (sessionData) {
          try {
            const { timestamp } = JSON.parse(sessionData);
            const now = Date.now();
            const sessionTimeout = 30 * 60 * 1000; // 30 minutos
            const timeLeft = Math.max(0, sessionTimeout - (now - timestamp));

            if (timeLeft <= 0) {
              // Sessão expirada
              handleLogout();
            } else {
              setSessionTimeLeft(timeLeft);

              // Aviso quando restar 5 minutos
              if (timeLeft === 5 * 60 * 1000) {
                toast({
                  title: "Sessão expirando",
                  description:
                    "Sua sessão expira em 5 minutos. Faça login novamente se necessário.",
                  variant: "destructive",
                });
              }
            }
          } catch (error) {
            handleLogout();
          }
        }
      };

      updateSessionTime();
      const interval = setInterval(updateSessionTime, 1000); // Atualizar a cada segundo

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Cleanup do timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/monitor/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.nome) {
          setMonitorName(data.nome);
        }
        // Redirecionar para a próxima página com o email na URL
        router.push(`/monitor?email=${encodeURIComponent(email)}`);
        toast({
          title: "Código enviado!",
          description: "Verifique seu email e digite o código de verificação.",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Email não encontrado",
          description:
            data.error || "Este email não está cadastrado como monitor.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao verificar email. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (newCodeDigits: string[]) => {
    setCodeDigits(newCodeDigits);
    const codeString = newCodeDigits.join("");
    setAccessCode(codeString);
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/monitor/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: accessCode }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.nome) {
          setMonitorName(data.nome);
        }

        // Salvar sessão no localStorage com timestamp e nome
        const sessionData = {
          email: email,
          nome: data.nome || monitorName,
          timestamp: Date.now(),
        };
        localStorage.setItem("monitorSession", JSON.stringify(sessionData));

        setIsAuthenticated(true);
        setStep("dashboard");
        loadInscricoes();
        // Manter o email na URL quando acessar o dashboard
        router.push(`/monitor?email=${encodeURIComponent(email)}`);
      } else {
        const data = await response.json();
        toast({
          title: "Código inválido",
          description:
            data.error || "Verifique o código de acesso e tente novamente.",
          variant: "destructive",
        });
        // Limpar os dígitos quando há erro
        setCodeDigits(["", "", "", "", "", ""]);
        setAccessCode("");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao verificar código. Tente novamente.",
        variant: "destructive",
      });
      // Limpar os dígitos quando há erro
      setCodeDigits(["", "", "", "", "", ""]);
      setAccessCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const loadInscricoes = async () => {
    setIsLoadingInscricoes(true);
    try {
      const response = await fetch("/api/monitor/inscricoes");
      if (response.ok) {
        const data = await response.json();
        setInscricoes(data);
        setFilteredInscricoes(data);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar inscrições.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingInscricoes(false);
    }
  };

  // Email verification step
  if (step === "email") {
    return (
      <>
        {/* Layout padrão - estrutura de camadas que ocupa 100% da viewport */}
        <div className="min-h-screen relative overflow-hidden">
          {/* Camada 1: Fundo roxo - sempre 100% da altura */}
          <div className="absolute inset-0 w-full h-full bg-[#9854CB] z-0"></div>

          {/* Camada 2: Imagem de fundo fixa no topo */}
          <div className="absolute top-0 left-0 right-0 h-screen z-5">
            <img
              src="/assets/images/monitor_asset.svg"
              alt="Fundo do monitor"
              className="absolute top-0 left-0 w-full h-full object-cover object-top pointer-events-none select-none"
              style={{
                transform: "scale(1.0)",
                willChange: "transform",
              }}
              aria-hidden="true"
            />
          </div>

          {/* Camada 3: Conteúdo scrollável */}
          <div className="relative z-10 min-h-screen flex flex-col">
            {/* Container do conteúdo principal centralizado */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
              <div className="w-full max-w-md">
                <div className="rounded-2xl bg-white shadow-lg px-4 sm:px-6 pt-6 pb-6 font-poppins">
                  {/* Header do formulário */}
                  <div className="text-center mb-6">
                    <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-[#FF4A97] to-[#6C2EB5] rounded-full flex items-center justify-center shadow-lg">
                      <Mail className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-2 font-poppins">
                      PAINEL DO MONITOR
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-2 font-poppins">
                      Acesso Restrito
                    </h1>
                    <p className="text-gray-600 text-sm font-poppins">
                      Digite seu email para verificar se você tem acesso ao
                      painel de monitores
                    </p>
                  </div>

                  {/* Formulário */}
                  <form
                    onSubmit={handleEmailVerification}
                    className="space-y-6"
                  >
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-gray-700 font-poppins mb-2"
                      >
                        Email do Monitor
                        <span className="text-[#FF4A97] ml-1">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="monitor@mermasdigitais.com.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-[65px] px-4 sm:px-6 py-3 sm:py-4 bg-[#F8F8F8] text-base text-gray-800 border-2 border-transparent transition-all duration-200 focus:ring-0 focus:outline-none focus:border-[#FF4A97] focus:bg-white font-poppins disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-[56px]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-[65px] px-6 py-4 bg-gradient-to-r from-[#FF4A97] to-[#6C2EB5] text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-pink-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-poppins min-h-[56px] flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Verificando...
                        </>
                      ) : (
                        "Verificar Email"
                      )}
                    </button>
                  </form>

                  {/* Informação adicional */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg">
                    <p className="text-sm text-gray-700 font-poppins text-center">
                      <strong>🔒 Área Restrita:</strong> Apenas monitores
                      autorizados têm acesso a este painel.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 pb-8 pt-8">
              <div className="flex justify-center px-4">
                <div className="w-full max-w-md">
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
      </>
    );
  }

  // OTP verification step
  if (step === "otp") {
    return (
      <>
        {/* Layout padrão - estrutura de camadas que ocupa 100% da viewport */}
        <div className="min-h-screen relative overflow-hidden">
          {/* Camada 1: Fundo roxo - sempre 100% da altura */}
          <div className="absolute inset-0 w-full h-full bg-[#9854CB] z-0"></div>

          {/* Camada 2: Imagem de fundo fixa no topo */}
          <div className="absolute top-0 left-0 right-0 h-screen z-5">
            <img
              src="/assets/images/monitor_asset.svg"
              alt="Fundo do monitor"
              className="absolute top-0 left-0 w-full h-full object-cover object-top pointer-events-none select-none"
              style={{
                transform: "scale(1.0)",
                willChange: "transform",
              }}
              aria-hidden="true"
            />
          </div>

          {/* Camada 3: Conteúdo scrollável */}
          <div className="relative z-10 min-h-screen flex flex-col">
            {/* Container do conteúdo principal centralizado */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
              <div className="w-full max-w-md">
                <div className="rounded-2xl bg-white shadow-lg px-4 sm:px-6 pt-6 pb-6 font-poppins">
                  {/* Header do formulário */}
                  <div className="text-center mb-6">
                    <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-[#FF4A97] to-[#6C2EB5] rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-2 font-poppins">
                      VERIFICAÇÃO DE ACESSO
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-2 font-poppins">
                      Digite o Código
                    </h1>
                    <p className="text-gray-600 text-sm font-poppins">
                      Enviamos um código de verificação para
                    </p>
                    <p className="text-[#FF4A97] font-semibold text-sm font-poppins mt-1">
                      {email}
                    </p>
                  </div>

                  {/* Formulário */}
                  <form onSubmit={handleOtpVerification} className="space-y-6">
                    <CodeInput
                      value={codeDigits}
                      onChange={handleCodeChange}
                      label="Código de Acesso *"
                    />

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("email");
                          setIsAuthenticated(false);
                          router.push("/monitor");
                        }}
                        className="flex-1 rounded-[65px] px-6 py-4 bg-gray-100 text-gray-700 font-semibold text-base transition-all duration-200 hover:bg-gray-200 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-gray-200 font-poppins min-h-[56px] flex items-center justify-center"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || accessCode.length !== 6}
                        className="flex-1 rounded-[65px] px-6 py-4 bg-gradient-to-r from-[#FF4A97] to-[#6C2EB5] text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-pink-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-poppins min-h-[56px] flex items-center justify-center"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Verificando...
                          </>
                        ) : (
                          "Acessar Painel"
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Informação sobre o código */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg">
                    <p className="text-sm text-gray-700 font-poppins text-center">
                      <strong>⏰ Código válido por 10 minutos</strong>
                    </p>
                    <p className="text-xs text-gray-600 font-poppins text-center mt-1">
                      Não recebeu? Volte e reenvie o código
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 pb-8 pt-8">
              <div className="flex justify-center px-4">
                <div className="w-full max-w-md">
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
      </>
    );
  }

  // Dashboard step (existing code)
  function normalizeText(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function normalizeCPF(cpf: string) {
    // Remove todos os caracteres não numéricos
    return cpf.replace(/\D/g, "");
  }

  function normalizePhone(phone: string) {
    // Remove todos os caracteres não numéricos
    return phone.replace(/\D/g, "");
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term);

    // Limpar timeout anterior se existir
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    if (!term.trim()) {
      setFilteredInscricoes(inscricoes);
      return;
    }

    const normalizedTerm = normalizeText(term);
    const normalizedCPFTerm = normalizeCPF(term);
    const normalizedPhoneTerm = normalizePhone(term);

    const filtered = inscricoes.filter((inscricao) => {
      // Busca por nome (flexível - contém o termo)
      const normalizedName = normalizeText(inscricao.nome);
      const nameMatch = normalizedName.includes(normalizedTerm);

      // Busca por email (flexível - contém o termo)
      const normalizedEmail = normalizeText(inscricao.email);
      const emailMatch = normalizedEmail.includes(normalizedTerm);

      // Busca por CPF (sem pontuação)
      const normalizedCPF = normalizeCPF(inscricao.cpf);
      const cpfMatch =
        normalizedCPFTerm.length >= 3 &&
        normalizedCPF.includes(normalizedCPFTerm);

      // Busca por telefone (sem pontuação)
      const normalizedPhone = normalizePhone(inscricao.telefone_whatsapp || "");
      const phoneMatch =
        normalizedPhoneTerm.length >= 4 &&
        normalizedPhone.includes(normalizedPhoneTerm);

      // Busca por nome do responsável
      const normalizedResponsavel = normalizeText(
        inscricao.nome_responsavel || ""
      );
      const responsavelMatch = normalizedResponsavel.includes(normalizedTerm);

      // Busca por escola/escolaridade
      const normalizedEscola = normalizeText(inscricao.escolaridade || "");
      const escolaMatch = normalizedEscola.includes(normalizedTerm);

      // Busca por ano escolar
      const normalizedAno = normalizeText(inscricao.ano_escolar || "");
      const anoMatch = normalizedAno.includes(normalizedTerm);

      // Busca por curso
      const normalizedCurso = normalizeText(inscricao.curso || "");
      const cursoMatch = normalizedCurso.includes(normalizedTerm);

      // Busca por status
      const normalizedStatus = normalizeText(inscricao.status || "");
      const statusMatch = normalizedStatus.includes(normalizedTerm);

      return (
        nameMatch ||
        emailMatch ||
        cpfMatch ||
        phoneMatch ||
        responsavelMatch ||
        escolaMatch ||
        anoMatch ||
        cursoMatch ||
        statusMatch
      );
    });

    setFilteredInscricoes(filtered);

    // Scroll automático para a lista quando há busca - com debounce
    if (term.trim() && inscricoesListRef.current) {
      scrollTimeoutRef.current = setTimeout(() => {
        inscricoesListRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 800); // Espera 800ms após parar de digitar
    }
  };

  const handleStatusChange = async (
    id: string,
    newStatus: "INSCRITA" | "MATRICULADA" | "CANCELADA"
  ) => {
    try {
      const response = await fetch("/api/monitor/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        setInscricoes((prev) =>
          prev.map((inscricao) =>
            inscricao.id === id
              ? { ...inscricao, status: newStatus }
              : inscricao
          )
        );
        setFilteredInscricoes((prev) =>
          prev.map((inscricao) =>
            inscricao.id === id
              ? { ...inscricao, status: newStatus }
              : inscricao
          )
        );
        toast({
          title: "Status atualizado",
          description: `Status alterado para ${newStatus}`,
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar status.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("monitorSession");
    setIsAuthenticated(false);
    setStep("email");
    setEmail("");
    setMonitorName("");
    setAccessCode("");
    router.push("/monitor");
    toast({
      title: "Logout realizado",
      description: "Sessão encerrada com sucesso.",
    });
  };

  const handleFileUpload = async (
    inscricaoId: string,
    fileType: string,
    file: File
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("inscricaoId", inscricaoId);
    formData.append("fileType", fileType);

    try {
      const response = await fetch("/api/monitor/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Arquivo enviado",
          description: "Arquivo enviado com sucesso.",
        });
        loadInscricoes(); // Recarregar para atualizar os dados
      } else {
        toast({
          title: "Erro",
          description: "Erro ao enviar arquivo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar arquivo.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "INSCRITA":
        return (
          <Badge className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300 px-3 py-1 font-medium flex items-center gap-1 hover:from-yellow-200 hover:to-yellow-300 hover:text-yellow-900 hover:border-yellow-400 transition-all duration-200 cursor-pointer">
            <FileText className="w-3 h-3" />
            Inscrita
          </Badge>
        );
      case "MATRICULADA":
        return (
          <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 px-3 py-1 font-medium flex items-center gap-1 hover:from-green-200 hover:to-green-300 hover:text-green-900 hover:border-green-400 transition-all duration-200 cursor-pointer">
            <Check className="w-3 h-3" />
            Matriculada
          </Badge>
        );
      case "CANCELADA":
        return (
          <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300 px-3 py-1 font-medium flex items-center gap-1 hover:from-red-200 hover:to-red-300 hover:text-red-900 hover:border-red-400 transition-all duration-200 cursor-pointer">
            <X className="w-3 h-3" />
            Cancelada
          </Badge>
        );
      case "EXCEDENTE":
        return (
          <Badge className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300 px-3 py-1 font-medium flex items-center gap-1 hover:from-orange-200 hover:to-orange-300 hover:text-orange-900 hover:border-orange-400 transition-all duration-200 cursor-pointer">
            <Clock className="w-3 h-3" />
            Excedente
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300 px-3 py-1 font-medium hover:from-gray-200 hover:to-gray-300 hover:text-gray-900 hover:border-gray-400 transition-all duration-200 cursor-pointer">
            {status}
          </Badge>
        );
    }
  };

  const formatTimeLeft = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Componente de Shimmer Effect para Loading
  const InscricaoShimmer = () => (
    <div className="p-4">
      <div className="flex items-center gap-4">
        {/* Avatar shimmer */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer flex-shrink-0"></div>

        {/* Conteúdo shimmer */}
        <div className="flex-1 space-y-3">
          {/* Nome e badge */}
          <div className="flex items-center gap-3">
            <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-48"></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-full w-20"></div>
          </div>

          {/* Informações */}
          <div className="flex flex-wrap gap-4">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-20"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-28"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-36"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-24"></div>
          </div>
        </div>

        {/* Botão shimmer */}
        <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded px-4 w-28"></div>
      </div>
    </div>
  );

  // Componente de Shimmer Effect para Estatísticas
  const StatsShimmer = () => (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="text-center p-2 md:p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg md:rounded-xl border border-gray-200"
        >
          <div className="h-6 md:h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded mb-2 mx-auto w-8"></div>
          <div className="h-3 md:h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-16 mx-auto"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header Principal */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Logo e Info do Monitor */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/images/md_logo.svg"
                  alt="Mermãs Digitais"
                  className="h-12 w-auto object-contain"
                />
                <div className="border-l border-gray-300 pl-4">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Painel do Monitor
                  </h1>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span className="font-medium text-gray-800">
                      {monitorName || email}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Barra de busca e controles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              {/* Barra de busca melhorada */}
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por nome, email, CPF, telefone, responsável..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ fontSize: "16px" }} // Previne zoom no iOS
                  className="pl-12 pr-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all duration-200 text-base"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pink-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status da sessão e logout */}
              <div className="flex items-center gap-3">
                {/* Indicador de sessão */}
                {isAuthenticated && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                    <div className="relative">
                      <Wifi className="w-4 h-4 text-green-600" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-sm">
                      <span
                        className={
                          sessionTimeLeft < 5 * 60 * 1000
                            ? "text-red-600 font-semibold"
                            : "text-green-700 font-medium"
                        }
                      >
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatTimeLeft(sessionTimeLeft)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botão de logout */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 border-pink-200 hover:border-pink-300 transition-all duration-200 px-4 py-2"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Dashboard Stats - Layout mais compacto */}
        <div className="grid gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Resumo Geral - Mais compacto */}
          <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                Resumo Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingInscricoes ? (
                <StatsShimmer />
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
                  <div className="text-center p-2 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg md:rounded-xl border border-blue-200">
                    <div className="text-lg md:text-2xl font-bold text-blue-700">
                      {inscricoes.length}
                    </div>
                    <p className="text-xs md:text-sm font-medium text-blue-600">
                      Total
                    </p>
                  </div>
                  <div className="text-center p-2 md:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg md:rounded-xl border border-yellow-200">
                    <div className="text-lg md:text-2xl font-bold text-yellow-700">
                      {inscricoes.filter((i) => i.status === "INSCRITA").length}
                    </div>
                    <p className="text-xs md:text-sm font-medium text-yellow-600">
                      Inscritas
                    </p>
                  </div>
                  <div className="text-center p-2 md:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg md:rounded-xl border border-green-200">
                    <div className="text-lg md:text-2xl font-bold text-green-700">
                      {
                        inscricoes.filter((i) => i.status === "MATRICULADA")
                          .length
                      }
                    </div>
                    <p className="text-xs md:text-sm font-medium text-green-600">
                      Matriculadas
                    </p>
                  </div>
                  <div className="text-center p-2 md:p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg md:rounded-xl border border-orange-200">
                    <div className="text-lg md:text-2xl font-bold text-orange-700">
                      {
                        inscricoes.filter((i) => i.status === "EXCEDENTE")
                          .length
                      }
                    </div>
                    <p className="text-xs md:text-sm font-medium text-orange-600">
                      Excedentes
                    </p>
                  </div>
                  <div className="text-center p-2 md:p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg md:rounded-xl border border-red-200">
                    <div className="text-lg md:text-2xl font-bold text-red-700">
                      {
                        inscricoes.filter((i) => i.status === "CANCELADA")
                          .length
                      }
                    </div>
                    <p className="text-xs md:text-sm font-medium text-red-600">
                      Canceladas
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados por Curso - Layout mais compacto */}
          <div className="grid md:grid-cols-2 gap-3 md:gap-6">
            {/* Jogos Digitais */}
            {(() => {
              const jogosInscricoes = inscricoes.filter(
                (i) => i.curso === "Jogos"
              );
              const jogosStats = {
                total: jogosInscricoes.length,
                inscrita: jogosInscricoes.filter((i) => i.status === "INSCRITA")
                  .length,
                matriculada: jogosInscricoes.filter(
                  (i) => i.status === "MATRICULADA"
                ).length,
                excedente: jogosInscricoes.filter(
                  (i) => i.status === "EXCEDENTE"
                ).length,
                cancelada: jogosInscricoes.filter(
                  (i) => i.status === "CANCELADA"
                ).length,
              };
              const vagas = 50;
              const ocupacao =
                ((jogosStats.matriculada + jogosStats.inscrita) / vagas) * 100;

              return (
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg">
                  <CardHeader className="pb-2 md:pb-3">
                    <CardTitle className="text-base md:text-lg font-bold text-purple-900 flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 md:w-5 md:h-5 text-purple-700" />
                      Jogos Digitais
                      <Badge className="bg-purple-100 text-purple-700 ml-auto text-xs hover:bg-purple-200 hover:text-purple-800 transition-all duration-200 cursor-pointer">
                        {jogosStats.total}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 md:space-y-4">
                      {/* Barra de Progresso */}
                      <div>
                        <div className="flex justify-between text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                          <span>Ocupação</span>
                          <span>
                            {jogosStats.matriculada + jogosStats.inscrita}/
                            {vagas}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(ocupacao, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {ocupacao.toFixed(1)}% ocupado
                        </p>
                      </div>

                      {/* Stats - Layout mais compacto */}
                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        <div className="text-center p-2 md:p-3 bg-white/70 rounded-lg border border-purple-200">
                          <div className="text-sm md:text-lg font-bold text-green-700">
                            {jogosStats.matriculada}
                          </div>
                          <p className="text-xs font-medium text-green-600">
                            Matriculadas
                          </p>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-white/70 rounded-lg border border-purple-200">
                          <div className="text-sm md:text-lg font-bold text-yellow-700">
                            {jogosStats.inscrita}
                          </div>
                          <p className="text-xs font-medium text-yellow-600">
                            Inscritas
                          </p>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-white/70 rounded-lg border border-purple-200">
                          <div className="text-sm md:text-lg font-bold text-orange-700">
                            {jogosStats.excedente}
                          </div>
                          <p className="text-xs font-medium text-orange-600">
                            Excedentes
                          </p>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-white/70 rounded-lg border border-purple-200">
                          <div className="text-sm md:text-lg font-bold text-red-700">
                            {jogosStats.cancelada}
                          </div>
                          <p className="text-xs font-medium text-red-600">
                            Canceladas
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Robótica */}
            {(() => {
              const roboticaInscricoes = inscricoes.filter(
                (i) => i.curso === "Robótica"
              );
              const roboticaStats = {
                total: roboticaInscricoes.length,
                inscrita: roboticaInscricoes.filter(
                  (i) => i.status === "INSCRITA"
                ).length,
                matriculada: roboticaInscricoes.filter(
                  (i) => i.status === "MATRICULADA"
                ).length,
                excedente: roboticaInscricoes.filter(
                  (i) => i.status === "EXCEDENTE"
                ).length,
                cancelada: roboticaInscricoes.filter(
                  (i) => i.status === "CANCELADA"
                ).length,
              };
              const vagas = 50;
              const ocupacao =
                ((roboticaStats.matriculada + roboticaStats.inscrita) / vagas) *
                100;

              return (
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-lg">
                  <CardHeader className="pb-2 md:pb-3">
                    <CardTitle className="text-base md:text-lg font-bold text-blue-900 flex items-center gap-2">
                      <Bot className="w-4 h-4 md:w-5 md:h-5 text-blue-700" />
                      Robótica / IA
                      <Badge className="bg-blue-100 text-blue-700 ml-auto text-xs hover:bg-blue-200 hover:text-blue-800 transition-all duration-200 cursor-pointer">
                        {roboticaStats.total}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 md:space-y-4">
                      {/* Barra de Progresso */}
                      <div>
                        <div className="flex justify-between text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                          <span>Ocupação</span>
                          <span>
                            {roboticaStats.matriculada + roboticaStats.inscrita}
                            /{vagas}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(ocupacao, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {ocupacao.toFixed(1)}% ocupado
                        </p>
                      </div>

                      {/* Stats - Layout mais compacto */}
                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        <div className="text-center p-2 md:p-3 bg-white/70 rounded-lg border border-blue-200">
                          <div className="text-sm md:text-lg font-bold text-green-700">
                            {roboticaStats.matriculada}
                          </div>
                          <p className="text-xs font-medium text-green-600">
                            Matriculadas
                          </p>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-white/70 rounded-lg border border-blue-200">
                          <div className="text-sm md:text-lg font-bold text-yellow-700">
                            {roboticaStats.inscrita}
                          </div>
                          <p className="text-xs font-medium text-yellow-600">
                            Inscritas
                          </p>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-white/70 rounded-lg border border-blue-200">
                          <div className="text-sm md:text-lg font-bold text-orange-700">
                            {roboticaStats.excedente}
                          </div>
                          <p className="text-xs font-medium text-orange-600">
                            Excedentes
                          </p>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-white/70 rounded-lg border border-blue-200">
                          <div className="text-sm md:text-lg font-bold text-red-700">
                            {roboticaStats.cancelada}
                          </div>
                          <p className="text-xs font-medium text-red-600">
                            Canceladas
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </div>

        {/* Lista de Inscrições */}
        <Card className="bg-white shadow-lg border-0" ref={inscricoesListRef}>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Lista de Inscrições
              <Badge className="bg-blue-100 text-blue-700 ml-auto hover:bg-blue-200 hover:text-blue-800 transition-all duration-200 cursor-pointer">
                {filteredInscricoes.length}{" "}
                {filteredInscricoes.length === 1 ? "inscrição" : "inscrições"}
              </Badge>
            </CardTitle>
            {searchTerm && (
              <p className="text-sm text-gray-600">
                Resultados para:{" "}
                <span className="font-semibold">"{searchTerm}"</span>
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingInscricoes ? (
              // Shimmer effect durante o carregamento
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 6 }).map((_, index) => (
                  <InscricaoShimmer key={index} />
                ))}
              </div>
            ) : filteredInscricoes.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">
                  {searchTerm
                    ? "Nenhuma inscrição encontrada"
                    : "Nenhuma inscrição cadastrada"}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {searchTerm
                    ? "Tente buscar por outro termo"
                    : "As inscrições aparecerão aqui quando forem criadas"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredInscricoes.map((inscricao, index) => (
                  <div
                    key={inscricao.id}
                    className="p-4 hover:bg-gradient-to-r hover:from-pink-50/30 hover:to-purple-50/30 transition-all duration-200 border-l-4 border-transparent hover:border-pink-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4">
                          {/* Avatar/Ícone */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-700 font-bold text-lg">
                              {inscricao.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          {/* Informações principais */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900 truncate">
                                {inscricao.nome}
                              </p>
                              {getStatusBadge(inscricao.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-4 h-4" />
                                {inscricao.ano_escolar}
                              </span>
                              <span className="flex items-center gap-1">
                                {inscricao.curso === "Jogos" ? (
                                  <Gamepad2 className="w-4 h-4" />
                                ) : (
                                  <Bot className="w-4 h-4" />
                                )}
                                {inscricao.curso === "Jogos"
                                  ? "Jogos Digitais"
                                  : "Robótica"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {inscricao.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(
                                  inscricao.created_at
                                ).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(
                              `/monitor/inscricao/${
                                inscricao.id
                              }?email=${encodeURIComponent(email)}`
                            )
                          }
                          className="hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:border-pink-300 hover:text-pink-700 transition-all duration-200"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
