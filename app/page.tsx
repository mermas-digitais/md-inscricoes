"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { CustomInput } from "@/components/ui/custom-input";
import { CustomButton } from "@/components/ui/custom-button";
import { CodeInput } from "@/components/ui/code-input";
import { Loader2, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { useZodForm } from "@/hooks/use-zod-form";
import { z } from "zod";

export default function HomePage() {
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
      const response = await fetch("/api/send-verification", {
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
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (response.ok) {
        // Redirecionar para o formulário de inscrição
        window.location.href = `/inscricao?email=${encodeURIComponent(email)}`;
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
        {/* Layout padrão - estrutura de camadas que ocupa 100% da viewport */}
        <div className="min-h-screen relative overflow-hidden">
          {/* Camada 1: Fundo roxo - sempre cobre todo o espaço incluindo scroll */}
          <div className="absolute inset-0 w-full min-h-[120vh] bg-[#9854CB]"></div>

          {/* Camada 2: Imagem de fundo fixa no topo respeitando o header - altura reduzida */}
          <div className="absolute top-0 left-0 right-0 h-[120vh]">
            <img
              src="/assets/images/email_asset.svg"
              alt="Fundo da verificação"
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
                    ENVIAMOS UM CÓDIGO NO SEU EMAIL
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
      {/* Layout padrão - estrutura de camadas que ocupa 100% da viewport */}
      <div className="min-h-screen relative overflow-hidden">
        {/* Camada 1: Fundo roxo - sempre cobre todo o espaço incluindo scroll */}
        <div className="absolute inset-0 w-full h-[200vh] bg-[#9854CB]"></div>

        {/* Camada 2: Imagem de fundo fixa no topo respeitando o header - altura expandida */}
        <div className="absolute top-0 left-0 right-0 h-[200vh]">
          <img
            src="/assets/images/home_asset.svg"
            alt="Fundo da página inicial"
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

          {/* Espaçamento superior maior para posicionar o card quase no final */}
          <div className="h-[120vh] sm:h-[110vh] lg:h-[120vh] flex-shrink-0"></div>

          {/* Container do conteúdo principal */}
          <div className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 py-8 pb-20">
            <div className="w-full max-w-md">
              <div className="rounded-2xl bg-white shadow-lg px-6 pt-6 pb-6 font-poppins">
                <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 text-left font-poppins">
                  COMECE SUA INSCRIÇÃO AGORA MESMO!
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
          <div className="flex-shrink-0 mt-auto pb-8 pt-8">
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
