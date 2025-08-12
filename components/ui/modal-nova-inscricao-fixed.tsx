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
import EscolaSelector from "@/components/ui/escola-selector";
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
} from "lucide-react";

interface ModalNovaInscricaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
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
  escola: string;
}

const initialFormData: FormData = {
  nome: "",
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
  const [generoConfirmado, setGeneroConfirmado] = useState(false);
  const [cepNaoEncontrado, setCepNaoEncontrado] = useState(false);

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setGeneroConfirmado(false);
    setCepNaoEncontrado(false);
    onClose();
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações obrigatórias básicas (igual ao formulário original)
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = "Nome deve ter pelo menos 2 caracteres";
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (formData.cpf.replace(/\D/g, "").length !== 11) {
      newErrors.cpf = "CPF deve estar completo";
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    }

    if (!formData.data_nascimento) {
      newErrors.data_nascimento = "Data de nascimento é obrigatória";
    } else {
      // Validar idade mínima de 10 anos (igual ao formulário original)
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
    }

    // Confirmação de gênero (obrigatória como no formulário original)
    if (!generoConfirmado) {
      newErrors.genero =
        "Você deve confirmar que não se identifica com o gênero masculino";
    }

    // Endereço
    if (!formData.cep.trim()) {
      newErrors.cep = "CEP é obrigatório";
    } else if (formData.cep.replace(/\D/g, "").length !== 8) {
      newErrors.cep = "CEP deve ter 8 dígitos";
    }

    if (!formData.logradouro.trim()) {
      newErrors.logradouro = "Logradouro é obrigatório";
    }

    if (!formData.numero.trim()) {
      newErrors.numero = "Número é obrigatório";
    }

    if (!formData.bairro.trim()) {
      newErrors.bairro = "Bairro é obrigatório";
    }

    if (!formData.cidade.trim()) {
      newErrors.cidade = "Cidade é obrigatória";
    }

    if (!formData.estado.trim()) {
      newErrors.estado = "Estado é obrigatório";
    }

    // Responsável (sempre obrigatório como no formulário original)
    if (!formData.nome_responsavel.trim()) {
      newErrors.nome_responsavel = "Nome do responsável é obrigatório";
    } else if (formData.nome_responsavel.trim().length < 2) {
      newErrors.nome_responsavel =
        "Nome do responsável deve ter pelo menos 2 caracteres";
    }

    if (!formData.telefone_whatsapp.trim()) {
      newErrors.telefone_whatsapp = "Telefone WhatsApp é obrigatório";
    } else if (formData.telefone_whatsapp.replace(/\D/g, "").length < 10) {
      newErrors.telefone_whatsapp = "Telefone deve estar completo";
    }

    // Escolaridade
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

    // Limpar erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Determinar o curso baseado na escolaridade (igual ao formulário original)
      const curso =
        formData.escolaridade === "Ensino Fundamental 2" ? "Jogos" : "Robótica";

      const response = await fetch("/api/inscricao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          email: "monitor@mermasdigitais.com.br", // Email padrão para inscrições via monitor
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Inscrição criada com sucesso!",
          description: `${formData.nome} foi inscrita no curso de ${curso}.`,
        });
        handleClose();
        onSuccess();
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            Nova Inscrição
          </DialogTitle>
          <DialogDescription>
            Adicione uma nova aluna ao sistema seguindo o mesmo processo de
            inscrição.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Dados Pessoais
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome" className="text-sm font-medium">
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  className={errors.nome ? "border-red-500" : ""}
                  placeholder="Nome completo da aluna"
                  disabled={isLoading}
                />
                {errors.nome && (
                  <p className="text-red-500 text-xs mt-1">{errors.nome}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cpf" className="text-sm font-medium">
                  CPF *
                </Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange("cpf", e.target.value)}
                  className={errors.cpf ? "border-red-500" : ""}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  disabled={isLoading}
                />
                {errors.cpf && (
                  <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="data_nascimento" className="text-sm font-medium">
                Data de Nascimento *
              </Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) =>
                  handleInputChange("data_nascimento", e.target.value)
                }
                className={errors.data_nascimento ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.data_nascimento && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.data_nascimento}
                </p>
              )}
            </div>

            {/* Confirmação de gênero */}
            <div className="flex items-start space-x-3 p-4 bg-pink-50 border border-pink-200 rounded-lg">
              <input
                id="generoConfirmado"
                type="checkbox"
                checked={generoConfirmado}
                onChange={(e) => setGeneroConfirmado(e.target.checked)}
                className="w-4 h-4 mt-1 text-pink-600 bg-white border-2 border-gray-300 rounded focus:ring-pink-500"
                disabled={isLoading}
              />
              <label
                htmlFor="generoConfirmado"
                className="text-sm text-gray-700 cursor-pointer"
              >
                Confirmo que <strong>não</strong> se identifica com o gênero
                masculino *
              </label>
            </div>
            {errors.genero && (
              <p className="text-red-500 text-xs mt-1">{errors.genero}</p>
            )}
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">Endereço</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cep" className="text-sm font-medium">
                  CEP *
                </Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleInputChange("cep", e.target.value)}
                  className={errors.cep ? "border-red-500" : ""}
                  placeholder="00000-000"
                  maxLength={9}
                  disabled={isLoading || cepNaoEncontrado}
                />
                {errors.cep && (
                  <p className="text-red-500 text-xs mt-1">{errors.cep}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center space-x-2 mt-6">
                  <input
                    id="cepNaoEncontrado"
                    type="checkbox"
                    checked={cepNaoEncontrado}
                    onChange={(e) => handleCepNaoEncontrado(e.target.checked)}
                    className="w-4 h-4 text-pink-600"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="cepNaoEncontrado"
                    className="text-sm text-gray-600"
                  >
                    Meu CEP não foi encontrado
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="logradouro" className="text-sm font-medium">
                  Rua/Logradouro *
                </Label>
                <Input
                  id="logradouro"
                  value={formData.logradouro}
                  onChange={(e) =>
                    handleInputChange("logradouro", e.target.value)
                  }
                  className={errors.logradouro ? "border-red-500" : ""}
                  placeholder="Rua, avenida, etc."
                  disabled={
                    isLoading ||
                    (!cepNaoEncontrado &&
                      formData.cep.replace(/\D/g, "").length !== 8)
                  }
                />
                {errors.logradouro && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.logradouro}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="numero" className="text-sm font-medium">
                  Número *
                </Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleInputChange("numero", e.target.value)}
                  className={errors.numero ? "border-red-500" : ""}
                  placeholder="123"
                  disabled={isLoading}
                />
                {errors.numero && (
                  <p className="text-red-500 text-xs mt-1">{errors.numero}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="complemento" className="text-sm font-medium">
                Complemento
              </Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={(e) =>
                  handleInputChange("complemento", e.target.value)
                }
                placeholder="Apto, bloco, etc. (opcional)"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bairro" className="text-sm font-medium">
                  Bairro *
                </Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange("bairro", e.target.value)}
                  className={errors.bairro ? "border-red-500" : ""}
                  placeholder="Nome do bairro"
                  disabled={
                    isLoading ||
                    (!cepNaoEncontrado &&
                      formData.cep.replace(/\D/g, "").length !== 8)
                  }
                />
                {errors.bairro && (
                  <p className="text-red-500 text-xs mt-1">{errors.bairro}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cidade" className="text-sm font-medium">
                  Cidade *
                </Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange("cidade", e.target.value)}
                  className={errors.cidade ? "border-red-500" : ""}
                  placeholder="Nome da cidade"
                  disabled={
                    isLoading ||
                    (!cepNaoEncontrado &&
                      formData.cep.replace(/\D/g, "").length !== 8)
                  }
                />
                {errors.cidade && (
                  <p className="text-red-500 text-xs mt-1">{errors.cidade}</p>
                )}
              </div>

              <div>
                <Label htmlFor="estado" className="text-sm font-medium">
                  Estado *
                </Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleInputChange("estado", e.target.value)}
                  className={errors.estado ? "border-red-500" : ""}
                  placeholder="UF"
                  maxLength={2}
                  disabled={
                    isLoading ||
                    (!cepNaoEncontrado &&
                      formData.cep.replace(/\D/g, "").length !== 8)
                  }
                />
                {errors.estado && (
                  <p className="text-red-500 text-xs mt-1">{errors.estado}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dados do Responsável */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Dados do Responsável
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="nome_responsavel"
                  className="text-sm font-medium"
                >
                  Nome do Responsável *
                </Label>
                <Input
                  id="nome_responsavel"
                  value={formData.nome_responsavel}
                  onChange={(e) =>
                    handleInputChange("nome_responsavel", e.target.value)
                  }
                  className={errors.nome_responsavel ? "border-red-500" : ""}
                  placeholder="Nome completo do responsável"
                  disabled={isLoading}
                />
                {errors.nome_responsavel && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.nome_responsavel}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="telefone_whatsapp"
                  className="text-sm font-medium"
                >
                  WhatsApp do Responsável *
                </Label>
                <Input
                  id="telefone_whatsapp"
                  value={formData.telefone_whatsapp}
                  onChange={(e) =>
                    handleInputChange("telefone_whatsapp", e.target.value)
                  }
                  className={errors.telefone_whatsapp ? "border-red-500" : ""}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  disabled={isLoading}
                />
                {errors.telefone_whatsapp && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.telefone_whatsapp}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Escolaridade */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Vida Escolar
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="escolaridade" className="text-sm font-medium">
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
                    className={errors.escolaridade ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Selecione a escolaridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ensino Fundamental 2">
                      Ensino Fundamental 2
                    </SelectItem>
                    <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                  </SelectContent>
                </Select>
                {errors.escolaridade && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.escolaridade}
                  </p>
                )}
              </div>

              {formData.escolaridade && (
                <div>
                  <Label htmlFor="ano_escolar" className="text-sm font-medium">
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
                      className={errors.ano_escolar ? "border-red-500" : ""}
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
                    <p className="text-red-500 text-xs mt-1">
                      {errors.ano_escolar}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="escola" className="text-sm font-medium">
                Escola *
              </Label>
              <EscolaSelector
                value={formData.escola}
                onChange={(escola) => handleInputChange("escola", escola)}
                placeholder="Digite o nome da escola..."
                escolaridade={formData.escolaridade}
                error={errors.escola}
              />
            </div>
          </div>

          {/* Informação sobre o curso */}
          {formData.escolaridade && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Curso selecionado automaticamente
                  </h4>
                  <p className="text-sm text-blue-800">
                    Com base na escolaridade informada, a aluna será inscrita no
                    curso de{" "}
                    <strong>
                      {formData.escolaridade === "Ensino Fundamental 2"
                        ? "Jogos Digitais"
                        : "Robótica e Inteligência Artificial"}
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Inscrição"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
