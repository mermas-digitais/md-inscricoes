"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeInput } from "@/components/ui/code-input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  Monitor,
  Shield,
  UserCheck,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Target,
  Star,
  Mail,
  LogOut,
  Check,
  ChevronDown,
  Menu,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function PainelPage() {
  const router = useRouter();

  const [monitorName, setMonitorName] = useState("");
  const [monitorRole, setMonitorRole] = useState<"MONITOR" | "ADM">("MONITOR");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para autenticação
  const [email, setEmail] = useState("");
  const [emailUsername, setEmailUsername] = useState(""); // Parte do username sem o domínio
  const [verificationCode, setVerificationCode] = useState<string[]>(
    Array(6).fill("")
  );
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);

  // Domínio institucional fixo
  const INSTITUTIONAL_DOMAIN = "@acad.ifma.edu.br";

  // Função para formatar tempo restante da sessão
  const formatTimeLeft = (timeInMs: number): string => {
    const minutes = Math.floor(timeInMs / (1000 * 60));
    const seconds = Math.floor((timeInMs % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Verificar sessão existente
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem("monitorSession");
      if (sessionData) {
        try {
          const { email, nome, role, timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          const sessionTimeout = 30 * 60 * 1000; // 30 minutos

          if (now - timestamp < sessionTimeout) {
            setIsAuthenticated(true);
            setMonitorName(nome || "");
            setMonitorRole(role || "MONITOR");
            setEmail(email);

            // Extrair o username do email para mostrar corretamente
            if (email && email.includes(INSTITUTIONAL_DOMAIN)) {
              const username = email.replace(INSTITUTIONAL_DOMAIN, "");
              setEmailUsername(username);
            }

            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Erro ao verificar sessão:", error);
        }
      }

      // Se não há sessão válida, mostrar formulário de login
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    checkSession();
  }, []);

  // Timer da sessão - atualizar a cada segundo
  useEffect(() => {
    if (!isAuthenticated) {
      setSessionTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const sessionData = localStorage.getItem("monitorSession");
      if (sessionData) {
        try {
          const { timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          const sessionTimeout = 30 * 60 * 1000; // 30 minutos
          const timeLeft = sessionTimeout - (now - timestamp);

          if (timeLeft > 0) {
            setSessionTimeLeft(timeLeft);
          } else {
            // Sessão expirou - fazer logout automático
            handleLogout();
          }
        } catch (error) {
          console.error("Erro ao calcular tempo da sessão:", error);
          setSessionTimeLeft(0);
        }
      } else {
        setSessionTimeLeft(0);
      }
    };

    // Atualizar imediatamente
    updateTimer();

    // Atualizar a cada segundo
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleSendVerification = async () => {
    if (!emailUsername.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite seu email",
        variant: "destructive",
      });
      return;
    }

    // Formar o email completo com o domínio institucional
    const fullEmail = emailUsername.trim() + INSTITUTIONAL_DOMAIN;
    setEmail(fullEmail);

    setIsCodeLoading(true);
    try {
      const response = await fetch("/api/matriculas/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fullEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.nome) {
          setMonitorName(data.nome);
        }
        if (data.role) {
          setMonitorRole(data.role);
        }
        setIsVerificationSent(true);
        toast({
          title: "Código enviado!",
          description: "Verifique seu email e digite o código de verificação.",
          variant: "default",
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
      setIsCodeLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const codeString = verificationCode.join("");
    if (!codeString || codeString.length !== 6) {
      toast({
        title: "Erro",
        description: "Por favor, digite o código de 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsCodeLoading(true);
    try {
      const response = await fetch("/api/matriculas/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeString }),
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

        // Toast de boas-vindas
        setTimeout(() => {
          toast({
            title: `Bem-vindo(a), ${data.nome || "Monitor"}!`,
            description: "Acesso autorizado à plataforma de gestão.",
            variant: "default",
          });
        }, 500);
      } else {
        const data = await response.json();
        toast({
          title: "Código inválido",
          description:
            data.error || "Verifique o código de acesso e tente novamente.",
          variant: "destructive",
        });
        // Limpar os dígitos quando há erro
        setVerificationCode(Array(6).fill(""));
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao verificar código. Tente novamente.",
        variant: "destructive",
      });
      // Limpar os dígitos quando há erro
      setVerificationCode(Array(6).fill(""));
    } finally {
      setIsCodeLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("monitorSession");
    setIsAuthenticated(false);
    setEmail("");
    setEmailUsername("");
    setVerificationCode(Array(6).fill(""));
    setIsVerificationSent(false);
    setMonitorName("");
    setMonitorRole("MONITOR");

    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
      variant: "default",
    });
  };

  const handleNavigateToModule = (module: string) => {
    router.push(`/${module}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Email verification step
  if (!isAuthenticated && !isVerificationSent) {
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
                      PLATAFORMA DE GESTÃO
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-2 font-poppins">
                      Acesso Restrito
                    </h1>
                    <p className="text-gray-600 text-sm font-poppins">
                      Digite seu usuário institucional para acessar a plataforma
                    </p>
                  </div>
                  {/* Informação sobre domínio institucional */}
                  {/* <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-blue-800 font-poppins mb-1">
                        📧 Email Institucional IFMA
                      </p>
                      <p className="text-xs text-blue-700 font-poppins">
                        Digite apenas seu usuário. O domínio{" "}
                        <span className="font-bold text-blue-900">
                          @acad.ifma.edu.br
                        </span>{" "}
                        será adicionado automaticamente
                      </p>
                      {/* <div className="mt-2 p-2 bg-white rounded border border-blue-300">
                        <p className="text-xs text-gray-600 font-poppins">
                          <strong>Exemplo:</strong> Para{" "}
                          <span className="font-mono text-blue-800">
                            viniciusschneider@acad.ifma.edu.br
                          </span>
                        </p>
                        <p className="text-xs text-gray-600 font-poppins">
                          Digite apenas:{" "}
                          <span className="font-mono font-bold text-green-600">
                            viniciusschneider
                          </span>
                        </p>
                      </div>*/}
                  {/* </div>  */}
                  {/* </div>{" "} */}
                  {/* Formulário */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendVerification();
                    }}
                    className="space-y-6"
                  >
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-gray-700 font-poppins mb-2"
                      >
                        Usuário IFMA
                        <span className="text-[#FF4A97] ml-1">*</span>
                      </label>

                      <div className="relative">
                        <input
                          id="email"
                          type="text"
                          placeholder="email"
                          value={emailUsername}
                          onChange={(e) => {
                            // Permitir apenas caracteres válidos para email (antes do @)
                            const value = e.target.value
                              .replace(/[^a-zA-Z0-9._-]/g, "")
                              .toLowerCase();
                            setEmailUsername(value);
                          }}
                          required
                          autoComplete="username"
                          suppressHydrationWarning
                          className="w-full rounded-[65px] px-4 sm:px-6 py-3 sm:py-4 pr-44 bg-[#F8F8F8] text-base text-gray-800 border-2 border-transparent transition-all duration-200 focus:ring-0 focus:outline-none focus:border-[#FF4A97] focus:bg-white font-poppins disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-[56px]"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-poppins text-base pointer-events-none">
                          @acad.ifma.edu.br
                        </div>
                      </div>

                      {emailUsername && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs text-green-700 font-poppins text-center">
                            <strong>Email completo:</strong>{" "}
                            <span className="font-mono">
                              {emailUsername}@acad.ifma.edu.br
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isCodeLoading}
                      className="w-full rounded-[65px] px-6 py-4 bg-gradient-to-r from-[#FF4A97] to-[#6C2EB5] text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-pink-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-poppins min-h-[56px] flex items-center justify-center"
                    >
                      {isCodeLoading ? (
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
                      <strong>🔒 Área Restrita:</strong> Apenas usuários
                      autorizados têm acesso a esta plataforma.
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
  if (!isAuthenticated && isVerificationSent) {
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
                      <UserCheck className="w-8 h-8 text-white" />
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
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleVerifyCode();
                    }}
                    className="space-y-6"
                  >
                    <div>
                      <CodeInput
                        value={verificationCode}
                        onChange={setVerificationCode}
                        length={6}
                        label="Código de Verificação"
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsVerificationSent(false);
                            setVerificationCode(Array(6).fill(""));
                            setEmailUsername("");
                            setEmail("");
                          }}
                          className="flex-1 rounded-[65px] px-4 py-3 bg-gray-100 text-gray-700 font-semibold text-sm transition-all duration-200 hover:bg-gray-200 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-gray-200 font-poppins min-h-[48px] flex items-center justify-center"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Voltar
                        </button>
                        <button
                          type="submit"
                          disabled={
                            isCodeLoading ||
                            verificationCode.join("").length !== 6
                          }
                          className="flex-1 rounded-[65px] px-4 py-3 bg-gradient-to-r from-[#FF4A97] to-[#6C2EB5] text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-pink-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-poppins min-h-[48px] flex items-center justify-center"
                        >
                          {isCodeLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Verificando...
                            </>
                          ) : (
                            "Acessar Plataforma"
                          )}
                        </button>
                      </div>

                      {/* Botão para reenviar código */}
                      <button
                        type="button"
                        onClick={handleSendVerification}
                        disabled={isCodeLoading}
                        className="w-full rounded-[65px] px-4 py-3 bg-transparent border-2 border-[#FF4A97] text-[#FF4A97] font-semibold text-sm transition-all duration-200 hover:bg-[#FF4A97] hover:text-white hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-pink-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-poppins min-h-[48px] flex items-center justify-center"
                      >
                        {isCodeLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Reenviando...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Reenviar Código
                          </>
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
                      Não recebeu? Use o botão "Reenviar Código" acima
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
      {/* Header com navegação */}
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
                  Plataforma de Gestão
                </h1>
              </div>
            </div>

            {/* Info do usuário e menu */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {monitorName}
                </div>
                <div className="text-xs text-gray-500">
                  {monitorRole === "ADM" ? "Administrador" : "Monitor"}
                </div>
              </div>

              {/* Badge do usuário com timer integrado */}
              <div className="relative group cursor-help">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-200 flex items-center justify-center transition-all duration-200 group-hover:scale-105">
                  <span className="font-bold text-xs text-pink-700">
                    {monitorName ? monitorName.charAt(0).toUpperCase() : "U"}
                  </span>
                </div>
                {/* Timer como badge no canto do avatar */}
                <div
                  className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white transition-all duration-200 ${
                    sessionTimeLeft <= 300000
                      ? "bg-red-500 shadow-red-200"
                      : sessionTimeLeft <= 900000
                      ? "bg-yellow-500 shadow-yellow-200"
                      : "bg-green-500 shadow-green-200"
                  } shadow-lg`}
                >
                  <Clock className="w-2 h-2 text-white" />
                </div>

                {/* Tooltip melhorado no hover */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-lg z-50">
                  <div className="text-center">
                    <div className="font-medium">Sessão expira em</div>
                    <div
                      className={`font-mono text-sm ${
                        sessionTimeLeft <= 300000
                          ? "text-red-300"
                          : sessionTimeLeft <= 900000
                          ? "text-yellow-300"
                          : "text-green-300"
                      }`}
                    >
                      {formatTimeLeft(sessionTimeLeft)}
                    </div>
                  </div>
                  {/* Seta do tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>

              {/* Menu suspenso elegante com badge */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 rounded-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 border-2 border-purple-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-200/50 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <Menu className="w-4 h-4 text-purple-700 group-hover:text-purple-800 transition-colors" />
                    </Button>
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-72 border-gray-200 shadow-xl bg-white"
                >
                  <DropdownMenuLabel className="font-semibold text-gray-900 px-4 py-3">
                    Módulos da Plataforma
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />

                  <DropdownMenuItem
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-blue-50 transition-colors border-0 focus:bg-blue-50"
                    onClick={() => handleNavigateToModule("matriculas")}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 shadow-sm">
                      <Users className="h-5 w-5 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Matrículas
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Gestão de inscrições e monitores
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-green-50 transition-colors border-0 focus:bg-green-50"
                    onClick={() => handleNavigateToModule("ensino")}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-green-100 to-green-200 shadow-sm">
                      <GraduationCap className="h-5 w-5 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Ensino
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Cursos, turmas, aulas e frequência
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2 bg-gray-100" />

                  <DropdownMenuLabel className="font-semibold text-gray-900 px-4 py-2">
                    Conta
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    className="flex items-center gap-3 p-4 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors border-0 focus:bg-red-50"
                    onClick={handleLogout}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium">Sair da Conta</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 mb-4">
            <Sparkles className="w-4 h-4" />
            Nova Plataforma Integrada
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bem-vindo à Nova Plataforma de Gestão
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Agora você tem acesso a uma plataforma integrada que unifica a
            gestão de matrículas e o módulo de ensino em um só lugar.
          </p>
        </div>

        {/* Cards dos Módulos */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Módulo de Matrículas */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-blue-900">
                    Módulo de Matrículas
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Sistema que você já conhece
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-blue-800">
                  <FileText className="w-4 h-4" />
                  <span>Gestão de inscrições</span>
                </li>
                <li className="flex items-center gap-2 text-blue-800">
                  <UserCheck className="w-4 h-4" />
                  <span>Controle de status</span>
                </li>
                <li className="flex items-center gap-2 text-blue-800">
                  <Monitor className="w-4 h-4" />
                  <span>Administração de monitores</span>
                </li>
              </ul>
              <Button
                onClick={() => handleNavigateToModule("matriculas")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Acessar Matrículas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Módulo de Ensino */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-green-900">
                    Módulo de Ensino
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Novo sistema pedagógico
                  </CardDescription>
                </div>
                <Badge className="bg-green-200 text-green-800 border-green-300">
                  <Star className="w-3 h-3 mr-1" />
                  Novo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-green-800">
                  <BookOpen className="w-4 h-4" />
                  <span>Gestão de cursos e turmas</span>
                </li>
                <li className="flex items-center gap-2 text-green-800">
                  <Calendar className="w-4 h-4" />
                  <span>Registro de aulas</span>
                </li>
                <li className="flex items-center gap-2 text-green-800">
                  <Clock className="w-4 h-4" />
                  <span>Controle de frequência</span>
                </li>
              </ul>
              <Button
                onClick={() => handleNavigateToModule("ensino")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Explorar Ensino
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Novidades */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Zap className="w-5 h-5" />
              Novidades da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 mb-1">
                    Navegação Integrada
                  </h3>
                  <p className="text-sm text-purple-700">
                    Alterne facilmente entre os módulos de Matrículas e Ensino
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 mb-1">
                    Autenticação Unificada
                  </h3>
                  <p className="text-sm text-purple-700">
                    Um só login para acessar todos os módulos da plataforma
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 mb-1">
                    Interface Modernizada
                  </h3>
                  <p className="text-sm text-purple-700">
                    Design mais limpo e intuitivo para melhor experiência
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
