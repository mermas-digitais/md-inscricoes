"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { CustomInput } from "@/components/ui/custom-input";
import { CustomButton } from "@/components/ui/custom-button";
import { CodeInput } from "@/components/ui/code-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  ChevronDown,
  AlertTriangle,
  Timer,
  Zap,
  FileText,
  Gamepad2,
  Bot,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { useZodForm } from "@/hooks/use-zod-form";
import { z } from "zod";

export default function MDX25HomePage() {
  const [step, setStep] = useState<"welcome" | "verify">("welcome");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [showRegulationsModal, setShowRegulationsModal] = useState(false);
  // Variável de controle do countdown - pode ser controlada via env
  const [showCountdown] = useState(
    process.env.NEXT_PUBLIC_SHOW_COUNTDOWN !== "false"
  );

  // Estados para countdown
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Hook para detectar scroll e esconder o indicador
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Countdown para deadline das inscrições MDX25
  useEffect(() => {
    // Data de encerramento: 31 de dezembro de 2025 às 23:59
    const deadline = new Date("2025-12-31T23:59:59-03:00"); // UTC-3 (horário de Brasília)

    const updateCountdown = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();

      console.log("MDX25 Deadline:", deadline);
      console.log("Now:", now);
      console.log("Difference (ms):", difference);

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        console.log("MDX25 Countdown:", { days, hours, minutes, seconds });
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        console.log("MDX25 Deadline passed - setting zeros");
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Atualizar imediatamente
    updateCountdown();

    // Atualizar a cada segundo
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Schema de validação com Zod
  const emailSchema = z.object({
    email: z
      .string()
      .min(1, "Email é obrigatório")
      .email("Digite um email válido"),
  });

  const codeSchema = z.object({
    code: z
      .string()
      .length(6, "Código deve ter 6 dígitos")
      .regex(/^\d{6}$/, "Código deve conter apenas números"),
  });

  // Configuração do formulário com Zod
  const emailForm = useZodForm(emailSchema, {
    email: "",
  });

  const codeForm = useZodForm(codeSchema, {
    code: "",
  });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailForm.validateAllFields()) {
      return;
    }

    const email = emailForm.formState.data.email;
    if (!email) return;

    setIsLoading(true);
    emailForm.setSubmitting(true);

    try {
      const response = await fetch("/api/mdx25/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("verify");
        toast({
          title: "Código enviado!",
          description: "Verifique seu email e digite o código de 6 dígitos.",
        });
      } else {
        throw new Error(data.error || "Erro ao enviar código");
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar o código. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      emailForm.setSubmitting(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!codeForm.validateAllFields()) {
      return;
    }

    const email = emailForm.formState.data.email;
    const code = codeForm.formState.data.code;

    setIsLoading(true);
    codeForm.setSubmitting(true);

    try {
      const response = await fetch("/api/mdx25/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (response.ok) {
        // Redirecionar para o formulário de inscrição MDX25
        window.location.href = `/mdx25/inscricoes?email=${encodeURIComponent(
          email
        )}`;
      } else {
        const data = await response.json();
        throw new Error(data.error || "Código inválido");
      }
    } catch (error) {
      toast({
        title: "Código inválido",
        description:
          error instanceof Error
            ? error.message
            : "Verifique o código e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      codeForm.setSubmitting(false);
    }
  };

  const handleCodeChange = (newCodeDigits: string[]) => {
    setCodeDigits(newCodeDigits);
    const codeString = newCodeDigits.join("");
    setVerificationCode(codeString);
    codeForm.setFieldValue("code", codeString);
  };

  if (step === "verify") {
    return (
      <>
        {/* Countdown e Urgência - Posicionado no topo da página, logo após o Header */}
        {showCountdown && (
          <div className="relative z-50 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 shadow-lg -mt-16 pt-16">
            <div className="max-w-6xl mx-auto px-4 py-4">
              {/* Mensagem de Urgência */}
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
                  <span className="text-white font-bold text-lg tracking-wide animate-pulse">
                    ⚡ MDX25 - ÚLTIMAS HORAS ⚡
                  </span>
                  <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
                </div>
                <p className="text-white/90 text-sm font-medium">
                  As inscrições encerram <strong>31/12/2025 às 23:59</strong> •
                  Apenas{" "}
                  <span className="bg-yellow-400 text-black px-2 py-1 rounded-full font-bold text-xs whitespace-nowrap">
                    100 VAGAS
                  </span>{" "}
                  disponíveis!
                </p>
              </div>

              {/* Countdown */}
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Timer className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold text-sm tracking-wide">
                    TEMPO RESTANTE
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <div className="text-2xl font-bold text-white tabular-nums animate-pulse">
                      {timeLeft.days.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-white/80 font-medium mt-1">
                      DIAS
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <div className="text-2xl font-bold text-white tabular-nums animate-pulse">
                      {timeLeft.hours.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-white/80 font-medium mt-1">
                      HORAS
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <div className="text-2xl font-bold text-white tabular-nums animate-pulse">
                      {timeLeft.minutes.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-white/80 font-medium mt-1">
                      MIN
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <div className="text-2xl font-bold text-white tabular-nums animate-pulse">
                      {timeLeft.seconds.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-white/80 font-medium mt-1">
                      SEG
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <div className="inline-flex items-center gap-2 bg-yellow-400/90 text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-yellow-300/95 transition-all duration-300 shadow-lg shadow-yellow-400/30">
                    <AlertTriangle className="w-4 h-4" />
                    INSCREVA-SE AGORA NO MDX25!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout padrão - estrutura de camadas que ocupa 100% da viewport */}
        <div className="min-h-screen relative overflow-hidden">
          {/* Camada 1: Fundo roxo - sempre cobre todo o espaço incluindo scroll */}
          <div className="absolute inset-0 w-full min-h-[120vh] bg-[#9854CB]"></div>

          {/* Camada 2: Imagem de fundo fixa no topo respeitando o header - altura reduzida */}
          <div className="absolute top-0 left-0 right-0 h-[120vh]">
            <img
              src="/assets/images/email_asset.svg"
              alt="Fundo da verificação MDX25"
              className="absolute top-0 left-0 w-full h-full object-contain object-top pointer-events-none select-none"
              style={{
                transform: "scale(1.0)",
                willChange: "transform",
              }}
              aria-hidden="true"
            />
          </div>

          {/* Camada 3: Conteúdo scrollável - altura reduzida */}
          <div className="relative z-10 min-h-[120vh] flex flex-col">
            {/* Espaçamento para posicionar o card no meio da tela */}
            <div className="h-[40vh] sm:h-[35vh] lg:h-[40vh] flex-shrink-0"></div>

            {/* Container do conteúdo principal */}
            <div className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 py-8 pb-12">
              <div className="w-full max-w-md">
                <div className="rounded-2xl bg-white shadow-lg px-4 sm:px-6 pt-6 pb-6 font-poppins">
                  <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 text-left font-poppins">
                    MDX25 - ENVIAMOS UM CÓDIGO NO SEU EMAIL
                  </div>
                  <div className="text-3xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-4 text-left font-poppins">
                    Digite o código que você recebeu
                  </div>
                  <form
                    onSubmit={handleVerificationSubmit}
                    className="flex flex-col gap-6 "
                  >
                    <CodeInput
                      value={codeDigits}
                      onChange={handleCodeChange}
                      label="Código de 6 dígitos:"
                      error={codeForm.formState.errors.code}
                    />
                    <CustomButton
                      type="submit"
                      disabled={
                        !codeForm.formState.data.code ||
                        codeForm.formState.data.code.length !== 6 ||
                        isLoading
                      }
                      isLoading={isLoading || codeForm.formState.isSubmitting}
                      loadingText="Verificando..."
                    >
                      Enviar
                    </CustomButton>
                    <CustomButton
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setStep("welcome");
                        setVerificationCode("");
                        setCodeDigits(["", "", "", "", "", ""]);
                        codeForm.resetForm();
                      }}
                    >
                      Voltar
                    </CustomButton>
                  </form>
                </div>
              </div>
            </div>

            {/* Footer com espaçamento reduzido */}
            <div className="flex-shrink-0 mt-auto pb-8 pt-4">
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
    <>
      {/* Script do Jivo Chat */}
      <script
        src="//code.jivosite.com/widget/oCHLatEDsf"
        async
        suppressHydrationWarning
      />

      {/* Countdown e Urgência - Posicionado no topo da página, logo após o Header */}
      {showCountdown && (
        <div className="relative z-50 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 shadow-lg -mt-16 pt-16">
          <div className="max-w-6xl mx-auto px-4 py-4">
            {/* Mensagem de Urgência */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span className="text-white font-bold text-lg tracking-wide animate-pulse">
                  ⚡ MDX25 - ÚLTIMAS HORAS ⚡
                </span>
                <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
              </div>
              <p className="text-white/90 text-sm font-medium">
                As inscrições encerram <strong>31/12/2025 às 23:59</strong> •
                Apenas{" "}
                <span className="bg-yellow-400 text-black px-2 py-1 rounded-full font-bold text-xs whitespace-nowrap">
                  100 VAGAS
                </span>{" "}
                disponíveis!
              </p>
            </div>

            {/* Countdown */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Timer className="w-5 h-5 text-white" />
                <span className="text-white font-semibold text-sm tracking-wide">
                  TEMPO RESTANTE
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="text-2xl font-bold text-white tabular-nums animate-pulse">
                    {timeLeft.days.toString().padStart(2, "0")}
                  </div>
                  <div className="text-xs text-white/80 font-medium mt-1">
                    DIAS
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="text-2xl font-bold text-white tabular-nums animate-pulse">
                    {timeLeft.hours.toString().padStart(2, "0")}
                  </div>
                  <div className="text-xs text-white/80 font-medium mt-1">
                    HORAS
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="text-2xl font-bold text-white tabular-nums animate-pulse">
                    {timeLeft.minutes.toString().padStart(2, "0")}
                  </div>
                  <div className="text-xs text-white/80 font-medium mt-1">
                    MIN
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="text-2xl font-bold text-white tabular-nums animate-pulse">
                    {timeLeft.seconds.toString().padStart(2, "0")}
                  </div>
                  <div className="text-xs text-white/80 font-medium mt-1">
                    SEG
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-2 bg-yellow-400/90 text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-yellow-300/95 transition-all duration-300 shadow-lg shadow-yellow-400/30">
                  <AlertTriangle className="w-4 h-4" />
                  INSCREVA-SE AGORA NO MDX25!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Layout padrão - estrutura de camadas que ocupa 100% da viewport */}
      <div className="min-h-screen relative overflow-hidden">
        {/* Camada 1: Fundo roxo - sempre cobre todo o espaço incluindo scroll */}
        <div className="absolute inset-0 w-full h-[200vh] bg-[#9854CB]"></div>

        {/* Camada 2: Imagem de fundo fixa no topo respeitando o header - altura expandida */}
        <div className="absolute top-0 left-0 right-0 h-[200vh]">
          <img
            src="/assets/images/mdx25/home_asset.svg"
            alt="Fundo da página inicial MDX25"
            className="absolute top-0 left-0 w-full h-full object-contain object-top pointer-events-none select-none"
            style={{
              transform: "scale(1.0)",
              willChange: "transform",
            }}
            aria-hidden="true"
          />
        </div>

        {/* Camada 3: Conteúdo scrollável - ocupa mesma altura que o fundo */}
        <div className="relative z-10 min-h-[200vh] flex flex-col">
          {/* Indicador de Scroll Flutuante */}
          {showScrollIndicator && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF4A97] via-[#C769E3] to-[#6C2EB5] rounded-full blur-xl opacity-40 animate-pulse"></div>

                {/* Main indicator */}
                <div className="relative animate-bounce">
                  <div className="bg-gradient-to-r from-[#FF4A97]/20 via-[#C769E3]/30 to-[#6C2EB5]/20 backdrop-blur-md rounded-full px-6 py-4 shadow-2xl border border-white/30">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-white drop-shadow-lg font-poppins">
                          Role para baixo
                        </span>
                        <div className="flex gap-1 mt-1">
                          <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce shadow-sm"></div>
                          <div
                            className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce shadow-sm"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce shadow-sm"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                      <div className="relative">
                        <ChevronDown
                          className="w-6 h-6 text-white drop-shadow-lg animate-bounce"
                          style={{ animationDelay: "0.5s" }}
                        />
                        <ChevronDown
                          className="absolute top-2 w-6 h-6 text-white/40 animate-bounce"
                          style={{ animationDelay: "0.7s" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Espaçamento superior maior para posicionar o card mais embaixo */}
          <div className="h-[calc(60vh+550px)] sm:h-[calc(70vh+550px)] md:h-[calc(75vh+550px)] lg:h-[calc(80vh+550px)] xl:h-[calc(85vh+550px)] flex-shrink-0"></div>

          {/* Container do conteúdo principal */}
          <div className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 py-8 pb-4 bg-[#9754CB00]">
            <div className="w-full max-w-md">
              {/* Card de Regulamentos */}
              <div className="mb-6">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-center mb-3">
                    <p className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 text-left font-poppins">
                      Quer saber mais sobre as regras do evento?
                    </p>
                  </div>
                  <CustomButton
                    type="button"
                    onClick={() => setShowRegulationsModal(true)}
                    className="bg-gradient-to-r from-[#6C2EB5] to-[#FF4A97] hover:from-[#5a2599] hover:to-[#e6397a] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <FileText className="w-5 h-5" />
                    Acesse o regulamento
                  </CustomButton>
                </div>
              </div>

              <div className="rounded-2xl bg-white shadow-lg px-6 pt-6 pb-6 font-poppins">
                <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 text-left font-poppins">
                  MDX25 - COMECE SUA INSCRIÇÃO AGORA MESMO!
                </div>
                <div className="text-3xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-4 text-left font-poppins">
                  Vamos começar a inscrição?
                </div>
                <form
                  onSubmit={handleEmailSubmit}
                  className="flex flex-col gap-4"
                >
                  <CustomInput
                    type="email"
                    placeholder="email@exemplo.com"
                    label="Insira seu melhor e-mail:"
                    isRequired
                    {...emailForm.getFieldProps("email")}
                  />
                  <CustomButton
                    type="submit"
                    disabled={!emailForm.formState.data.email || isLoading}
                    isLoading={isLoading || emailForm.formState.isSubmitting}
                    loadingText="Enviando..."
                  >
                    Enviar
                  </CustomButton>
                </form>
              </div>
            </div>
          </div>

          {/* Footer fixo no final da página */}
          <div className="flex-shrink-0 mt-auto pb-4 pt-2 bg-[#9854CB]">
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

      {/* Modal de Regulamentos */}
      <Dialog
        open={showRegulationsModal}
        onOpenChange={setShowRegulationsModal}
      >
        <DialogContent className="max-w-md w-[95vw] bg-gradient-to-br from-white via-pink-50/10 to-purple-50/10 border-0 shadow-2xl">
          <DialogHeader className="border-b border-gray-100/50 pb-6 bg-gradient-to-r from-pink-50/50 via-purple-50/30 to-blue-50/50 -m-6 mb-0 px-6 pt-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#6C2EB5] to-[#FF4A97] flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-[#6C2EB5] to-[#FF4A97] bg-clip-text text-transparent">
                  Regulamentos MDX25
                </span>
                <p className="text-sm font-normal text-gray-600 mt-1">
                  Escolha o regulamento que deseja visualizar
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-6">
            {/* Regulamento de Jogos */}
            <a
              href="/assets/docs/Regulamento-Espaço-Games.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full p-4 bg-gradient-to-r from-[#FF4A97] to-[#C769E3] text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg">Regulamento de Jogos</h3>
                    <p className="text-sm opacity-90">
                      Mostra de Jogos Mermãs Digitais
                    </p>
                  </div>
                </div>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </a>

            {/* Regulamento de Robótica */}
            <a
              href="/assets/docs/Regulamento-Robótica.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full p-4 bg-gradient-to-r from-[#6C2EB5] to-[#4a1a8a] text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg">
                      Regulamento de Robótica
                    </h3>
                    <p className="text-sm opacity-90">
                      2º Desafio de Robótica Mermãs Digitais
                    </p>
                  </div>
                </div>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
