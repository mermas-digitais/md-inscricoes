"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput } from "@/components/ui/custom-input";
import { Header } from "@/components/header";
import EscolaSelector from "@/components/ui/escola-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, GraduationCap, Users, MapPin, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useZodForm } from "@/hooks/use-zod-form";
import { z } from "zod";

interface FormData {
  email: string;
  nome: string;
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
  escola: string; // Novo campo para a escola
}

// Schemas de validação Zod para cada step
const step1Schema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cpf: z.string().min(14, "CPF deve estar completo"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
});

// Função para validar CPF brasileiro
const isValidCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, "");

  if (numbers.length !== 11) return false;

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;

  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(numbers[9]) !== digit1) return false;

  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;

  return parseInt(numbers[10]) === digit2;
};

// Schema personalizado para step 1 com validação de CPF duplicado e idade
const createStep1SchemaWithCPFValidation = (cpfExists: boolean) => {
  return z.object({
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    cpf: z
      .string()
      .min(14, "CPF deve estar completo")
      .refine((val) => {
        // Primeiro verificar se é um CPF válido
        return isValidCPF(val);
      }, "CPF inválido")
      .refine((val) => {
        // Se chegou aqui, o CPF é válido, agora verificar se já existe
        // Só retorna false se o CPF existe no banco
        return !cpfExists;
      }, "Já existe uma inscrição com este CPF"),
    data_nascimento: z
      .string()
      .min(1, "Data de nascimento é obrigatória")
      .refine((val) => {
        // Validar se a pessoa tem pelo menos 10 anos
        const birthDate = new Date(val);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        // Ajustar idade se ainda não fez aniversário este ano
        const actualAge =
          monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

        return actualAge >= 10;
      }, "Você deve ter pelo menos 10 anos para se inscrever"),
  });
};

const step2Schema = z.object({
  cep: z.string().min(9, "CEP deve estar completo"),
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().min(2, "Estado é obrigatório"),
  complemento: z.string().optional(),
});

const step3Schema = z.object({
  nome_responsavel: z
    .string()
    .min(2, "Nome do responsável deve ter pelo menos 2 caracteres"),
  telefone_whatsapp: z.string().min(15, "Telefone deve estar completo"),
});

const step4Schema = z.object({
  escolaridade: z.string().min(1, "Escolaridade é obrigatória"),
  ano_escolar: z.string().min(1, "Ano escolar é obrigatório"),
  escola: z.string().min(2, "Nome da escola é obrigatório"),
});

export default function InscricaoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: searchParams.get("email") || "",
    nome: "",
    cpf: "",
    data_nascimento: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    nome_responsavel: "",
    telefone_whatsapp: "",
    escolaridade: "",
    ano_escolar: "",
    escola: "", // Novo campo para a escola
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [generoConfirmado, setGeneroConfirmado] = useState(false);
  const [cpfExists, setCpfExists] = useState(false);
  const [cepNaoEncontrado, setCepNaoEncontrado] = useState(false);

  // Schema dinâmico para step1 com validação de CPF
  const step1SchemaWithValidation = useMemo(
    () => createStep1SchemaWithCPFValidation(cpfExists),
    [cpfExists]
  );

  // Forms Zod para cada step
  const step1Form = useZodForm(step1SchemaWithValidation, {
    nome: formData.nome,
    cpf: formData.cpf,
    data_nascimento: formData.data_nascimento,
  });

  const step2Form = useZodForm(step2Schema, {
    cep: formData.cep,
    logradouro: formData.logradouro,
    numero: formData.numero,
    complemento: formData.complemento,
    bairro: formData.bairro,
    cidade: formData.cidade,
    estado: formData.estado,
  });

  const step3Form = useZodForm(step3Schema, {
    nome_responsavel: formData.nome_responsavel,
    telefone_whatsapp: formData.telefone_whatsapp,
  });

  const step4Form = useZodForm(step4Schema, {
    escolaridade: formData.escolaridade,
    ano_escolar: formData.ano_escolar,
    escola: formData.escola,
  });

  // Sincronizar os dados do form quando o formData mudar (sem marcar como touched)
  useEffect(() => {
    step1Form.setFieldValue("nome", formData.nome, false);
    step1Form.setFieldValue("cpf", formData.cpf, false);
    step1Form.setFieldValue("data_nascimento", formData.data_nascimento, false);
  }, [formData.nome, formData.cpf, formData.data_nascimento]);

  // Sincronizar step2Form
  useEffect(() => {
    step2Form.setFieldValue("cep", formData.cep, false);
    step2Form.setFieldValue("logradouro", formData.logradouro, false);
    step2Form.setFieldValue("numero", formData.numero, false);
    step2Form.setFieldValue("complemento", formData.complemento, false);
    step2Form.setFieldValue("bairro", formData.bairro, false);
    step2Form.setFieldValue("cidade", formData.cidade, false);
    step2Form.setFieldValue("estado", formData.estado, false);
  }, [
    formData.cep,
    formData.logradouro,
    formData.numero,
    formData.complemento,
    formData.bairro,
    formData.cidade,
    formData.estado,
  ]);

  // Sincronizar step3Form
  useEffect(() => {
    step3Form.setFieldValue(
      "nome_responsavel",
      formData.nome_responsavel,
      false
    );
    step3Form.setFieldValue(
      "telefone_whatsapp",
      formData.telefone_whatsapp,
      false
    );
  }, [formData.nome_responsavel, formData.telefone_whatsapp]);

  // Sincronizar step4Form
  useEffect(() => {
    step4Form.setFieldValue("escolaridade", formData.escolaridade, false);
    step4Form.setFieldValue("ano_escolar", formData.ano_escolar, false);
    step4Form.setFieldValue("escola", formData.escola, false);
  }, [formData.escolaridade, formData.ano_escolar, formData.escola]);

  // Revalidar quando o schema mudar (cpfExists)
  useEffect(() => {
    // Forçar revalidação com os dados atuais
    step1Form.setFieldValue("nome", formData.nome, false);
    step1Form.setFieldValue("cpf", formData.cpf, false);
    step1Form.setFieldValue("data_nascimento", formData.data_nascimento, false);
  }, [step1SchemaWithValidation]);

  // Função para verificar se CPF já existe com debounce
  const checkCPFExists = async (cpf: string) => {
    if (cpf.replace(/\D/g, "").length === 11) {
      try {
        const response = await fetch("/api/check-cpf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: cpf }), // Enviar CPF formatado
        });
        const data = await response.json();
        setCpfExists(data.exists);
        return data.exists;
      } catch (error) {
        console.error("Erro ao verificar CPF:", error);
        setCpfExists(false);
        return false;
      }
    } else {
      setCpfExists(false);
      return false;
    }
  };

  // Debounce para verificação de CPF
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.cpf && formData.cpf.replace(/\D/g, "").length === 11) {
        checkCPFExists(formData.cpf);
      }
    }, 300); // 300ms de delay

    return () => clearTimeout(timer);
  }, [formData.cpf]);

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  const fetchAddressByCEP = async (cep: string) => {
    // Não buscar se o usuário marcou que não encontrou o CEP
    if (cepNaoEncontrado || cep.replace(/\D/g, "").length !== 8) return;

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`
      );
      const data = await response.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          logradouro: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
  };

  const handleInputChange = async (field: keyof FormData, value: string) => {
    if (field === "cpf") {
      value = formatCPF(value);
      // CPF será verificado automaticamente pelo useEffect com debounce
    } else if (field === "telefone_whatsapp") {
      value = formatPhone(value);
    } else if (field === "cep") {
      value = formatCEP(value);
      if (value.replace(/\D/g, "").length === 8 && !cepNaoEncontrado) {
        fetchAddressByCEP(value);
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // Atualizar os forms Zod correspondentes (marcando como touched)
    if (["nome", "cpf", "data_nascimento"].includes(field)) {
      step1Form.setFieldValue(
        field as keyof typeof step1Schema.shape,
        value,
        true
      );
    } else if (
      [
        "cep",
        "logradouro",
        "numero",
        "complemento",
        "bairro",
        "cidade",
        "estado",
      ].includes(field)
    ) {
      step2Form.setFieldValue(
        field as keyof typeof step2Schema.shape,
        value,
        true
      );
    } else if (["nome_responsavel", "telefone_whatsapp"].includes(field)) {
      step3Form.setFieldValue(
        field as keyof typeof step3Schema.shape,
        value,
        true
      );
    } else if (["escolaridade", "ano_escolar"].includes(field)) {
      step4Form.setFieldValue(
        field as keyof typeof step4Schema.shape,
        value,
        true
      );
    }

    // Reset ano_escolar when escolaridade changes
    if (field === "escolaridade") {
      setFormData((prev) => ({ ...prev, ano_escolar: "" }));
      step4Form.setFieldValue("ano_escolar", "", false);
    }
  };

  const handleCepNaoEncontrado = (checked: boolean) => {
    setCepNaoEncontrado(checked);
    if (checked) {
      // Limpar campos de endereço para preenchimento manual
      setFormData((prev) => ({
        ...prev,
        logradouro: "",
        bairro: "",
        cidade: "",
        estado: "",
      }));
      step2Form.setFieldValue("logradouro", "", false);
      step2Form.setFieldValue("bairro", "", false);
      step2Form.setFieldValue("cidade", "", false);
      step2Form.setFieldValue("estado", "", false);
    }
  };

  const getAnoEscolarOptions = () => {
    if (formData.escolaridade === "Ensino Fundamental 2") {
      return ["6º ano", "7º ano", "8º ano", "9º ano"];
    } else if (formData.escolaridade === "Ensino Médio") {
      return ["1º ano", "2º ano", "3º ano"];
    }
    return [];
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/inscricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const { curso } = await response.json();
        router.push(
          `/confirmacao?curso=${encodeURIComponent(
            curso
          )}&email=${encodeURIComponent(formData.email)}`
        );
      } else {
        throw new Error("Erro ao salvar inscrição");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar sua inscrição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          step1Form.formState.isValid &&
          generoConfirmado &&
          formData.nome &&
          formData.cpf &&
          formData.data_nascimento
        );
      case 2:
        return step2Form.formState.isValid;
      case 3:
        return step3Form.formState.isValid;
      case 4:
        return step4Form.formState.isValid;
      case 5:
        // Step 5 é sempre válido pois é apenas visualização
        return true;
      default:
        return false;
    }
  };

  return (
    <>
      {/* Layout padrão - estrutura de camadas que ocupa 100% da viewport */}
      <div className="min-h-screen relative overflow-hidden">
        {/* Camada 1: Fundo roxo - sempre 100% da altura */}
        <div className="absolute inset-0 w-full h-full bg-[#9854CB]"></div>

        {/* Camada 2: Imagem de fundo fixa no topo */}
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

        {/* Camada 3: Conteúdo scrollável - ocupa mesma altura que o fundo */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Espaçamento superior maior para posicionar o card mais abaixo */}
          <div className="h-62 sm:h-56 lg:h-64 flex-shrink-0"></div>

          {/* Container do conteúdo principal */}
          <div className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 py-8 pb-32">
            <div className="w-full max-w-2xl">
              <div className="rounded-2xl bg-white shadow-lg px-4 sm:px-6 pt-6 pb-6 font-poppins">
                {/* Header do formulário */}
                <div className="text-center mb-6">
                  <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                    FORMULÁRIO DE INSCRIÇÃO
                  </div>
                  <p className="text-gray-600 mt-2 text-sm font-poppins">
                    PASSO {currentStep} DE 5
                  </p>
                </div>

                {/* Formulário */}
                <div className="space-y-8">
                  {/* Step 1: Dados Pessoais */}
                  {currentStep === 1 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div>
                            <CardTitle className="text-sm font-semibold text-[#FF4A97] tracking-wider mb-2 text-left font-poppins">
                              SOBRE VOCÊ
                            </CardTitle>
                            <CardDescription className="text-3xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-4 text-left font-poppins">
                              Conte um pouco sobre quem você é
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <CustomInput
                          type="text"
                          value={formData.nome}
                          onChange={(e) =>
                            handleInputChange("nome", e.target.value)
                          }
                          placeholder="Seu nome completo"
                          label="Nome completo"
                          isRequired
                          error={
                            step1Form.formState.touched.nome
                              ? step1Form.formState.errors.nome
                              : undefined
                          }
                        />
                        <CustomInput
                          type="text"
                          value={formData.cpf}
                          onChange={(e) =>
                            handleInputChange("cpf", e.target.value)
                          }
                          placeholder="000.000.000-00"
                          label="CPF"
                          maxLength={14}
                          isRequired
                          error={
                            step1Form.formState.touched.cpf
                              ? step1Form.formState.errors.cpf
                              : undefined
                          }
                        />
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 font-poppins mb-1">
                            Data de nascimento
                            <span className="text-[#FF4A97] ml-1">*</span>
                          </label>
                          <p className="text-xs text-gray-500 font-poppins mb-2">
                            Clique no campo abaixo para selecionar sua data de
                            nascimento
                          </p>
                          <input
                            type="date"
                            value={formData.data_nascimento}
                            onChange={(e) =>
                              handleInputChange(
                                "data_nascimento",
                                e.target.value
                              )
                            }
                            className={`w-full rounded-[65px] px-4 sm:px-6 py-3 sm:py-4 bg-[#F8F8F8] text-base text-gray-800 border-2 border-transparent transition-all duration-200 focus:ring-0 focus:outline-none focus:border-[#FF4A97] focus:bg-white font-poppins disabled:opacity-50 disabled:cursor-not-allowed text-base min-h-[48px] ${
                              step1Form.formState.touched.data_nascimento &&
                              step1Form.formState.errors.data_nascimento
                                ? "border-red-500 bg-red-50"
                                : ""
                            }`}
                            required
                          />
                          {step1Form.formState.touched.data_nascimento &&
                            step1Form.formState.errors.data_nascimento && (
                              <p className="text-red-500 text-sm mt-1 font-poppins">
                                {step1Form.formState.errors.data_nascimento}
                              </p>
                            )}
                        </div>
                        <div className="flex items-start space-x-4 mt-6 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                          <div className="flex-shrink-0">
                            <input
                              id="generoConfirmado"
                              type="checkbox"
                              checked={generoConfirmado}
                              onChange={(e) =>
                                setGeneroConfirmado(e.target.checked)
                              }
                              className="w-5 h-5 mt-1 text-[#FF4A97] bg-white border-2 border-gray-300 rounded focus:ring-[#FF4A97] focus:ring-2 focus:ring-offset-2 checked:bg-[#FF4A97] checked:border-[#ffff]"
                              required
                            />
                          </div>
                          <label
                            htmlFor="generoConfirmado"
                            className="cursor-pointer select-none text-sm font-poppins text-gray-700 leading-relaxed flex-1"
                          >
                            Confirmo que <b>não</b> me identifico com o gênero
                            masculino <span className="text-red-500">*</span>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 2: Endereço */}
                  {currentStep === 2 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div>
                            <CardTitle className="text-sm font-semibold text-[#FF4A97] tracking-wider mb-2 text-left font-poppins">
                              ENDEREÇO
                            </CardTitle>
                            <CardDescription className="text-3xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-4 text-left font-poppins">
                              Conta pra gente onde você mora
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <CustomInput
                          type="text"
                          value={formData.cep}
                          onChange={(e) =>
                            handleInputChange("cep", e.target.value)
                          }
                          placeholder="00000-000"
                          label="CEP"
                          maxLength={9}
                          isRequired
                          disabled={cepNaoEncontrado}
                          error={
                            step2Form.formState.touched.cep
                              ? step2Form.formState.errors.cep
                              : undefined
                          }
                        />

                        <div className="flex items-center space-x-2 mb-4">
                          <input
                            id="cepNaoEncontrado"
                            type="checkbox"
                            checked={cepNaoEncontrado}
                            onChange={(e) =>
                              handleCepNaoEncontrado(e.target.checked)
                            }
                            className="w-4 h-4 text-[#FF4A97] bg-white border-2 border-gray-300 rounded focus:ring-[#FF4A97] focus:ring-2 focus:ring-offset-2 checked:bg-[#FF4A97] checked:border-[#FF4A97]"
                          />
                          <label
                            htmlFor="cepNaoEncontrado"
                            className="cursor-pointer select-none text-sm font-poppins text-gray-700"
                          >
                            Não encontrei meu CEP
                          </label>
                        </div>

                        <CustomInput
                          type="text"
                          value={formData.logradouro}
                          onChange={(e) =>
                            handleInputChange("logradouro", e.target.value)
                          }
                          placeholder="Rua, avenida, etc."
                          label="Rua/Logradouro"
                          isRequired
                          disabled={
                            !cepNaoEncontrado &&
                            formData.cep.replace(/\D/g, "").length !== 8
                          }
                          error={
                            step2Form.formState.touched.logradouro
                              ? step2Form.formState.errors.logradouro
                              : undefined
                          }
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <CustomInput
                            type="text"
                            value={formData.numero}
                            onChange={(e) =>
                              handleInputChange("numero", e.target.value)
                            }
                            placeholder="123"
                            label="Número"
                            isRequired
                            error={
                              step2Form.formState.touched.numero
                                ? step2Form.formState.errors.numero
                                : undefined
                            }
                          />
                          <CustomInput
                            type="text"
                            value={formData.complemento}
                            onChange={(e) =>
                              handleInputChange("complemento", e.target.value)
                            }
                            placeholder="Apt, sala, etc."
                            label="Complemento"
                            error={
                              step2Form.formState.touched.complemento
                                ? step2Form.formState.errors.complemento
                                : undefined
                            }
                          />
                        </div>

                        <CustomInput
                          type="text"
                          value={formData.bairro}
                          onChange={(e) =>
                            handleInputChange("bairro", e.target.value)
                          }
                          placeholder="Nome do bairro"
                          label="Bairro"
                          isRequired
                          disabled={
                            !cepNaoEncontrado &&
                            formData.cep.replace(/\D/g, "").length !== 8
                          }
                          error={
                            step2Form.formState.touched.bairro
                              ? step2Form.formState.errors.bairro
                              : undefined
                          }
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <CustomInput
                            type="text"
                            value={formData.cidade}
                            onChange={(e) =>
                              handleInputChange("cidade", e.target.value)
                            }
                            placeholder="Nome da cidade"
                            label="Cidade"
                            isRequired
                            disabled={
                              !cepNaoEncontrado &&
                              formData.cep.replace(/\D/g, "").length !== 8
                            }
                            error={
                              step2Form.formState.touched.cidade
                                ? step2Form.formState.errors.cidade
                                : undefined
                            }
                          />
                          <CustomInput
                            type="text"
                            value={formData.estado}
                            onChange={(e) =>
                              handleInputChange("estado", e.target.value)
                            }
                            placeholder="SP"
                            label="Estado"
                            maxLength={2}
                            isRequired
                            disabled={
                              !cepNaoEncontrado &&
                              formData.cep.replace(/\D/g, "").length !== 8
                            }
                            error={
                              step2Form.formState.touched.estado
                                ? step2Form.formState.errors.estado
                                : undefined
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 3: Dados do Responsável */}
                  {currentStep === 3 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div>
                            <CardTitle className="text-sm font-semibold text-[#FF4A97] tracking-wider mb-2 text-left font-poppins">
                              SEU RESPONSÁVEL
                            </CardTitle>
                            <CardDescription className="text-3xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-4 text-left font-poppins">
                              Dados do seu pai, mãe ou responsável
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <CustomInput
                          type="text"
                          value={formData.nome_responsavel}
                          onChange={(e) =>
                            handleInputChange(
                              "nome_responsavel",
                              e.target.value
                            )
                          }
                          placeholder="Nome completo do responsável"
                          label="Nome completo do responsável"
                          isRequired
                          error={
                            step3Form.formState.touched.nome_responsavel
                              ? step3Form.formState.errors.nome_responsavel
                              : undefined
                          }
                        />
                        <CustomInput
                          type="text"
                          value={formData.telefone_whatsapp}
                          onChange={(e) =>
                            handleInputChange(
                              "telefone_whatsapp",
                              e.target.value
                            )
                          }
                          placeholder="(11) 99999-9999"
                          label="Número do WhatsApp do responsável"
                          maxLength={15}
                          isRequired
                          error={
                            step3Form.formState.touched.telefone_whatsapp
                              ? step3Form.formState.errors.telefone_whatsapp
                              : undefined
                          }
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 4: Escolaridade */}
                  {currentStep === 4 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div>
                            <CardTitle className="text-sm font-semibold text-[#FF4A97] tracking-wider mb-2 text-left font-poppins">
                              SUA VIDA ESCOLAR
                            </CardTitle>
                            <CardDescription className="text-3xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-4 text-left font-poppins">
                              Conte sobre seus estudos
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 font-poppins mb-2">
                            Escolaridade{" "}
                            <span className="text-[#FF4A97]">*</span>
                          </label>
                          <Select
                            value={formData.escolaridade}
                            onValueChange={(value) =>
                              handleInputChange("escolaridade", value)
                            }
                          >
                            <SelectTrigger className="w-full rounded-[65px] px-4 sm:px-6 py-3 sm:py-4 bg-[#F8F8F8] text-base text-gray-800 border-2 border-transparent transition-all duration-200 focus:ring-0 focus:outline-none focus:border-[#FF4A97] focus:bg-white font-poppins disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-[56px]">
                              <SelectValue
                                placeholder="Selecione sua escolaridade"
                                className="text-[#C0C0C0] font-poppins"
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                              <SelectItem
                                value="Ensino Fundamental 2"
                                className="py-3 px-4 hover:bg-pink-50 focus:bg-pink-50 cursor-pointer font-poppins"
                              >
                                Ensino Fundamental 2
                              </SelectItem>
                              <SelectItem
                                value="Ensino Médio"
                                className="py-3 px-4 hover:bg-pink-50 focus:bg-pink-50 cursor-pointer font-poppins"
                              >
                                Ensino Médio
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {step4Form.formState.touched.escolaridade &&
                            step4Form.formState.errors.escolaridade && (
                              <p className="text-red-500 text-sm mt-1 font-poppins">
                                {step4Form.formState.errors.escolaridade}
                              </p>
                            )}
                        </div>

                        {formData.escolaridade && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 font-poppins mb-2">
                              Ano Escolar{" "}
                              <span className="text-[#FF4A97]">*</span>
                            </label>
                            <Select
                              value={formData.ano_escolar}
                              onValueChange={(value) =>
                                handleInputChange("ano_escolar", value)
                              }
                            >
                              <SelectTrigger className="w-full rounded-[65px] px-4 sm:px-6 py-3 sm:py-4 bg-[#F8F8F8] text-base text-gray-800 border-2 border-transparent transition-all duration-200 focus:ring-0 focus:outline-none focus:border-[#FF4A97] focus:bg-white font-poppins disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-[56px]">
                                <SelectValue
                                  placeholder="Selecione seu ano escolar"
                                  className="text-[#C0C0C0] font-poppins"
                                />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                                {getAnoEscolarOptions().map((ano) => (
                                  <SelectItem
                                    key={ano}
                                    value={ano}
                                    className="py-3 px-4 hover:bg-pink-50 focus:bg-pink-50 cursor-pointer font-poppins"
                                  >
                                    {ano}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {step4Form.formState.touched.ano_escolar &&
                              step4Form.formState.errors.ano_escolar && (
                                <p className="text-red-500 text-sm mt-1 font-poppins">
                                  {step4Form.formState.errors.ano_escolar}
                                </p>
                              )}
                          </div>
                        )}

                        {/* Campo da Escola */}
                        <div>
                          <EscolaSelector
                            value={formData.escola}
                            onChange={(escola) =>
                              handleInputChange("escola", escola)
                            }
                            placeholder="Digite o nome da sua escola..."
                            escolaridade={formData.escolaridade}
                            error={
                              step4Form.formState.touched.escola &&
                              step4Form.formState.errors.escola
                                ? step4Form.formState.errors.escola
                                : undefined
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 5: Resumo */}
                  {currentStep === 5 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div>
                            <CardTitle className="text-sm font-semibold text-[#FF4A97] tracking-wider mb-2 text-left font-poppins">
                              RESUMO
                            </CardTitle>
                            <CardDescription className="text-3xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-4 text-left font-poppins">
                              Confirme suas informações
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Dados Pessoais */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-[#6C2EB5] mb-3 font-poppins">
                            Dados Pessoais
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                Nome:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins">
                                {formData.nome}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                CPF:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins">
                                {formData.cpf}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                Email:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins">
                                {formData.email}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                Data de Nascimento:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins">
                                {formData.data_nascimento
                                  ? new Date(
                                      formData.data_nascimento
                                    ).toLocaleDateString("pt-BR")
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Endereço */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-[#6C2EB5] mb-3 font-poppins">
                            Endereço
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                CEP:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins">
                                {formData.cep}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                Endereço:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins text-right">
                                {formData.logradouro}, {formData.numero}
                                {formData.complemento &&
                                  `, ${formData.complemento}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                Bairro:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins">
                                {formData.bairro}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                Cidade/Estado:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins">
                                {formData.cidade}/{formData.estado}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Responsável */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-[#6C2EB5] mb-3 font-poppins">
                            Responsável
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                Nome:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins">
                                {formData.nome_responsavel}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                WhatsApp:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins">
                                {formData.telefone_whatsapp}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Escolaridade */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-[#6C2EB5] mb-3 font-poppins">
                            Vida Escolar
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                Escolaridade:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins">
                                {formData.escolaridade}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                Ano Escolar:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins">
                                {formData.ano_escolar}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-600 font-poppins">
                                Escola:
                              </span>
                              <span className="text-sm text-gray-800 font-poppins">
                                {formData.escola}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Aviso de revisão */}
                        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                          <p className="text-sm text-gray-700 font-poppins text-center">
                            <strong>Atenção:</strong> Revise todas as
                            informações acima. Após finalizar a inscrição, não
                            será possível alterá-las.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    {currentStep > 1 && (
                      <CustomButton
                        type="button"
                        variant="ghost"
                        onClick={() => setCurrentStep(currentStep - 1)}
                      >
                        Voltar
                      </CustomButton>
                    )}
                    {currentStep < 5 ? (
                      <CustomButton
                        type="button"
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={!isStepValid(currentStep)}
                        className="ml-auto"
                      >
                        Próximo
                      </CustomButton>
                    ) : (
                      <CustomButton
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isStepValid(currentStep) || isLoading}
                        isLoading={isLoading}
                        loadingText="Salvando..."
                        className="ml-auto"
                      >
                        Finalizar inscrição
                      </CustomButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer com mais espaçamento */}
          <div className="flex-shrink-0 pb-8 pt-16">
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
