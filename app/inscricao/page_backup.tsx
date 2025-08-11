"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput } from "@/components/ui/custom-input";
import { Header } from "@/components/header";
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
import { User, GraduationCap, Users, MapPin } from "lucide-react";
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

// Schema personalizado para step 1 com validação de CPF duplicado
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
    data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      default:
        return false;
    }
  };

  return (
    <>
      <Header />
      {/* Camada de fundo roxa para toda a página */}
      <div className="absolute inset-0 w-full min-h-[150vh] bg-[#9854CB]"></div>

      {/* Camada da imagem de fundo */}
      <div className="absolute inset-0 w-full min-h-screen overflow-hidden mt-8">
        <img
          src="/assets/images/form_asset.svg"
          alt="Fundo do formulário"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
          style={{
            transform: "scale(1.0)",
            willChange: "transform",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Camada de conteúdo scrollável */}
      <div className="relative z-10 w-full min-h-screen pb-20">
        {/* Card principal do formulário */}
        <div className="flex justify-center pt-[10vh] pb-8">
          <div className="w-[90%] max-w-2xl">
            <div className="rounded-2xl bg-white shadow-lg px-6 pt-6 pb-6 font-['Poppins']">
              {/* Header do formulário */}
              <div className="text-center mb-6">
                <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-['Poppins']">
                  FORMULÁRIO DE INSCRIÇÃO
                </div>
                <p className="text-gray-600 mt-2 text-sm font-['Poppins']">
                  PASSO {currentStep} DE 4
                </p>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Step 1: Dados Pessoais */}
                {currentStep === 1 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div>
                          <CardTitle className="text-sm font-semibold text-[#FF4A97] tracking-wider mb-2 text-left font-['Poppins']">
                            SOBRE VOCÊ
                          </CardTitle>
                          <CardDescription className="text-3xl md:text-3xl font-extrabold text-[#6C2EB5] leading-8 mb-4 text-left font-['Poppins']">
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
                      <CustomInput
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) =>
                          handleInputChange("data_nascimento", e.target.value)
                        }
                        label="Data de nascimento"
                        isRequired
                        error={
                          step1Form.formState.touched.data_nascimento
                            ? step1Form.formState.errors.data_nascimento
                            : undefined
                        }
                      />
                      <div className="flex items-center space-x-2 mt-4">
                        <input
                          id="generoConfirmado"
                          type="checkbox"
                          checked={generoConfirmado}
                          onChange={(e) =>
                            setGeneroConfirmado(e.target.checked)
                          }
                          className="accent-pink-600 w-4 h-4"
                          required
                        />
                        <label
                          htmlFor="generoConfirmado"
                          className="cursor-pointer select-none text-sm font-['Poppins'] text-gray-700"
                        >
                          Confirmo que <b>não</b> me identifico com o gênero
                          masculino
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
                          <CardTitle className="text-sm font-semibold text-[#FF4A97] tracking-wider mb-2 text-left font-['Poppins']">
                            ENDEREÇO
                          </CardTitle>
                          <CardDescription className="text-3xl md:text-3xl font-extrabold text-[#6C2EB5] leading-8 mb-4 text-left font-['Poppins']">
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
                          className="accent-pink-600 w-4 h-4"
                        />
                        <label
                          htmlFor="cepNaoEncontrado"
                          className="cursor-pointer select-none text-sm font-['Poppins'] text-gray-700"
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
                          label="Complemento (opcional)"
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
                  {currentStep < 4 ? (
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
                      type="submit"
                      disabled={!isStepValid(currentStep) || isLoading}
                      isLoading={isLoading}
                      loadingText="Salvando..."
                      className="ml-auto"
                    >
                      Finalizar inscrição
                    </CustomButton>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer com 3 logos */}
        <div className="flex justify-center mt-8 pb-4">
          <div className="w-full max-w-md px-4">
            <img
              src="/assets/images/footer.svg"
              alt="Footer com logos"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </>
  );
}
