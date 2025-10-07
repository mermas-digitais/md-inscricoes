"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import EscolaSelector from "@/components/ui/escola-selector";
import { ModalConfirmEmail } from "@/components/ui/modal-confirm-email";
import { toast } from "@/hooks/use-toast";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

interface ModalNovaInscricaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
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
}

const initialFormData: FormData = {
  nome: "",
  email: "",
  cpf: "",
  data_nascimento: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "RS",
  nome_responsavel: "",
  telefone_whatsapp: "",
  escolaridade: "",
  ano_escolar: "",
  escola: "",
};

export function ModalNovaInscricao({
  isOpen,
  onClose,
  onSuccess,
}: ModalNovaInscricaoProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cepNaoEncontrado, setCepNaoEncontrado] = useState(false);
  const [checkingCPF, setCheckingCPF] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [createdInscription, setCreatedInscription] = useState<any>(null);

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setCepNaoEncontrado(false);
    setCheckingCPF(false);
    setShowEmailModal(false);
    setCreatedInscription(null);
    onClose();
  };

  // Função para verificar CPF duplicado
  const checkCPFDuplicate = async (cpf: string): Promise<boolean> => {
    if (!cpf || cpf.replace(/\D/g, "").length !== 11) return false;

    setCheckingCPF(true);

    try {
      const response = await fetch("/api/check-cpf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpf }), // Enviar CPF formatado
      });
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Erro ao verificar CPF:", error);
      return false;
    } finally {
      setCheckingCPF(false);
    }
  };

  // Função para validar CPF brasileiro (igual ao formulário original)
  const validateCPF = (cpf: string): boolean => {
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

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Validações obrigatórias básicas
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = "Nome deve ter pelo menos 2 caracteres";
    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formData.nome.trim())) {
      newErrors.nome = "Nome deve conter apenas letras e espaços";
    }

    // Validação de email
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Email deve ter um formato válido";
    }

    // Validação robusta de CPF
    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (formData.cpf.replace(/\D/g, "").length !== 11) {
      newErrors.cpf = "CPF deve estar completo";
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    } else {
      // Verificar se CPF já está cadastrado
      const cpfExists = await checkCPFDuplicate(formData.cpf);
      if (cpfExists) {
        newErrors.cpf = "Este CPF já está cadastrado no sistema";
      }
    }

    if (!formData.data_nascimento) {
      newErrors.data_nascimento = "Data de nascimento é obrigatória";
    } else {
      // Validar idade mínima de 10 anos
      const birthDate = new Date(formData.data_nascimento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (actualAge < 10) {
        newErrors.data_nascimento =
          "Você deve ter pelo menos 10 anos para se inscrever";
      }

      if (birthDate > today) {
        newErrors.data_nascimento = "Data de nascimento não pode ser no futuro";
      }
    }

    // Validação de endereço
    if (!formData.cep.trim()) {
      newErrors.cep = "CEP é obrigatório";
    } else if (formData.cep.replace(/\D/g, "").length !== 8) {
      newErrors.cep = "CEP deve ter 8 dígitos";
    }

    if (!formData.logradouro.trim()) {
      newErrors.logradouro = "Logradouro é obrigatório";
    } else if (formData.logradouro.trim().length < 3) {
      newErrors.logradouro = "Logradouro deve ter pelo menos 3 caracteres";
    }

    if (!formData.numero.trim()) {
      newErrors.numero = "Número é obrigatório";
    }

    if (!formData.bairro.trim()) {
      newErrors.bairro = "Bairro é obrigatório";
    } else if (formData.bairro.trim().length < 2) {
      newErrors.bairro = "Bairro deve ter pelo menos 2 caracteres";
    }

    if (!formData.cidade.trim()) {
      newErrors.cidade = "Cidade é obrigatória";
    } else if (formData.cidade.trim().length < 2) {
      newErrors.cidade = "Cidade deve ter pelo menos 2 caracteres";
    }

    if (!formData.estado.trim()) {
      newErrors.estado = "Estado é obrigatório";
    } else if (formData.estado.trim().length !== 2) {
      newErrors.estado = "Estado deve ter 2 caracteres (UF)";
    }

    // Validação de responsável (sempre obrigatório)
    if (!formData.nome_responsavel.trim()) {
      newErrors.nome_responsavel = "Nome do responsável é obrigatório";
    } else if (formData.nome_responsavel.trim().length < 2) {
      newErrors.nome_responsavel =
        "Nome do responsável deve ter pelo menos 2 caracteres";
    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formData.nome_responsavel.trim())) {
      newErrors.nome_responsavel = "Nome deve conter apenas letras e espaços";
    }

    if (!formData.telefone_whatsapp.trim()) {
      newErrors.telefone_whatsapp = "Telefone WhatsApp é obrigatório";
    } else if (formData.telefone_whatsapp.replace(/\D/g, "").length < 10) {
      newErrors.telefone_whatsapp = "Telefone deve estar completo";
    } else if (formData.telefone_whatsapp.replace(/\D/g, "").length > 11) {
      newErrors.telefone_whatsapp = "Telefone inválido";
    }

    // Validação de escolaridade
    if (!formData.escolaridade) {
      newErrors.escolaridade = "Escolaridade é obrigatória";
    }

    if (!formData.ano_escolar) {
      newErrors.ano_escolar = "Ano escolar é obrigatório";
    }

    if (!formData.escola.trim()) {
      newErrors.escola = "Nome da escola é obrigatório";
    } else if (formData.escola.trim().length < 2) {
      newErrors.escola = "Nome da escola deve ter pelo menos 2 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCPF = (value: string): string => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string): string => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const formatCEP = (value: string): string => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue.replace(/(\d{5})(\d)/, "$1-$2");
  };

  // Buscar endereço pelo CEP (igual ao formulário original)
  const fetchAddressByCEP = async (cep: string) => {
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

  // Obter opções de ano escolar (igual ao formulário original)
  const getAnoEscolarOptions = () => {
    if (formData.escolaridade === "Ensino Fundamental 2") {
      return ["6º ano", "7º ano", "8º ano", "9º ano"];
    } else if (formData.escolaridade === "Ensino Médio") {
      return ["1º ano", "2º ano", "3º ano"];
    }
    return [];
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;

    // Aplicar formatação específica
    if (field === "cpf") {
      formattedValue = formatCPF(value);
    } else if (field === "telefone_whatsapp") {
      formattedValue = formatPhone(value);
    } else if (field === "cep") {
      formattedValue = formatCEP(value);
      // Buscar endereço automaticamente quando CEP estiver completo
      if (value.replace(/\D/g, "").length === 8 && !cepNaoEncontrado) {
        fetchAddressByCEP(value);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
      // Reset ano_escolar when escolaridade changes (igual ao formulário original)
      ...(field === "escolaridade" ? { ano_escolar: "" } : {}),
    }));

    // Validação em tempo real
    const newErrors = { ...errors };

    // Validar nome
    if (field === "nome") {
      if (!formattedValue.trim()) {
        newErrors.nome = "Nome é obrigatório";
      } else if (formattedValue.trim().length < 2) {
        newErrors.nome = "Nome deve ter pelo menos 2 caracteres";
      } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formattedValue.trim())) {
        newErrors.nome = "Nome deve conter apenas letras e espaços";
      } else {
        delete newErrors.nome;
      }
    }

    // Validar email
    if (field === "email") {
      if (!formattedValue.trim()) {
        newErrors.email = "Email é obrigatório";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formattedValue.trim())) {
        newErrors.email = "Email deve ter um formato válido";
      } else {
        delete newErrors.email;
      }
    }

    // Validar CPF
    if (field === "cpf") {
      if (!formattedValue.trim()) {
        newErrors.cpf = "CPF é obrigatório";
      } else if (formattedValue.replace(/\D/g, "").length !== 11) {
        newErrors.cpf = "CPF deve estar completo";
      } else if (!validateCPF(formattedValue)) {
        newErrors.cpf = "CPF inválido";
      } else {
        delete newErrors.cpf;
        // Verificar CPF duplicado automaticamente quando CPF estiver válido
        if (formattedValue.replace(/\D/g, "").length === 11) {
          checkCPFDuplicate(formattedValue).then((exists) => {
            if (exists) {
              setErrors((prev) => ({
                ...prev,
                cpf: "Este CPF já está cadastrado no sistema",
              }));
            }
          });
        }
      }
    }

    // Validar telefone
    if (field === "telefone_whatsapp") {
      if (!formattedValue.trim()) {
        newErrors.telefone_whatsapp = "Telefone WhatsApp é obrigatório";
      } else if (formattedValue.replace(/\D/g, "").length < 10) {
        newErrors.telefone_whatsapp = "Telefone deve estar completo";
      } else if (formattedValue.replace(/\D/g, "").length > 11) {
        newErrors.telefone_whatsapp = "Telefone inválido";
      } else {
        delete newErrors.telefone_whatsapp;
      }
    }

    // Validar campos obrigatórios simples
    const requiredFields = {
      nome_responsavel: "Nome do responsável é obrigatório",
      cep: "CEP é obrigatório",
      logradouro: "Logradouro é obrigatório",
      numero: "Número é obrigatório",
      bairro: "Bairro é obrigatório",
      cidade: "Cidade é obrigatória",
      estado: "Estado é obrigatório",
      escola: "Nome da escola é obrigatório",
    };

    if (field in requiredFields) {
      if (!formattedValue.trim()) {
        newErrors[field] = requiredFields[field as keyof typeof requiredFields];
      } else {
        delete newErrors[field];
      }
    }

    setErrors(newErrors);
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
    }
  };

  // Verificar se o formulário é válido
  const isFormValid = () => {
    // Verificar se existem erros
    if (Object.keys(errors).length > 0) {
      return false;
    }

    // Verificar campos obrigatórios
    const requiredFields = [
      "nome",
      "email",
      "cpf",
      "data_nascimento",
      "nome_responsavel",
      "telefone_whatsapp",
      "cep",
      "logradouro",
      "numero",
      "bairro",
      "cidade",
      "estado",
      "escolaridade",
      "escola",
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]?.trim()) {
        return false;
      }
    }

    // Se escolaridade foi selecionada, ano_escolar também é obrigatório
    if (formData.escolaridade && !formData.ano_escolar?.trim()) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/matriculas/create-inscricao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedInscription(data);

        toast({
          title: "Inscrição criada com sucesso!",
          description: `${formData.nome} foi inscrita no curso de ${data.curso} com status ${data.status}.`,
          variant: "success",
        });

        // Mostrar modal de confirmação de email
        setShowEmailModal(true);
      } else {
        const data = await response.json();
        toast({
          title: "Erro ao criar inscrição",
          description: data.error || "Ocorreu um erro inesperado",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para enviar email de confirmação
  const handleSendEmail = async () => {
    if (!createdInscription) return;

    const emailData = {
      email: formData.email,
      nomeCompleto: formData.nome,
      nomeCurso: createdInscription.curso,
      cpf: formData.cpf,
    };

    const confirmationResponse = await fetch("/api/send-confirmation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!confirmationResponse.ok) {
      throw new Error("Falha ao enviar email de confirmação");
    }
  };

  // Função para pular o envio de email
  const handleSkipEmail = () => {
    handleClose();
    onSuccess();
  };

  // Função para finalizar após envio de email
  const handleEmailSent = () => {
    handleClose();
    onSuccess();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-pink-50/10 to-purple-50/10 border-0 shadow-2xl">
          <DialogHeader className="border-b border-gray-100/50 pb-6 bg-gradient-to-r from-pink-50/50 via-purple-50/30 to-blue-50/50 -m-6 mb-0 px-6 pt-6">
            <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
                <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Nova Inscrição
                </span>
                <p className="text-xs md:text-sm font-normal text-gray-600 mt-1">
                  Registre uma nova aluna seguindo o processo completo de
                  inscrição
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 md:space-y-8 py-4 md:py-6"
          >
            {/* Dados Pessoais */}
            <Card className="border border-pink-100/50 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-md">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Dados Pessoais
                  </h3>
                </div>

                <div className="space-y-4 md:space-y-6">
                  {/* Linha 1: Nome */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="nome"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      Nome Completo *
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) =>
                        handleInputChange("nome", e.target.value)
                      }
                      className={`transition-all duration-200 ${
                        errors.nome
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-200 focus:border-pink-300 focus:ring-pink-100"
                      }`}
                      placeholder="Nome completo da aluna"
                      disabled={isLoading}
                    />
                    {errors.nome && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.nome}
                      </p>
                    )}
                  </div>

                  {/* Linha 2: Email e CPF */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700 flex items-center gap-2"
                      >
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className={`transition-all duration-200 ${
                          errors.email
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-200 focus:border-pink-300 focus:ring-pink-100"
                        }`}
                        placeholder="email@exemplo.com"
                        disabled={isLoading}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="cpf"
                        className="text-sm font-medium text-gray-700 flex items-center gap-2"
                      >
                        CPF *
                        {checkingCPF && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        )}
                      </Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) =>
                          handleInputChange("cpf", e.target.value)
                        }
                        className={`transition-all duration-200 ${
                          errors.cpf
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-200 focus:border-pink-300 focus:ring-pink-100"
                        }`}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        disabled={isLoading || checkingCPF}
                      />
                      {errors.cpf && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.cpf}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Linha 3: Data de nascimento */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="data_nascimento"
                      className="text-sm font-medium text-gray-700"
                    >
                      Data de Nascimento *
                    </Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) =>
                        handleInputChange("data_nascimento", e.target.value)
                      }
                      className={`${
                        errors.data_nascimento
                          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                          : "border-gray-300 focus:border-pink-500 focus:ring-pink-100"
                      }`}
                      disabled={isLoading}
                    />
                    {errors.data_nascimento && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.data_nascimento}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card className="border border-blue-100/50 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Endereço
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* CEP */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="cep"
                      className="text-sm font-medium text-gray-700"
                    >
                      CEP *
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) =>
                          handleInputChange("cep", e.target.value)
                        }
                        className={`flex-1 ${
                          errors.cep
                            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                        }`}
                        placeholder="00000-000"
                        maxLength={9}
                        disabled={isLoading || cepNaoEncontrado}
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          id="cepNaoEncontrado"
                          type="checkbox"
                          checked={cepNaoEncontrado}
                          onChange={(e) =>
                            handleCepNaoEncontrado(e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          disabled={isLoading}
                        />
                        <label
                          htmlFor="cepNaoEncontrado"
                          className="text-sm text-gray-600"
                        >
                          CEP não encontrado
                        </label>
                      </div>
                    </div>
                    {errors.cep && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.cep}
                      </p>
                    )}
                  </div>

                  {/* Logradouro e Número */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-2">
                      <Label
                        htmlFor="logradouro"
                        className="text-sm font-medium text-gray-700"
                      >
                        Rua/Logradouro *
                      </Label>
                      <Input
                        id="logradouro"
                        value={formData.logradouro}
                        onChange={(e) =>
                          handleInputChange("logradouro", e.target.value)
                        }
                        className={`${
                          errors.logradouro
                            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                        }`}
                        placeholder="Rua, avenida, etc."
                        disabled={
                          isLoading ||
                          (!cepNaoEncontrado &&
                            formData.cep.replace(/\D/g, "").length !== 8)
                        }
                      />
                      {errors.logradouro && (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.logradouro}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="numero"
                        className="text-sm font-medium text-gray-700"
                      >
                        Número *
                      </Label>
                      <Input
                        id="numero"
                        value={formData.numero}
                        onChange={(e) =>
                          handleInputChange("numero", e.target.value)
                        }
                        className={`${
                          errors.numero
                            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                        }`}
                        placeholder="123"
                        disabled={isLoading}
                      />
                      {errors.numero && (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.numero}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Complemento */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="complemento"
                      className="text-sm font-medium text-gray-700"
                    >
                      Complemento
                    </Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) =>
                        handleInputChange("complemento", e.target.value)
                      }
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                      placeholder="Apto, bloco, etc. (opcional)"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Bairro, Cidade e Estado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="bairro"
                        className="text-sm font-medium text-gray-700"
                      >
                        Bairro *
                      </Label>
                      <Input
                        id="bairro"
                        value={formData.bairro}
                        onChange={(e) =>
                          handleInputChange("bairro", e.target.value)
                        }
                        className={`${
                          errors.bairro
                            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                        }`}
                        placeholder="Nome do bairro"
                        disabled={
                          isLoading ||
                          (!cepNaoEncontrado &&
                            formData.cep.replace(/\D/g, "").length !== 8)
                        }
                      />
                      {errors.bairro && (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.bairro}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="cidade"
                        className="text-sm font-medium text-gray-700"
                      >
                        Cidade *
                      </Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) =>
                          handleInputChange("cidade", e.target.value)
                        }
                        className={`${
                          errors.cidade
                            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                        }`}
                        placeholder="Nome da cidade"
                        disabled={
                          isLoading ||
                          (!cepNaoEncontrado &&
                            formData.cep.replace(/\D/g, "").length !== 8)
                        }
                      />
                      {errors.cidade && (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.cidade}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="estado"
                        className="text-sm font-medium text-gray-700"
                      >
                        Estado *
                      </Label>
                      <Input
                        id="estado"
                        value={formData.estado}
                        onChange={(e) =>
                          handleInputChange("estado", e.target.value)
                        }
                        className={`${
                          errors.estado
                            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                        }`}
                        placeholder="UF"
                        maxLength={2}
                        disabled={
                          isLoading ||
                          (!cepNaoEncontrado &&
                            formData.cep.replace(/\D/g, "").length !== 8)
                        }
                      />
                      {errors.estado && (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.estado}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados do Responsável */}
            <Card className="border border-green-100/50 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Dados do Responsável
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="nome_responsavel"
                      className="text-sm font-medium text-gray-700"
                    >
                      Nome do Responsável *
                    </Label>
                    <Input
                      id="nome_responsavel"
                      value={formData.nome_responsavel}
                      onChange={(e) =>
                        handleInputChange("nome_responsavel", e.target.value)
                      }
                      className={`${
                        errors.nome_responsavel
                          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                          : "border-gray-300 focus:border-green-500 focus:ring-green-100"
                      }`}
                      placeholder="Nome completo do responsável"
                      disabled={isLoading}
                    />
                    {errors.nome_responsavel && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.nome_responsavel}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="telefone_whatsapp"
                      className="text-sm font-medium text-gray-700"
                    >
                      Telefone WhatsApp *
                    </Label>
                    <Input
                      id="telefone_whatsapp"
                      value={formData.telefone_whatsapp}
                      onChange={(e) =>
                        handleInputChange("telefone_whatsapp", e.target.value)
                      }
                      className={`${
                        errors.telefone_whatsapp
                          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                          : "border-gray-300 focus:border-green-500 focus:ring-green-100"
                      }`}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      disabled={isLoading}
                    />
                    {errors.telefone_whatsapp && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.telefone_whatsapp}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Escolaridade */}
            <Card className="border border-purple-100/50 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-md">
                    <GraduationCap className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Vida Escolar
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="escolaridade"
                      className="text-sm font-medium text-gray-700"
                    >
                      Escolaridade *
                    </Label>
                    <Select
                      value={formData.escolaridade}
                      onValueChange={(value) =>
                        handleInputChange("escolaridade", value)
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger
                        className={`${
                          errors.escolaridade
                            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                            : "border-gray-300 focus:border-purple-500 focus:ring-purple-100"
                        }`}
                      >
                        <SelectValue placeholder="Selecione a escolaridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ensino Fundamental 2">
                          Ensino Fundamental 2
                        </SelectItem>
                        <SelectItem value="Ensino Médio">
                          Ensino Médio
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.escolaridade && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.escolaridade}
                      </p>
                    )}
                  </div>

                  {formData.escolaridade && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="ano_escolar"
                        className="text-sm font-medium text-gray-700"
                      >
                        Ano Escolar *
                      </Label>
                      <Select
                        value={formData.ano_escolar}
                        onValueChange={(value) =>
                          handleInputChange("ano_escolar", value)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger
                          className={`${
                            errors.ano_escolar
                              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                              : "border-gray-300 focus:border-purple-500 focus:ring-purple-100"
                          }`}
                        >
                          <SelectValue placeholder="Selecione o ano escolar" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAnoEscolarOptions().map((ano) => (
                            <SelectItem key={ano} value={ano}>
                              {ano}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.ano_escolar && (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.ano_escolar}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <EscolaSelector
                    value={formData.escola}
                    onChange={(escola) => handleInputChange("escola", escola)}
                    placeholder="Digite o nome da escola..."
                    escolaridade={formData.escolaridade}
                    error={errors.escola}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informação sobre o curso */}
            {formData.escolaridade && (
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">
                        Curso Selecionado Automaticamente
                      </h4>
                      <p className="text-blue-800 leading-relaxed">
                        Com base na escolaridade informada (
                        <strong>{formData.escolaridade}</strong>), a aluna será
                        inscrita no curso de{" "}
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full text-sm font-semibold text-blue-900 border border-blue-200">
                          {formData.escolaridade === "Ensino Fundamental 2"
                            ? "Jogos Digitais"
                            : "Robótica e Inteligência Artificial"}
                        </span>
                      </p>
                      <p className="text-blue-700 text-sm mt-2">
                        Este processo segue as mesmas regras do formulário de
                        inscrição principal.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>

          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-4 pt-4 md:pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 md:px-6 py-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || checkingCPF || !isFormValid()}
              className={`w-full sm:w-auto px-6 md:px-8 py-2 font-semibold shadow-lg transition-all duration-200 transform ${
                isLoading || checkingCPF || !isFormValid()
                  ? "bg-gray-400 cursor-not-allowed opacity-60"
                  : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 hover:shadow-xl hover:scale-105"
              } text-white`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Criando Inscrição...</span>
                  <span className="sm:hidden">Criando...</span>
                </>
              ) : checkingCPF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Verificando CPF...</span>
                  <span className="sm:hidden">Verificando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Criar Inscrição</span>
                  <span className="sm:hidden">Criar</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Email */}
      <ModalConfirmEmail
        isOpen={showEmailModal}
        onClose={handleEmailSent}
        onSend={handleSendEmail}
        onSkip={handleSkipEmail}
        studentName={formData.nome}
        studentEmail={formData.email}
        courseName={createdInscription?.curso || ""}
      />
    </>
  );
}
