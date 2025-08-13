"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  ChevronDown,
  ChevronUp,
  Plus,
  UserPlus,
  Shield,
  ToggleLeft,
  ToggleRight,
  Menu,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ModalNovaInscricao } from "@/components/ui/modal-nova-inscricao";
import { ModalNovoMonitor } from "@/components/ui/modal-novo-monitor";

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
  escola: string;
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

  // Função para formatar data corretamente (evita problemas de fuso horário)
  const formatDate = (dateString: string) => {
    if (!dateString) return "";

    try {
      // Método mais direto: forçar apenas a parte da data
      const dateOnly = dateString.split("T")[0]; // Remove hora se existir

      // Verificar se está no formato YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        return dateString;
      }

      // Split manual e reconstrução como string brasileira
      const [year, month, day] = dateOnly.split("-");
      const brazilianFormat = `${day}/${month}/${year}`;

      return brazilianFormat;
    } catch (error) {
      console.error("Erro ao formatar data:", error, "Input:", dateString);
      return dateString; // Retorna original em caso de erro
    }
  };

  const [step, setStep] = useState<"email" | "otp" | "dashboard">(() => {
    // Verificar localStorage no momento da inicialização
    if (typeof window !== "undefined") {
      try {
        const sessionData = localStorage.getItem("monitorSession");
        if (sessionData) {
          const { timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          const sessionTimeout = 30 * 60 * 1000; // 30 minutos
          if (now - timestamp < sessionTimeout) {
            return "dashboard";
          }
        }
      } catch (error) {
        console.error("Erro ao verificar step do localStorage:", error);
      }
    }
    return "email";
  });
  const [email, setEmail] = useState(monitorEmail || "");
  const [monitorName, setMonitorName] = useState(() => {
    // Verificar localStorage no momento da inicialização
    if (typeof window !== "undefined") {
      try {
        const sessionData = localStorage.getItem("monitorSession");
        if (sessionData) {
          const { nome } = JSON.parse(sessionData);
          return nome || "";
        }
      } catch (error) {
        console.error("Erro ao carregar nome do localStorage:", error);
      }
    }
    return "";
  });
  const [monitorRole, setMonitorRole] = useState<"MONITOR" | "ADM">(() => {
    // Verificar localStorage no momento da inicialização
    if (typeof window !== "undefined") {
      try {
        const sessionData = localStorage.getItem("monitorSession");
        if (sessionData) {
          const { role } = JSON.parse(sessionData);
          return role || "MONITOR";
        }
      } catch (error) {
        console.error("Erro ao carregar role do localStorage:", error);
      }
    }
    return "MONITOR";
  });
  const [viewMode, setViewMode] = useState<"inscricoes" | "monitores">(
    "inscricoes"
  );
  const [monitores, setMonitores] = useState<any[]>([]);
  const [filteredMonitores, setFilteredMonitores] = useState<any[]>([]);
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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Verificar localStorage no momento da inicialização
    if (typeof window !== "undefined") {
      try {
        const sessionData = localStorage.getItem("monitorSession");
        if (sessionData) {
          const { timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          const sessionTimeout = 30 * 60 * 1000; // 30 minutos
          return now - timestamp < sessionTimeout;
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação do localStorage:", error);
      }
    }
    return false;
  });
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInscricoes, setIsLoadingInscricoes] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Estados para controlar os modais
  const [isModalNovaInscricaoOpen, setIsModalNovaInscricaoOpen] =
    useState(false);
  const [isModalNovoMonitorOpen, setIsModalNovoMonitorOpen] = useState(false);

  // Ref para scroll automático para a lista
  const inscricoesListRef = useRef<HTMLDivElement>(null);

  // Ref para controlar o debounce do scroll
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar sessão existente ao carregar a página
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const checkExistingSession = () => {
      const sessionData = localStorage.getItem("monitorSession");
      if (sessionData) {
        try {
          const {
            email: sessionEmail,
            nome: sessionNome,
            role: sessionRole,
            timestamp,
          } = JSON.parse(sessionData);

          const now = Date.now();
          const sessionTimeout = 30 * 60 * 1000; // 30 minutos em millisegundos

          // Verificar se a sessão ainda é válida
          if (now - timestamp < sessionTimeout) {
            setIsAuthenticated(true);
            setEmail(sessionEmail);
            setMonitorName(sessionNome || "");
            setMonitorRole(sessionRole || "MONITOR"); // Manter fallback por segurança
            setStep("dashboard");

            return true;
          } else {
            // Sessão expirada, limpar localStorage
            localStorage.removeItem("monitorSession");
          }
        } catch (error) {
          console.error("Erro ao processar sessionData:", error);
          localStorage.removeItem("monitorSession");
        }
      }
      return false;
    };

    // Se não tem email na URL, verificar sessão existente
    if (!monitorEmail) {
      checkExistingSession();
    }
  }, [isClient, monitorEmail]);

  // Se já tem email na URL, verificar se já está autenticado
  useEffect(() => {
    if (!isClient || !monitorEmail) return;

    setEmail(monitorEmail);
    // Verificar se há sessão válida
    const sessionData = localStorage.getItem("monitorSession");
    if (sessionData) {
      try {
        const {
          email: sessionEmail,
          nome: sessionNome,
          role: sessionRole,
          timestamp,
        } = JSON.parse(sessionData);

        const now = Date.now();
        const sessionTimeout = 30 * 60 * 1000;

        if (now - timestamp < sessionTimeout && sessionEmail === monitorEmail) {
          setIsAuthenticated(true);
          setMonitorName(sessionNome || "");
          setMonitorRole(sessionRole || "MONITOR"); // Manter fallback por segurança
          setStep("dashboard");
        } else {
          setStep("otp");
        }
      } catch (error) {
        console.error("Erro ao processar sessionData com email na URL:", error);
        setStep("otp");
      }
    } else {
      setStep("otp");
    }
  }, [isClient, monitorEmail]);

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
              // Só atualizar se o valor mudou significativamente (diferença > 500ms)
              setSessionTimeLeft((prev) => {
                const diff = Math.abs(prev - timeLeft);
                return diff > 500 ? timeLeft : prev;
              });

              // Aviso quando restar 5 minutos
              if (
                timeLeft <= 5 * 60 * 1000 &&
                timeLeft > 5 * 60 * 1000 - 1000
              ) {
                toast({
                  title: "Sessão expirando",
                  description:
                    "Sua sessão expira em 5 minutos. Faça login novamente se necessário.",
                  variant: "warning",
                  duration: 10000, // 10 segundos para aviso importante
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

  // Funções para lidar com o sucesso dos modais
  const handleNovaInscricaoSuccess = () => {
    // Recarregar as inscrições se estivermos na view de inscrições
    if (viewMode === "inscricoes") {
      loadInscricoes(); // Carregar diretamente ao invés de recarregar a página
    }
  };

  const handleNovoMonitorSuccess = () => {
    // Recarregar os monitores se estivermos na view de monitores
    if (viewMode === "monitores") {
      loadMonitores(); // Carregar diretamente ao invés de recarregar a página
    }
  };

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
        if (data.role) {
          setMonitorRole(data.role);
        }
        // Redirecionar para a próxima página com o email na URL
        router.push(`/monitor?email=${encodeURIComponent(email)}`);
        toast({
          title: "Código enviado!",
          description: "Verifique seu email e digite o código de verificação.",
          variant: "success",
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
        if (data.role) {
          setMonitorRole(data.role);
        }

        // Salvar sessão no localStorage com timestamp e nome
        const sessionData = {
          email: email,
          nome: data.nome || monitorName,
          role: data.role || "MONITOR",
          timestamp: Date.now(),
        };

        localStorage.setItem("monitorSession", JSON.stringify(sessionData));

        setIsAuthenticated(true);
        setStep("dashboard");
        loadInscricoes();

        // Toast de boas-vindas
        setTimeout(() => {
          toast({
            title: `Bem-vindo(a), ${data.nome || "Monitor"}!`,
            description: "Acesso autorizado ao painel de gerenciamento.",
            variant: "success",
          });
        }, 500);

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

  const loadInscricoes = useCallback(async () => {
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
  }, []);

  // Função para carregar monitores
  const loadMonitores = useCallback(async () => {
    try {
      const response = await fetch("/api/monitor/monitores");
      if (response.ok) {
        const data = await response.json();
        setMonitores(data);
        setFilteredMonitores(data);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar lista de monitores",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading monitores:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar monitores",
        variant: "destructive",
      });
    }
  }, []);

  // Carregar dados quando a visualização mudar
  useEffect(() => {
    if (isAuthenticated && step === "dashboard") {
      if (viewMode === "inscricoes") {
        loadInscricoes();
      } else if (viewMode === "monitores") {
        loadMonitores();
      }
    }
  }, [isAuthenticated, step, viewMode, loadInscricoes, loadMonitores]);

  // Limpar busca quando mudar o modo de visualização
  useEffect(() => {
    setSearchTerm("");
    // Não usar os arrays diretamente aqui para evitar loops
    if (viewMode === "inscricoes") {
      setFilteredInscricoes(inscricoes);
    } else {
      setFilteredMonitores(monitores);
    }
  }, [viewMode]);

  // Funções auxiliares - DEVEM estar antes dos early returns para evitar violação das Rules of Hooks
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

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);

      // Limpar timeout anterior se existir
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (!term.trim()) {
        setFilteredInscricoes(inscricoes);
        setFilteredMonitores(monitores);
        return;
      }

      const normalizedTerm = normalizeText(term);

      // Se estiver no modo monitores, filtrar monitores
      if (viewMode === "monitores") {
        // Função para calcular o score de relevância para nomes de monitores
        const getNameScore = (name: string, searchTerm: string): number => {
          const normalizedName = normalizeText(name);
          const words = normalizedName.split(" ");

          // Score 1000: Correspondência exata no início do nome completo
          if (normalizedName.startsWith(searchTerm)) {
            return 1000;
          }

          // Score 500: Correspondência exata no início de qualquer palavra
          for (const word of words) {
            if (word.startsWith(searchTerm)) {
              return 500;
            }
          }

          // Score 100: Correspondência parcial em qualquer lugar
          if (normalizedName.includes(searchTerm)) {
            return 100;
          }

          return 0;
        };

        const filteredMonitors = monitores
          .filter((monitor) => {
            // Busca por nome (com score)
            const nameScore = getNameScore(monitor.nome, normalizedTerm);
            const nameMatch = nameScore > 0;

            // Busca por email
            const normalizedEmail = normalizeText(monitor.email);
            const emailMatch = normalizedEmail.includes(normalizedTerm);

            // Busca por role
            const normalizedRole = normalizeText(monitor.role || "");
            const roleMatch = normalizedRole.includes(normalizedTerm);

            // Adicionar score ao monitor para ordenação posterior
            (monitor as any)._searchScore = nameScore;

            return nameMatch || emailMatch || roleMatch;
          })
          .sort((a, b) => {
            // Ordenar por score de nome (maior score primeiro)
            const scoreA = (a as any)._searchScore || 0;
            const scoreB = (b as any)._searchScore || 0;

            if (scoreA !== scoreB) {
              return scoreB - scoreA; // Ordem decrescente de score
            }

            // Se scores iguais, ordenar alfabeticamente por nome
            return a.nome.localeCompare(b.nome);
          });

        setFilteredMonitores(filteredMonitors);
      } else {
        // Se estiver no modo inscrições, filtrar inscrições (código existente)
        const normalizedCPFTerm = normalizeCPF(term);
        const normalizedPhoneTerm = normalizePhone(term);

        // Função para calcular o score de relevância para nomes
        const getNameScore = (name: string, searchTerm: string): number => {
          const normalizedName = normalizeText(name);
          const words = normalizedName.split(" ");

          // Score 1000: Correspondência exata no início do nome completo
          if (normalizedName.startsWith(searchTerm)) {
            return 1000;
          }

          // Score 500: Correspondência exata no início de qualquer palavra
          for (const word of words) {
            if (word.startsWith(searchTerm)) {
              return 500;
            }
          }

          // Score 100: Correspondência parcial em qualquer lugar
          if (normalizedName.includes(searchTerm)) {
            return 100;
          }

          return 0;
        };

        const filtered = inscricoes
          .filter((inscricao) => {
            // Busca por nome (com score)
            const nameScore = getNameScore(inscricao.nome, normalizedTerm);
            const nameMatch = nameScore > 0;

            // Busca por email (flexível - contém o termo)
            const normalizedEmail = normalizeText(inscricao.email);
            const emailMatch = normalizedEmail.includes(normalizedTerm);

            // Busca por CPF (sem pontuação)
            const normalizedCPF = normalizeCPF(inscricao.cpf);
            const cpfMatch =
              normalizedCPFTerm.length >= 3 &&
              normalizedCPF.includes(normalizedCPFTerm);

            // Busca por telefone (sem pontuação)
            const normalizedPhone = normalizePhone(
              inscricao.telefone_whatsapp || ""
            );
            const phoneMatch =
              normalizedPhoneTerm.length >= 4 &&
              normalizedPhone.includes(normalizedPhoneTerm);

            // Busca por escola/escolaridade
            const normalizedEscola = normalizeText(
              inscricao.escolaridade || ""
            );
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

            // Adicionar score à inscrição para ordenação posterior
            (inscricao as any)._searchScore = nameScore;

            return (
              nameMatch ||
              emailMatch ||
              cpfMatch ||
              phoneMatch ||
              escolaMatch ||
              anoMatch ||
              cursoMatch ||
              statusMatch
            );
          })
          .sort((a, b) => {
            // Ordenar por score de nome (maior score primeiro)
            const scoreA = (a as any)._searchScore || 0;
            const scoreB = (b as any)._searchScore || 0;

            if (scoreA !== scoreB) {
              return scoreB - scoreA; // Ordem decrescente de score
            }

            // Se scores iguais, ordenar alfabeticamente por nome
            return a.nome.localeCompare(b.nome);
          });

        setFilteredInscricoes(filtered);
      }

      // Scroll automático para a lista quando há busca - com debounce
      if (term.trim() && inscricoesListRef.current) {
        scrollTimeoutRef.current = setTimeout(() => {
          inscricoesListRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 800); // Espera 800ms após parar de digitar
      }
    },
    [viewMode, monitores, inscricoes]
  );

  const handleStatusChange = useCallback(
    async (id: string, newStatus: "INSCRITA" | "MATRICULADA" | "CANCELADA") => {
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
            variant: "success",
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
    },
    []
  );

  const handleLogout = useCallback(() => {
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
      variant: "info",
    });
  }, [router]);

  const handleFileUpload = useCallback(
    async (inscricaoId: string, fileType: string, file: File) => {
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
    },
    [loadInscricoes]
  );

  const getStatusBadge = useCallback((status: string) => {
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
  }, []);

  const formatTimeLeft = useCallback((milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const toggleCardExpansion = useCallback((inscricaoId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(inscricaoId)) {
        newSet.delete(inscricaoId);
      } else {
        newSet.add(inscricaoId);
      }
      return newSet;
    });
  }, []);

  const handleChangeMonitorRole = useCallback(
    async (monitorId: string, newRole: string) => {
      try {
        console.log("Tentando alterar role:", { monitorId, newRole });

        const response = await fetch("/api/monitor/edit-role", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monitorId, role: newRole }),
        });

        console.log("Response status:", response.status);
        const responseData = await response.json();
        console.log("Response data:", responseData);

        if (response.ok) {
          // Atualizar as listas locais
          setMonitores((prev) =>
            prev.map((monitor) =>
              monitor.id === monitorId ? { ...monitor, role: newRole } : monitor
            )
          );
          setFilteredMonitores((prev) =>
            prev.map((monitor) =>
              monitor.id === monitorId ? { ...monitor, role: newRole } : monitor
            )
          );

          toast({
            title: "Role atualizada",
            description: `Role alterada para ${
              newRole === "ADM" ? "Administrador" : "Monitor"
            }`,
            variant: "success",
          });
        } else {
          console.error("Erro na resposta:", responseData);
          toast({
            title: "Erro",
            description:
              responseData.error || "Erro ao alterar role do monitor.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro na requisição:", error);
        toast({
          title: "Erro",
          description: `Erro ao alterar role do monitor: ${
            error instanceof Error ? error.message : String(error)
          }`,
          variant: "destructive",
        });
      }
    },
    []
  );

  const handleDeleteMonitor = useCallback(
    async (monitorId: string, monitorName: string) => {
      // Confirmação antes de excluir
      if (
        !confirm(
          `Tem certeza que deseja excluir o monitor "${monitorName}"? Esta ação não pode ser desfeita.`
        )
      ) {
        return;
      }

      try {
        const response = await fetch("/api/monitor/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monitorId }),
        });

        if (response.ok) {
          // Remover das listas locais
          setMonitores((prev) =>
            prev.filter((monitor) => monitor.id !== monitorId)
          );
          setFilteredMonitores((prev) =>
            prev.filter((monitor) => monitor.id !== monitorId)
          );

          toast({
            title: "Monitor excluído",
            description: `Monitor "${monitorName}" foi excluído com sucesso.`,
            variant: "success",
          });
        } else {
          toast({
            title: "Erro",
            description: "Erro ao excluir monitor.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir monitor.",
          variant: "destructive",
        });
      }
    },
    []
  );

  // Componentes auxiliares
  const InscricaoShimmer = useCallback(
    () => (
      <div className="p-4">
        <div className="space-y-3">
          {/* Linha 1: Avatar + Nome + Status + Botão expansão */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {/* Avatar shimmer */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer flex-shrink-0 shadow-md"></div>

              {/* Nome */}
              <div className="flex-1">
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-48"></div>
              </div>

              {/* Status */}
              <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-full w-20"></div>
            </div>

            {/* Botão expansão */}
            <div className="w-8 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-full ml-2 flex-shrink-0"></div>
          </div>

          {/* Linha 2: Curso + Data */}
          <div className="flex items-center gap-3">
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-md w-24"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-20"></div>
          </div>
        </div>
      </div>
    ),
    []
  );

  const MonitorCard = React.memo(({ monitor }: { monitor: any }) => {
    const getInitials = (name: string) => {
      const names = name.trim().split(" ");
      const firstName = names[0]?.charAt(0)?.toUpperCase() || "";
      const lastName = names[1]?.charAt(0)?.toUpperCase() || "";
      return firstName + lastName;
    };

    const getRoleBadge = (role: string) => {
      return role === "ADM" ? (
        <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 px-3 py-1 font-medium flex items-center gap-1">
          <Shield className="w-3 h-3" />
          ADM
        </Badge>
      ) : (
        <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 px-3 py-1 font-medium flex items-center gap-1">
          <Users className="w-3 h-3" />
          Monitor
        </Badge>
      );
    };

    // Não permitir editar o próprio usuário logado
    const isCurrentUser = monitor.email === email;

    return (
      <div className="p-4 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-200 border-l-4 border-transparent hover:border-blue-300 hover:shadow-sm">
        <div className="space-y-3">
          {/* Linha 1: Avatar + Nome + Role + Menu */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-blue-200">
                <span className="font-bold text-sm text-blue-700">
                  {getInitials(monitor.nome)}
                </span>
              </div>

              {/* Nome */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-base">
                  {monitor.nome}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-pink-600 font-medium">
                      (Você)
                    </span>
                  )}
                </h3>
              </div>

              {/* Role */}
              <div className="flex-shrink-0">{getRoleBadge(monitor.role)}</div>
            </div>

            {/* Menu de ações - apenas para ADMs e não para o próprio usuário */}
            {monitorRole === "ADM" && !isCurrentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 p-1 h-8 w-8 rounded-full hover:bg-gray-100"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() =>
                      handleChangeMonitorRole(
                        monitor.id,
                        monitor.role === "ADM" ? "MONITOR" : "ADM"
                      )
                    }
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    <span>
                      {monitor.role === "ADM"
                        ? "Alterar para Monitor"
                        : "Alterar para Admin"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      handleDeleteMonitor(monitor.id, monitor.nome)
                    }
                    className="flex items-center gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Monitor</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Linha 2: Email + Data de criação */}
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-gray-600">
              <Mail className="w-3 h-3" />
              <span>{monitor.email}</span>
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(monitor.created_at)}</span>
            </span>
          </div>
        </div>
      </div>
    );
  });

  const StatsShimmer = useCallback(
    () => (
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
    ),
    []
  );

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
                        autoComplete="email"
                        suppressHydrationWarning
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header Principal - Simplificado */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo e Título */}
            <div className="flex items-center gap-3">
              <img
                src="/assets/images/md_logo.svg"
                alt="Mermãs Digitais"
                className="h-10 w-auto object-contain"
              />
              <div className="border-l border-gray-300 pl-3">
                <h1 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Painel do Monitor
                </h1>
              </div>
            </div>

            {/* Menu Sanduíche */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 px-3 py-2 border-gray-300 hover:border-pink-300 hover:bg-pink-50"
                >
                  <Menu className="w-4 h-4" />
                  <span className="text-xs">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 mt-2">
                {/* Informações da Sessão */}
                <div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-200">
                      <span className="font-bold text-sm text-pink-700">
                        {monitorName
                          ? monitorName.charAt(0).toUpperCase()
                          : email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {monitorName || email}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        {monitorRole === "ADM" ? (
                          <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 px-2 py-0.5 text-xs font-medium">
                            <Shield className="w-3 h-3 mr-1" />
                            Administrador
                          </Badge>
                        ) : (
                          <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 px-2 py-0.5 text-xs font-medium">
                            <Users className="w-3 h-3 mr-1" />
                            Monitor
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Email e tempo de sessão */}
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span>{email}</span>
                    </div>
                    {isAuthenticated && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span
                          className={
                            sessionTimeLeft < 5 * 60 * 1000
                              ? "text-red-600 font-semibold"
                              : "text-green-600"
                          }
                        >
                          Sessão: {formatTimeLeft(sessionTimeLeft)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Botão de logout */}
                <div className="px-3 py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full text-pink-600 hover:text-white hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-500 border-pink-200 hover:border-pink-400 transition-all duration-300 justify-start"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair do Painel
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Container principal do conteúdo */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
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
        {/* Barra de Controles - Unificada */}
        <div className="mb-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header da barra com seletor */}
          <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Título da seção */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-md">
                  {viewMode === "inscricoes" ? (
                    <GraduationCap className="w-5 h-5 text-white" />
                  ) : (
                    <Shield className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {viewMode === "inscricoes"
                      ? "Lista de Inscrições"
                      : "Lista de Monitores"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {viewMode === "inscricoes"
                      ? "Visualize e gerencie todas as inscrições dos cursos"
                      : "Gerencie todos os monitores do sistema"}
                  </p>
                </div>
              </div>

              {/* Seletor de visualização redesenhado */}
              <div className="relative">
                <div className="flex bg-gray-100/80 backdrop-blur-sm rounded-2xl p-1 border border-gray-200/50 shadow-sm">
                  <button
                    onClick={() => setViewMode("inscricoes")}
                    className={`relative px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                      viewMode === "inscricoes"
                        ? "bg-white text-pink-600 shadow-md shadow-pink-100 border border-pink-100"
                        : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Alunas</span>
                    <Badge
                      className={`ml-1 text-xs px-2 py-0.5 ${
                        viewMode === "inscricoes"
                          ? "bg-pink-100 text-pink-700 border-pink-200"
                          : "bg-gray-200 text-gray-600 border-gray-300"
                      }`}
                    >
                      {filteredInscricoes.length}
                    </Badge>
                  </button>
                  <button
                    onClick={() => setViewMode("monitores")}
                    className={`relative px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                      viewMode === "monitores"
                        ? "bg-white text-blue-600 shadow-md shadow-blue-100 border border-blue-100"
                        : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Monitores</span>
                    <Badge
                      className={`ml-1 text-xs px-2 py-0.5 ${
                        viewMode === "monitores"
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-gray-200 text-gray-600 border-gray-300"
                      }`}
                    >
                      {filteredMonitores.length}
                    </Badge>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo principal - Busca e Ações */}
          <div className="px-6 py-5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              {/* Barra de busca melhorada */}
              <div className="relative flex-1 lg:max-w-xl">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <Search className="text-gray-400 w-5 h-5" />
                </div>
                <Input
                  placeholder={
                    viewMode === "monitores"
                      ? "Buscar monitores por nome, email ou função..."
                      : "Buscar alunas por nome, email, CPF ou curso..."
                  }
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ fontSize: "16px" }}
                  className="pl-12 pr-12 py-4 bg-gray-50/50 border-2 border-gray-200/80 rounded-2xl focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-50 transition-all duration-300 text-sm w-full shadow-sm hover:shadow-md hover:border-pink-200 hover:bg-white backdrop-blur-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pink-600 transition-all duration-200 hover:scale-110 z-10 bg-white rounded-full p-1 shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Indicador de busca ativa */}
                {searchTerm && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-lg p-3 z-20">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse"></div>
                      <span className="text-gray-600">
                        Buscando por:{" "}
                        <span className="font-semibold text-pink-600">
                          "{searchTerm}"
                        </span>
                      </span>
                      <span className="ml-auto px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">
                        {viewMode === "inscricoes"
                          ? filteredInscricoes.length
                          : filteredMonitores.length}{" "}
                        resultados
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Ações - Desktop e Mobile */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Menu "Novo" para ADMs */}
                {monitorRole === "ADM" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg hover:shadow-emerald-200/50 px-6 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-md border-0 hover:scale-[1.02] backdrop-blur-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Adicionar</span>
                        <span className="sm:hidden">Novo</span>
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 sm:w-72 mt-2 bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-2xl rounded-2xl overflow-hidden"
                    >
                      <div className="p-3">
                        {/* Header do menu */}
                        <div className="px-3 py-2 mb-3">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            Adicionar Novo
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Escolha o que deseja cadastrar
                          </p>
                        </div>

                        <DropdownMenuItem
                          onClick={() => setIsModalNovaInscricaoOpen(true)}
                          className="flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:text-pink-700 transition-all duration-200 cursor-pointer mb-2"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center shadow-sm">
                            <GraduationCap className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              Nova Aluna
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Cadastrar nova inscrição de aluna
                            </div>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => setIsModalNovoMonitorOpen(true)}
                          className="flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-200 cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center shadow-sm">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              Novo Monitor
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Adicionar monitor ou administrador
                            </div>
                          </div>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Inscrições ou Monitores - Sem Header */}
        <Card className="bg-white shadow-lg border-0" ref={inscricoesListRef}>
          <CardContent className="p-0">
            {viewMode === "monitores" ? (
              // Visualização de Monitores
              !filteredMonitores || filteredMonitores.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    {searchTerm
                      ? "Nenhum monitor encontrado"
                      : "Nenhum monitor cadastrado"}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {searchTerm
                      ? "Tente buscar por outro termo"
                      : "Os monitores aparecerão aqui quando forem criados"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredMonitores.map((monitor) => (
                    <MonitorCard key={monitor.id} monitor={monitor} />
                  ))}
                </div>
              )
            ) : // Visualização de Inscrições (código existente)
            isLoadingInscricoes ? (
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
                {filteredInscricoes.map((inscricao, index) => {
                  const isExpanded = expandedCards.has(inscricao.id);

                  return (
                    <div
                      key={inscricao.id}
                      className="p-4 hover:bg-gradient-to-r hover:from-pink-50/30 hover:to-purple-50/30 transition-all duration-200 border-l-4 border-transparent hover:border-pink-300 hover:shadow-sm"
                    >
                      {/* Header sempre visível - Linha 1 e 2 */}
                      <div className="space-y-3">
                        {/* Linha 1: Avatar + Nome + Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Avatar */}
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                                inscricao.curso === "Jogos"
                                  ? "bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200"
                                  : "bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200"
                              }`}
                            >
                              <span
                                className={`font-bold text-sm ${
                                  inscricao.curso === "Jogos"
                                    ? "text-purple-700"
                                    : "text-blue-700"
                                }`}
                              >
                                {(() => {
                                  const nomes = inscricao.nome
                                    .trim()
                                    .split(" ");
                                  const primeiroNome =
                                    nomes[0]?.charAt(0)?.toUpperCase() || "";
                                  const segundoNome =
                                    nomes[1]?.charAt(0)?.toUpperCase() || "";
                                  return primeiroNome + segundoNome;
                                })()}
                              </span>
                            </div>

                            {/* Nome */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate text-base">
                                {inscricao.nome}
                              </h3>
                            </div>

                            {/* Status */}
                            <div className="flex-shrink-0">
                              {getStatusBadge(inscricao.status)}
                            </div>
                          </div>

                          {/* Botão de expansão */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCardExpansion(inscricao.id)}
                            className="flex-shrink-0 ml-2 p-1 h-8 w-8 rounded-full hover:bg-gray-100"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            )}
                          </Button>
                        </div>

                        {/* Linha 2: Curso + Data de inscrição */}
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            {inscricao.curso === "Jogos" ? (
                              <Gamepad2 className="w-3 h-3 text-purple-600" />
                            ) : (
                              <Bot className="w-3 h-3 text-blue-600" />
                            )}
                            <span className="font-medium">
                              {inscricao.curso === "Jogos"
                                ? "Jogos"
                                : "Robótica"}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(inscricao.created_at)}</span>
                          </span>
                        </div>

                        {/* Conteúdo expansível */}
                        {isExpanded && (
                          <div className="space-y-4 pt-3 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                            {/* Informações pessoais */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-900 text-sm">
                                  Informações Pessoais
                                </h4>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {inscricao.email}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">CPF:</span>{" "}
                                    {inscricao.cpf}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">
                                      Nascimento:
                                    </span>{" "}
                                    {formatDate(inscricao.data_nascimento)}
                                  </div>
                                  {inscricao.nome_responsavel && (
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <Users className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">
                                        {inscricao.nome_responsavel}
                                      </span>
                                    </div>
                                  )}
                                  {inscricao.telefone_whatsapp && (
                                    <div className="text-sm text-gray-600">
                                      <span className="font-medium">
                                        WhatsApp:
                                      </span>{" "}
                                      {inscricao.telefone_whatsapp}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-900 text-sm">
                                  Informações Acadêmicas
                                </h4>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <GraduationCap className="w-3 h-3 text-purple-600" />
                                    <span>{inscricao.escolaridade}</span>
                                  </div>
                                  {inscricao.ano_escolar && (
                                    <div className="text-sm text-gray-600">
                                      <span className="font-medium">Ano:</span>{" "}
                                      {inscricao.ano_escolar}
                                    </div>
                                  )}
                                  {inscricao.escola && (
                                    <div className="text-sm text-gray-600">
                                      <span className="font-medium">
                                        Escola:
                                      </span>{" "}
                                      {inscricao.escola}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Endereço */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-900 text-sm">
                                Endereço
                              </h4>
                              <div className="text-sm text-gray-600">
                                <p>
                                  {inscricao.logradouro}, {inscricao.numero}
                                  {inscricao.complemento &&
                                    `, ${inscricao.complemento}`}
                                </p>
                                <p>
                                  {inscricao.bairro} - {inscricao.cidade}/
                                  {inscricao.estado}
                                </p>
                                <p>CEP: {inscricao.cep}</p>
                              </div>
                            </div>

                            {/* Botão de ação */}
                            <div className="flex justify-end pt-2">
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
                                className="hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:border-pink-300 hover:text-pink-700 transition-all duration-200 border-gray-300 text-gray-700"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver detalhes completos
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      <ModalNovaInscricao
        isOpen={isModalNovaInscricaoOpen}
        onClose={() => setIsModalNovaInscricaoOpen(false)}
        onSuccess={handleNovaInscricaoSuccess}
      />

      <ModalNovoMonitor
        isOpen={isModalNovoMonitorOpen}
        onClose={() => setIsModalNovoMonitorOpen(false)}
        onSuccess={handleNovoMonitorSuccess}
      />
    </div>
  );
}
