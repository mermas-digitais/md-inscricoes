"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput } from "@/components/ui/custom-input";
import EscolaSelector from "@/components/ui/escola-selector";
import GeneroSelector from "@/components/ui/genero-selector";
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
import { toast } from "@/hooks/use-toast";
import { useZodForm } from "@/hooks/use-zod-form";
import {
  AlertTriangle,
  Timer,
  Zap,
  User,
  GraduationCap,
  Users,
  MapPin,
  Clock,
  ChevronDown,
  CheckCircle,
  Edit3,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import { z } from "zod";

interface MembroEquipe {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  genero: string;
}

interface FormData {
  email: string;
  nome: string;
  cpf: string;
  telefone: string;
  escola: string;
  genero: string;
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
  modalidade: string;
  nome_equipe: string;
  membros_equipe: MembroEquipe[];
}

// Schemas de validação Zod para cada step
const regulationsSchema = z.object({
  aceitoRegulamentos: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os regulamentos para continuar",
  }),
});

const step1Schema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cpf: z.string().min(14, "CPF deve estar completo"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  escola: z.string().min(1, "Campus/Escola é obrigatório"),
  genero: z.string().min(1, "Gênero é obrigatório"),
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
        return isValidCPF(val);
      }, "CPF inválido")
      .refine((val) => {
        return !cpfExists;
      }, "Já existe uma inscrição com este CPF"),
    telefone: z.string().min(1, "Telefone é obrigatório"),
    escola: z.string().min(1, "Escola/Campus é obrigatório"),
    genero: z.string().min(1, "Gênero é obrigatório"),
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
  modalidade: z
    .string()
    .min(1, "Modalidade é obrigatória")
    .refine(
      (val) => val === "jogos" || val === "robotica" || val === "ouvinte",
      {
        message: "Selecione uma modalidade válida",
      }
    ),
});

const membroEquipeSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  genero: z.string().min(1, "Gênero é obrigatório"),
});

const step4Schema = z.object({
  nome_equipe: z
    .string()
    .min(2, "Nome da equipe deve ter pelo menos 2 caracteres"),
  membros_equipe: z
    .array(membroEquipeSchema)
    .min(1, "Mínimo de 1 membro")
    .max(5, "Máximo de 5 membros"),
});

function InscricaoMDX25Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: searchParams.get("email") || "",
    nome: "",
    cpf: "",
    telefone: "",
    escola: "",
    genero: "",
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
    modalidade: "",
    nome_equipe: "",
    membros_equipe: [
      {
        id: "1",
        nome: "",
        cpf: "",
        data_nascimento: "",
        genero: "",
      },
    ],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [generoConfirmado, setGeneroConfirmado] = useState(false);
  const [cpfExists, setCpfExists] = useState(false);
  const [aceitoRegulamentos, setAceitoRegulamentos] = useState(false);
  const [membrosExpandidos, setMembrosExpandidos] = useState<Set<string>>(
    new Set(["1"])
  );
  const [cepNaoEncontrado, setCepNaoEncontrado] = useState(false);
  const [cpfsEmOutrasEquipes, setCpfsEmOutrasEquipes] = useState<Set<string>>(
    new Set()
  );
  const [isLoadingOrientador, setIsLoadingOrientador] = useState(false);
  const [showOuvinteModal, setShowOuvinteModal] = useState(false);

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

  // Schema dinâmico para step1 com validação de CPF
  const step1SchemaWithValidation = useMemo(
    () => createStep1SchemaWithCPFValidation(cpfExists),
    [cpfExists]
  );

  // Forms Zod para cada step
  const regulationsForm = useZodForm(regulationsSchema, {
    aceitoRegulamentos: aceitoRegulamentos,
  });

  const step1Form = useZodForm(step1SchemaWithValidation, {
    nome: formData.nome,
    cpf: formData.cpf,
    telefone: formData.telefone,
    escola: formData.escola,
    genero: formData.genero,
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
    modalidade: formData.modalidade,
  });

  const step4Form = useZodForm(step4Schema, {
    nome_equipe: formData.nome_equipe,
    membros_equipe: formData.membros_equipe,
  });

  // Sincronizar os dados do form quando o formData mudar
  useEffect(() => {
    step1Form.setFieldValue("nome", formData.nome, false);
    step1Form.setFieldValue("cpf", formData.cpf, false);
    step1Form.setFieldValue("telefone", formData.telefone, false);
    step1Form.setFieldValue("escola", formData.escola, false);
    step1Form.setFieldValue("genero", formData.genero, false);
  }, [
    formData.nome,
    formData.cpf,
    formData.telefone,
    formData.escola,
    formData.genero,
  ]);

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

  useEffect(() => {
    step3Form.setFieldValue("modalidade", formData.modalidade, false);
  }, [formData.modalidade]);

  // Aplicar regras de gênero quando a modalidade mudar
  useEffect(() => {
    if (formData.modalidade === "robotica") {
      // Para robótica, definir todos os membros como feminino
      setFormData((prev) => ({
        ...prev,
        membros_equipe: prev.membros_equipe.map((membro) => ({
          ...membro,
          genero: "feminino",
        })),
      }));
    }
  }, [formData.modalidade]);

  useEffect(() => {
    step4Form.setFieldValue("nome_equipe", formData.nome_equipe, false);
    step4Form.setFieldValue("membros_equipe", formData.membros_equipe, false);
  }, [formData.nome_equipe, formData.membros_equipe]);

  // Revalidar quando o schema mudar (cpfExists)
  useEffect(() => {
    step1Form.setFieldValue("nome", formData.nome, false);
    step1Form.setFieldValue("cpf", formData.cpf, false);
    step1Form.setFieldValue("telefone", formData.telefone, false);
    step1Form.setFieldValue("escola", formData.escola, false);
    step1Form.setFieldValue("genero", formData.genero, false);
  }, [step1SchemaWithValidation]);

  // Função para verificar se CPF já existe com debounce
  const checkCPFExists = async (cpf: string) => {
    if (cpf.replace(/\D/g, "").length === 11) {
      try {
        const response = await fetch("/api/mdx25/check-cpf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: cpf }),
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
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.cpf]);

  // Countdown para deadline das inscrições MDX25
  useEffect(() => {
    const deadline = new Date("2025-12-31T23:59:59-03:00");

    const updateCountdown = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

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
    } else if (field === "telefone") {
      value = formatPhone(value);
    } else if (field === "cep") {
      value = formatCEP(value);
      if (value.replace(/\D/g, "").length === 8 && !cepNaoEncontrado) {
        fetchAddressByCEP(value);
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // Se for CPF do orientador e estiver no Step 2, buscar dados do orientador
    if (
      field === "cpf" &&
      currentStep === 2 &&
      value.replace(/\D/g, "").length === 11
    ) {
      console.log(
        "Chamando busca do orientador para CPF:",
        value.replace(/\D/g, "")
      );
      await buscarOrientadorPorCPF(value.replace(/\D/g, ""));
    }

    // Atualizar os forms Zod correspondentes
    if (["nome", "cpf", "telefone", "escola", "genero"].includes(field)) {
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
    }
  };

  const handleCepNaoEncontrado = (checked: boolean) => {
    setCepNaoEncontrado(checked);
    if (checked) {
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

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/mdx25/inscricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const { curso } = await response.json();
        router.push(
          `/mdx25/confirmacao?curso=${encodeURIComponent(
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

  // Funções para gerenciar membros da equipe
  const adicionarMembro = () => {
    if (formData.membros_equipe.length < 5) {
      const novoId = (formData.membros_equipe.length + 1).toString();
      const novoMembro: MembroEquipe = {
        id: novoId,
        nome: "",
        cpf: "",
        data_nascimento: "",
        genero: "",
      };

      setFormData((prev) => ({
        ...prev,
        membros_equipe: [...prev.membros_equipe, novoMembro],
      }));

      // Expandir o novo membro e recolher os outros
      setMembrosExpandidos(new Set([novoId]));
    }
  };

  const removerMembro = (id: string) => {
    if (formData.membros_equipe.length > 1) {
      setFormData((prev) => ({
        ...prev,
        membros_equipe: prev.membros_equipe.filter(
          (membro) => membro.id !== id
        ),
      }));

      // Se o membro removido estava expandido, expandir o primeiro membro restante
      if (membrosExpandidos.has(id)) {
        const membrosRestantes = formData.membros_equipe.filter(
          (membro) => membro.id !== id
        );
        if (membrosRestantes.length > 0) {
          setMembrosExpandidos(new Set([membrosRestantes[0].id]));
        }
      }
    }
  };

  const toggleMembro = (id: string) => {
    setMembrosExpandidos((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) {
        novo.delete(id);
      } else {
        novo.clear();
        novo.add(id);
      }
      return novo;
    });
  };

  const atualizarMembro = async (
    id: string,
    campo: keyof MembroEquipe,
    valor: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      membros_equipe: prev.membros_equipe.map((membro) =>
        membro.id === id ? { ...membro, [campo]: valor } : membro
      ),
    }));

    // Se a modalidade é robótica, automaticamente definir gênero como feminino
    if (formData.modalidade === "robotica" && campo !== "genero") {
      setFormData((prev) => ({
        ...prev,
        membros_equipe: prev.membros_equipe.map((membro) =>
          membro.id === id ? { ...membro, genero: "feminino" } : membro
        ),
      }));
    }

    // Se o campo é CPF e tem 11 dígitos, verificar se já está sendo usado em outra equipe
    if (campo === "cpf" && valor.length === 11) {
      const existeEmOutraEquipe = await verificarCpfEmOutrasEquipes(valor);
      if (existeEmOutraEquipe) {
        setCpfsEmOutrasEquipes((prev) => new Set(prev).add(valor));
      } else {
        setCpfsEmOutrasEquipes((prev) => {
          const novo = new Set(prev);
          novo.delete(valor);
          return novo;
        });
      }
    }
  };

  // Função para verificar se CPF já está sendo usado em outra equipe
  const verificarCpfEmOutrasEquipes = async (cpf: string) => {
    if (!cpf || cpf.length < 11) return false;

    try {
      const response = await fetch("/api/mdx25/verificar-cpf-membro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cpf }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.existe; // true se o CPF já está sendo usado em outra equipe
      }

      return false;
    } catch (error) {
      console.error("Erro ao verificar CPF:", error);
      return false;
    }
  };

  // Função para buscar orientador pelo CPF e preencher campos
  const buscarOrientadorPorCPF = async (cpf: string) => {
    if (cpf.length !== 11) return;

    console.log("Buscando orientador com CPF:", cpf);
    setIsLoadingOrientador(true);
    try {
      const response = await fetch("/api/mdx25/buscar-orientador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf }),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const orientador = await response.json();
        console.log("Orientador encontrado:", orientador);

        if (orientador) {
          // Preencher campos automaticamente
          setFormData((prev) => {
            const newData = {
              ...prev,
              nome: orientador.nome || prev.nome,
              telefone: orientador.telefone || prev.telefone,
              email: orientador.email || prev.email,
              escola: orientador.escola || prev.escola,
              genero: orientador.genero || prev.genero,
            };
            console.log("Novos dados do form:", newData);
            return newData;
          });
        } else {
          console.log("Nenhum orientador encontrado para este CPF");
        }
      } else {
        console.error("Erro na resposta da API:", response.status);
      }
    } catch (error) {
      console.error("Erro ao buscar orientador:", error);
    } finally {
      setIsLoadingOrientador(false);
    }
  };

  // Função para validar CPF único
  const validarCpfUnico = (cpf: string, membroId?: string) => {
    if (!cpf) return true; // CPF vazio é válido temporariamente

    // Verificar se o CPF é igual ao do orientador (mesmo que incompleto)
    if (cpf === formData.cpf) {
      return false;
    }

    // Se o CPF tem menos de 11 dígitos, só verifica se é igual ao orientador
    if (cpf.length < 11) {
      return cpf !== formData.cpf;
    }

    // Verificar se o CPF já existe em outros membros da equipe
    const outrosMembros = formData.membros_equipe.filter(
      (membro) => membro.id !== membroId && membro.cpf === cpf
    );

    return outrosMembros.length === 0;
  };

  // Função para obter mensagem de erro do CPF
  const getCpfErrorMessage = (cpf: string, membroId?: string) => {
    if (!cpf) return "";

    // Verificar se o CPF é igual ao do orientador (mesmo que incompleto)
    if (cpf === formData.cpf) {
      return "Este CPF já está sendo usado pelo orientador";
    }

    // Se o CPF tem menos de 11 dígitos, só verifica se é igual ao orientador
    if (cpf.length < 11) {
      return cpf === formData.cpf
        ? "Este CPF já está sendo usado pelo orientador"
        : "";
    }

    // Verificar se o CPF já existe em outros membros da equipe
    const outrosMembros = formData.membros_equipe.filter(
      (membro) => membro.id !== membroId && membro.cpf === cpf
    );

    if (outrosMembros.length > 0) {
      return "Este CPF já está sendo usado por outro membro da equipe";
    }

    // Verificar se o CPF já está sendo usado em outra equipe
    if (cpfsEmOutrasEquipes.has(cpf)) {
      return "Este CPF já está sendo usado em outra equipe";
    }

    return "";
  };

  // Função para formatar CPF
  const formatarCpf = (cpf: string) => {
    const numeros = cpf.replace(/\D/g, "");
    if (numeros.length <= 3) return numeros;
    if (numeros.length <= 6)
      return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
    if (numeros.length <= 9)
      return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(
        6
      )}`;
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(
      6,
      9
    )}-${numeros.slice(9, 11)}`;
  };

  // Função para validar regras de gênero baseadas na modalidade
  const validarRegrasGenero = () => {
    if (formData.modalidade === "robotica") {
      // Para robótica, todos os membros devem ser feminino
      return formData.membros_equipe.every(
        (membro) => membro.genero === "feminino"
      );
    } else if (formData.modalidade === "jogos") {
      // Para jogos, deve ter pelo menos uma menina (incluindo o orientador)
      const temMeninaNaEquipe = formData.membros_equipe.some(
        (membro) =>
          membro.genero === "feminino" ||
          membro.genero === "nao-binario" ||
          membro.genero === "transgenero"
      );
      const orientadorEhMenina =
        formData.genero === "feminino" ||
        formData.genero === "nao-binario" ||
        formData.genero === "transgenero";

      return temMeninaNaEquipe || orientadorEhMenina;
    }
    return true; // Para outras modalidades, não há restrições
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return aceitoRegulamentos;
      case 2:
        return (
          step1Form.formState.isValid &&
          formData.nome &&
          formData.cpf &&
          formData.telefone &&
          formData.escola &&
          formData.genero
        );
      case 3:
        return (
          formData.modalidade &&
          (formData.modalidade === "jogos" ||
            formData.modalidade === "robotica" ||
            formData.modalidade === "ouvinte")
        );
      case 4:
        return (
          formData.nome_equipe &&
          // Se ouvinte: mínimo 1; caso contrário 3-5
          (formData.modalidade === "ouvinte"
            ? formData.membros_equipe.length >= 1 &&
              formData.membros_equipe.length <= 5
            : formData.membros_equipe.length >= 3 &&
              formData.membros_equipe.length <= 5) &&
          formData.membros_equipe.every(
            (membro) =>
              membro.nome &&
              membro.cpf &&
              membro.data_nascimento &&
              membro.genero &&
              validarCpfUnico(membro.cpf, membro.id) &&
              !cpfsEmOutrasEquipes.has(membro.cpf)
          ) &&
          // Regras de gênero não se aplicam a ouvintes
          (formData.modalidade === "ouvinte" ? true : validarRegrasGenero())
        );
      default:
        return false;
    }
  };

  return (
    <>
      {/* Script do Jivo Chat */}
      <script
        src="//code.jivosite.com/widget/oCHLatEDsf"
        async
        suppressHydrationWarning
      />

      {/* Countdown e Urgência */}
      {showCountdown && (
        <div className="relative z-50 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 shadow-lg -mt-16 pt-16">
          <div className="max-w-6xl mx-auto px-4 py-4">
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

      {/* Layout padrão */}
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full bg-[#9854CB]"></div>

        <div className="absolute top-0 left-0 right-0 h-screen">
          <img
            src="/assets/images/mdx25/form_asset.svg"
            alt="Fundo do formulário MDX25"
            className="absolute top-0 left-0 w-full h-full object-cover object-top pointer-events-none select-none"
            style={{
              transform: "scale(1.0)",
              willChange: "transform",
            }}
            aria-hidden="true"
          />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          <div className="h-64 sm:h-72 lg:h-80 flex-shrink-0"></div>

          <div className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 py-8 pb-32">
            <div className="w-full max-w-2xl">
              <div className="rounded-2xl bg-white shadow-lg px-4 sm:px-6 pt-6 pb-6 font-poppins">
                <div className="text-center mb-6">
                  <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                    MDX25 - FORMULÁRIO DE INSCRIÇÃO
                  </div>
                  <p className="text-gray-600 mt-2 text-sm font-poppins">
                    PASSO {currentStep} DE 4
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Step 1: Regulamentos */}
                  {currentStep === 1 && (
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold text-[#FF4A97] tracking-wider mb-0 text-left font-poppins">
                          ATENÇÃO!
                        </CardTitle>
                        <CardDescription className="text-2xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-4 text-left font-poppins">
                          Informações importantes antes de iniciar a inscrição
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-gray-800 text-base font-poppins">
                              Apenas o(a) orientador(a) da equipe deverá efetuar
                              a inscrição e pode orientar uma ou mais equipes
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              id="aceitoRegulamentos"
                              checked={aceitoRegulamentos}
                              onChange={(e) => {
                                setAceitoRegulamentos(e.target.checked);
                                regulationsForm.setFieldValue(
                                  "aceitoRegulamentos",
                                  e.target.checked,
                                  true
                                );
                              }}
                              className="w-4 h-4 mt-0.5 text-[#FF4A97] bg-white border-2 border-gray-300 rounded focus:ring-[#FF4A97] focus:ring-2 focus:ring-offset-2 checked:bg-[#FF4A97] checked:border-[#FF4A97] flex-shrink-0"
                            />
                            <label
                              htmlFor="aceitoRegulamentos"
                              className="text-gray-800 text-sm font-poppins cursor-pointer"
                            >
                              Concordo que li e aceito os termos dos
                              regulamentos de{" "}
                              <a
                                href="/assets/docs/Regulamento-Espaço-Games.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-[#6C2EB5] font-semibold hover:text-[#FF4A97] transition-colors duration-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                jogos
                              </a>{" "}
                              e{" "}
                              <a
                                href="/assets/docs/Regulamento-Robótica.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-[#6C2EB5] font-semibold hover:text-[#FF4A97] transition-colors duration-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                robótica
                              </a>
                            </label>
                          </div>
                          {regulationsForm.formState.touched
                            .aceitoRegulamentos &&
                            regulationsForm.formState.errors
                              .aceitoRegulamentos && (
                              <p className="text-red-500 text-sm mt-1 font-poppins">
                                {
                                  regulationsForm.formState.errors
                                    .aceitoRegulamentos
                                }
                              </p>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 2: Dados Pessoais */}
                  {currentStep === 2 && (
                    <Card className="border border-gray-200">
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
                      <CardContent className="space-y-4 ">
                        <CustomInput
                          type="text"
                          value={formatarCpf(formData.cpf)}
                          onChange={(e) =>
                            handleInputChange(
                              "cpf",
                              e.target.value.replace(/\D/g, "")
                            )
                          }
                          placeholder="000.000.000-00"
                          label="CPF"
                          maxLength={14}
                          isRequired
                          disabled={isLoadingOrientador}
                          error={
                            step1Form.formState.touched.cpf
                              ? step1Form.formState.errors.cpf
                              : undefined
                          }
                        />
                        {isLoadingOrientador && (
                          <div className="text-sm text-gray-500 text-center">
                            Carregando informações...
                          </div>
                        )}
                        <CustomInput
                          type="text"
                          value={formData.nome}
                          onChange={(e) =>
                            handleInputChange("nome", e.target.value)
                          }
                          placeholder="Seu nome completo"
                          label="Nome"
                          isRequired
                          error={
                            step1Form.formState.touched.nome
                              ? step1Form.formState.errors.nome
                              : undefined
                          }
                        />
                        <CustomInput
                          type="tel"
                          value={formData.telefone}
                          onChange={(e) =>
                            handleInputChange("telefone", e.target.value)
                          }
                          placeholder="(00) 00000-0000"
                          label="Telefone (Whatsapp)"
                          maxLength={15}
                          isRequired
                          error={
                            step1Form.formState.touched.telefone
                              ? step1Form.formState.errors.telefone
                              : undefined
                          }
                        />
                        <div>
                          <EscolaSelector
                            value={formData.escola}
                            onChange={(escola) =>
                              handleInputChange("escola", escola)
                            }
                            placeholder="Digite o nome da sua escola..."
                            escolaridade="" // Lista geral - todas as escolas
                            error={
                              step1Form.formState.touched.escola &&
                              step1Form.formState.errors.escola
                                ? step1Form.formState.errors.escola
                                : undefined
                            }
                          />
                        </div>
                        <GeneroSelector
                          value={formData.genero}
                          onChange={(genero) =>
                            handleInputChange("genero", genero)
                          }
                          placeholder="Selecione seu gênero"
                          error={
                            step1Form.formState.touched.genero &&
                            step1Form.formState.errors.genero
                              ? step1Form.formState.errors.genero
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
                          placeholder=""
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 3: Seleção de Modalidade */}
                  {currentStep === 3 && (
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div>
                            <CardTitle className="text-sm font-semibold text-[#FF4A97] tracking-wider mb-2 text-left font-poppins">
                              ESCOLHA A MODALIDADE
                            </CardTitle>
                            <CardDescription className="text-3xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-4 text-left font-poppins">
                              Qual modalidade que você vai participar?
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          {/* Opção JOGOS */}
                          <div
                            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              formData.modalidade === "jogos"
                                ? "border-[#FF4A97] bg-gradient-to-r from-[#FF4A97]/10 to-[#C769E3]/10 shadow-lg"
                                : "border-gray-200 bg-white hover:border-[#FF4A97]/50 hover:shadow-md"
                            }`}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                modalidade: "jogos",
                              }));
                              step3Form.setFieldValue("modalidade", "jogos");
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                    formData.modalidade === "jogos"
                                      ? "border-[#FF4A97] bg-[#FF4A97]"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {formData.modalidade === "jogos" && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-[#6C2EB5] font-poppins">
                                    JOGOS
                                  </h3>
                                  <p className="text-sm text-gray-600 font-poppins">
                                    Mostra de Jogos Mermãs Digitais
                                  </p>
                                </div>
                              </div>
                              {formData.modalidade === "jogos" && (
                                <div className="w-6 h-6 bg-[#FF4A97] rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Opção ROBÓTICA */}
                          <div
                            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              formData.modalidade === "robotica"
                                ? "border-[#FF4A97] bg-gradient-to-r from-[#FF4A97]/10 to-[#C769E3]/10 shadow-lg"
                                : "border-gray-200 bg-white hover:border-[#FF4A97]/50 hover:shadow-md"
                            }`}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                modalidade: "robotica",
                              }));
                              step3Form.setFieldValue("modalidade", "robotica");
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                    formData.modalidade === "robotica"
                                      ? "border-[#FF4A97] bg-[#FF4A97]"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {formData.modalidade === "robotica" && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-[#6C2EB5] font-poppins">
                                    ROBÓTICA
                                  </h3>
                                  <p className="text-sm text-gray-600 font-poppins">
                                    2º Desafio de robótica Mermãs Digitais
                                  </p>
                                </div>
                              </div>
                              {formData.modalidade === "robotica" && (
                                <div className="w-6 h-6 bg-[#FF4A97] rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Opção OUVINTE */}
                          <div
                            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              formData.modalidade === "ouvinte"
                                ? "border-[#FF4A97] bg-gradient-to-r from-[#FF4A97]/10 to-[#C769E3]/10 shadow-lg"
                                : "border-gray-200 bg-white hover:border-[#FF4A97]/50 hover:shadow-md"
                            }`}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                modalidade: "ouvinte",
                              }));
                              step3Form.setFieldValue("modalidade", "ouvinte");
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                    formData.modalidade === "ouvinte"
                                      ? "border-[#FF4A97] bg-[#FF4A97]"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {formData.modalidade === "ouvinte" && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-[#6C2EB5] font-poppins">
                                    OUVINTE
                                  </h3>
                                  <p className="text-sm text-gray-600 font-poppins">
                                    Participar como ouvinte no evento
                                  </p>
                                </div>
                              </div>
                              {formData.modalidade === "ouvinte" && (
                                <div className="w-6 h-6 bg-[#FF4A97] rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mensagem de erro */}
                        {step3Form.formState.touched.modalidade &&
                          step3Form.formState.errors.modalidade && (
                            <p className="text-red-500 text-sm mt-1 font-poppins">
                              {step3Form.formState.errors.modalidade}
                            </p>
                          )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 4: Membros da Equipe */}
                  {currentStep === 4 && (
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div>
                            <CardTitle className="text-sm font-semibold text-[#FF4A97] tracking-wider mb-2 text-left font-poppins">
                              SOBRE A EQUIPE
                            </CardTitle>
                            <CardDescription className="text-3xl md:text-3xl font-extrabold text-[#6C2EB5] leading-7 mb-4 text-left font-poppins">
                              Conte um pouco sobre a sua equipe
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Campo Nome da Equipe ou Jogo */}
                        <div className="space-y-2">
                          <CustomInput
                            type="text"
                            label="Nome da Equipe ou Jogo*"
                            value={formData.nome_equipe}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                nome_equipe: e.target.value,
                              }));
                              step4Form.setFieldValue(
                                "nome_equipe",
                                e.target.value
                              );
                            }}
                            placeholder="Digite o nome da equipe ou jogo"
                            required
                          />
                          {step4Form.formState.touched.nome_equipe &&
                            step4Form.formState.errors.nome_equipe && (
                              <p className="text-red-500 text-sm mt-1 font-poppins">
                                {step4Form.formState.errors.nome_equipe}
                              </p>
                            )}
                        </div>

                        <div className="space-y-4">
                          {formData.membros_equipe.map((membro, index) => {
                            const isExpanded = membrosExpandidos.has(membro.id);
                            const isFirst = index === 0;

                            return (
                              <div
                                key={membro.id}
                                className="border border-gray-200 rounded-xl"
                              >
                                {/* Header do membro */}
                                <div
                                  className={`p-4 cursor-pointer transition-all duration-300 ${
                                    isExpanded
                                      ? "bg-gradient-to-r from-[#FF4A97]/10 to-[#C769E3]/10 border-b border-gray-200"
                                      : "bg-white hover:bg-gray-50"
                                  }`}
                                  onClick={() => toggleMembro(membro.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-[#FF4A97] rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <h3 className="font-semibold text-[#6C2EB5] font-poppins">
                                          {membro.nome || `Membro ${index + 1}`}
                                        </h3>
                                        <p className="text-sm text-gray-600 font-poppins">
                                          {membro.cpf
                                            ? `CPF: ${formatarCpf(membro.cpf)}`
                                            : "CPF não informado"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {formData.membros_equipe.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removerMembro(membro.id);
                                          }}
                                          className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </button>
                                      )}
                                      <ChevronDown
                                        className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                                          isExpanded ? "rotate-180" : ""
                                        }`}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Formulário do membro */}
                                {isExpanded && (
                                  <div className="p-6 bg-white space-y-4">
                                    <CustomInput
                                      type="text"
                                      label="Nome completo*"
                                      value={membro.nome}
                                      onChange={(e) =>
                                        atualizarMembro(
                                          membro.id,
                                          "nome",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Digite o nome completo"
                                      required
                                    />

                                    <div>
                                      <CustomInput
                                        type="text"
                                        label="CPF*"
                                        value={formatarCpf(membro.cpf)}
                                        onChange={(e) => {
                                          const valor = e.target.value.replace(
                                            /\D/g,
                                            ""
                                          );
                                          if (valor.length <= 11) {
                                            atualizarMembro(
                                              membro.id,
                                              "cpf",
                                              valor
                                            );
                                          }
                                        }}
                                        placeholder="000.000.000-00"
                                        required
                                      />
                                      {membro.cpf &&
                                        getCpfErrorMessage(
                                          membro.cpf,
                                          membro.id
                                        ) && (
                                          <p className="text-red-500 text-sm mt-1 font-poppins">
                                            {getCpfErrorMessage(
                                              membro.cpf,
                                              membro.id
                                            )}
                                          </p>
                                        )}
                                    </div>

                                    <CustomInput
                                      type="date"
                                      label="Data de nascimento*"
                                      value={membro.data_nascimento}
                                      onChange={(e) =>
                                        atualizarMembro(
                                          membro.id,
                                          "data_nascimento",
                                          e.target.value
                                        )
                                      }
                                      required
                                    />

                                    <div className="pb-4">
                                      <GeneroSelector
                                        placeholder="Selecione o gênero"
                                        value={membro.genero}
                                        onChange={(valor) =>
                                          atualizarMembro(
                                            membro.id,
                                            "genero",
                                            valor
                                          )
                                        }
                                        disabled={
                                          formData.modalidade === "robotica"
                                        }
                                        allowedGenders={
                                          formData.modalidade === "robotica"
                                            ? ["feminino"]
                                            : undefined
                                        }
                                        infoMessage={
                                          formData.modalidade === "robotica"
                                            ? "Para a competição de robótica, todos os membros devem ser do gênero feminino."
                                            : formData.modalidade === "jogos"
                                            ? "Para jogos, é necessário pelo menos uma menina na equipe (pode ser o orientador)."
                                            : undefined
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Botão para adicionar membro */}
                          {formData.membros_equipe.length < 5 && (
                            <button
                              type="button"
                              onClick={adicionarMembro}
                              className="w-full p-4 border-2 border-dashed border-[#FF4A97] rounded-xl hover:border-[#C769E3] hover:bg-gradient-to-r hover:from-[#FF4A97]/5 hover:to-[#C769E3]/5 transition-all duration-300 group"
                            >
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-8 h-8 bg-[#FF4A97] rounded-full flex items-center justify-center text-white group-hover:bg-[#C769E3] transition-colors duration-200">
                                  <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <span className="text-[#6C2EB5] font-semibold font-poppins">
                                  Adicionar membro da equipe
                                </span>
                              </div>
                            </button>
                          )}

                          {/* Informações sobre limites */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm text-blue-800 font-poppins">
                                  <strong>Mínimo:</strong> 3 membros •{" "}
                                  <strong>Máximo:</strong> 5 membros
                                </p>
                                <p className="text-xs text-blue-600 mt-1 font-poppins"></p>
                              </div>
                            </div>
                          </div>

                          {/* Mensagem de erro para regras de gênero */}
                          {formData.modalidade && !validarRegrasGenero() && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm text-red-800 font-poppins font-semibold">
                                    Regra de gênero não atendida:
                                  </p>
                                  <p className="text-xs text-red-600 mt-1 font-poppins">
                                    {formData.modalidade === "robotica"
                                      ? "Todos os membros da equipe devem ser do gênero feminino."
                                      : formData.modalidade === "jogos"
                                      ? "É necessário pelo menos uma menina na equipe (pode ser o orientador)."
                                      : ""}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Mensagem de erro */}
                        {step4Form.formState.touched.membros_equipe &&
                          step4Form.formState.errors.membros_equipe && (
                            <p className="text-red-500 text-sm mt-1 font-poppins">
                              {step4Form.formState.errors.membros_equipe}
                            </p>
                          )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Steps 2-5 continuam com a mesma estrutura... */}
                  {/* Por brevidade, vou incluir apenas o Step 1 completo */}
                  {/* Os outros steps seguem o mesmo padrão do arquivo original */}

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
                    {currentStep === 1 ? (
                      <CustomButton
                        type="button"
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={!isStepValid(currentStep)}
                        className="ml-auto"
                      >
                        Enviar
                      </CustomButton>
                    ) : currentStep < 4 ? (
                      <CustomButton
                        type="button"
                        onClick={() => {
                          if (
                            currentStep === 3 &&
                            formData.modalidade === "ouvinte"
                          ) {
                            // Mostrar modal de confirmação para OUVINTE
                            setShowOuvinteModal(true);
                          } else {
                            setCurrentStep(currentStep + 1);
                          }
                        }}
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

      {/* Modal de Confirmação para OUVINTE */}
      <Dialog open={showOuvinteModal} onOpenChange={setShowOuvinteModal}>
        <DialogContent className="sm:max-w-[500px] border border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Confirmação de Inscrição como Ouvinte
            </DialogTitle>
            <DialogDescription className="text-base">
              Verifique os dados abaixo, pois eles aparecerão no seu certificado
              de 20 horas complementares.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-lg mb-3 text-purple-800">
                Dados Pessoais
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Nome:</span>
                  <span className="text-gray-900">{formData.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">CPF:</span>
                  <span className="text-gray-900">
                    {formData.cpf.replace(
                      /(\d{3})(\d{3})(\d{3})(\d{2})/,
                      "$1.$2.$3-$4"
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">
                    Data de Nascimento:
                  </span>
                  <span className="text-gray-900">
                    {formData.data_nascimento
                      ? new Date(formData.data_nascimento).toLocaleDateString(
                          "pt-BR"
                        )
                      : "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Gênero:</span>
                  <span className="text-gray-900">{formData.genero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Escola:</span>
                  <span className="text-gray-900">{formData.escola}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-lg mb-2 text-green-800">
                Modalidade
              </h3>
              <div className="flex items-center gap-2">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  👂 OUVINTE
                </div>
                <span className="text-sm text-gray-600">
                  Participação como ouvinte - 20 horas complementares
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <CustomButton
              variant="secondary"
              onClick={() => {
                setShowOuvinteModal(false);
                setCurrentStep(2);
              }}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Editar Dados
            </CustomButton>
            <CustomButton
              onClick={handleSubmit}
              disabled={isLoading}
              isLoading={isLoading}
              loadingText="Confirmando..."
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Confirmar Inscrição
            </CustomButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function InscricaoMDX25Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <InscricaoMDX25Content />
    </Suspense>
  );
}
