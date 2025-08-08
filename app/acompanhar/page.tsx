"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Search,
  ArrowLeft,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { TermoConsentimento } from "@/components/termo-consentimento";

interface InscricaoData {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  cpf: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  curso_interesse: string;
  experiencia_nivel: string;
  motivacao: string;
  disponibilidade: string;
  como_soube: string;
  created_at: string;
  status?: string;
  nome_responsavel?: string;
  cpf_responsavel?: string;
}

const formatCPF = (cpf: string) => {
  if (!cpf) return "";
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatPhone = (phone: string) => {
  if (!phone) return "";
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR");
  } catch (error) {
    return dateString;
  }
};

const getStatusBadge = (status?: string) => {
  // Por enquanto, assumindo que todas são confirmadas
  // Aqui você pode adicionar lógica para diferentes status
  if (status === "excedente") {
    return (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
        <Clock className="w-4 h-4 mr-1" />
        Excedente
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-800 border-green-200">
      <CheckCircle2 className="w-4 h-4 mr-1" />
      Confirmada
    </Badge>
  );
};

const cursoDisplayNames: { [key: string]: string } = {
  Jogos: "Desenvolvimento de Jogos Digitais",
  Robótica: "Robótica Educacional e Inteligência Artificial",
  "programacao-web": "Programação Web",
  "design-grafico": "Design Gráfico",
  "marketing-digital": "Marketing Digital",
  "analise-dados": "Análise de Dados",
  "mobile-development": "Desenvolvimento Mobile",
  "ux-ui": "UX/UI Design",
};

const getNextSteps = (status?: string, inscricao?: InscricaoData) => {
  if (status === "excedente") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-purple-100">
          <div className="w-8 h-8 bg-gradient-to-r from-[#FF4A97] to-[#FF6B9D] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 shadow-lg">
            1
          </div>
          <div>
            <p className="font-semibold text-purple-700 text-lg">
              Inscrição registrada
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Você está na lista de excedentes
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-purple-100">
          <div className="w-8 h-8 bg-gradient-to-r from-[#FF4A97] to-[#FF6B9D] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 shadow-lg">
            2
          </div>
          <div>
            <p className="font-semibold text-purple-700 text-lg">
              Aguardar comunicação
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Fique de olho no seu email para ver se abriu uma vaga nova e você
              foi selecionada
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Status confirmada/inscrita
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-purple-100">
        <div className="w-8 h-8 bg-gradient-to-r from-[#FF4A97] to-[#FF6B9D] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 shadow-lg">
          1
        </div>
        <div>
          <p className="font-semibold text-purple-700 text-lg">
            Confirmação recebida
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Sua inscrição foi registrada com sucesso
          </p>
        </div>
      </div>
      <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-purple-100">
        <div className="w-8 h-8 bg-gradient-to-r from-[#FF4A97] to-[#FF6B9D] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 shadow-lg">
          2
        </div>
        <div className="w-full">
          <p className="font-semibold text-purple-700 text-lg mb-3">
            Comparecer no primeiro dia de aula
          </p>
          <p className="text-sm text-gray-600 mt-1 mb-3">
            Traga os seguintes documentos:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            <li>• RG/CPF</li>
            <li>• Termo de consentimento assinado pelos pais</li>
            <li>• Declaração de matrícula</li>
          </ul>

          {inscricao && (
            <TermoConsentimento
              nomeResponsavel={inscricao.nome_responsavel || ""}
              cpfResponsavel={inscricao.cpf_responsavel || ""}
              nomeParticipante={inscricao.nome_completo}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default function AcompanharPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cpfFromUrl = searchParams.get("cpf");

  const [cpf, setCpf] = useState(cpfFromUrl || "");
  const [inscricao, setInscricao] = useState<InscricaoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Auto-search se CPF veio da URL
  useEffect(() => {
    if (cpfFromUrl && cpfFromUrl.length >= 11) {
      handleSearch(cpfFromUrl);
    }
  }, [cpfFromUrl]);

  const handleSearch = async (cpfToSearch?: string) => {
    const cpfValue = cpfToSearch || cpf;

    if (!cpfValue || cpfValue.length < 11) {
      setError("CPF deve ter pelo menos 11 dígitos");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const encodedCpf = encodeURIComponent(cpfValue);
      console.log(
        "Fazendo requisição para:",
        `/api/inscricao/consultar?cpf=${encodedCpf}`
      );

      const response = await fetch(
        `/api/inscricao/consultar?cpf=${encodedCpf}`
      );
      const data = await response.json();

      console.log("Resposta da API:", data);
      console.log("Status da resposta:", response.status);

      if (response.ok) {
        console.log("Dados da inscrição:", data);
        setInscricao(data);
        setError("");
      } else {
        setInscricao(null);
        setError(data.error || "Erro ao buscar inscrição");
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      setInscricao(null);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      setCpf(value);
    }
  };

  const handleNewSearch = () => {
    const cpfValue = cpf.replace(/\D/g, "");
    if (cpfValue.length === 11) {
      router.push(`/acompanhar?cpf=${encodeURIComponent(cpf)}`);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/acompanhar?cpf=${encodeURIComponent(
      cpf
    )}`;

    if (navigator.share) {
      navigator.share({
        title: "Minha Inscrição - Mermãs Digitais",
        text: "Confira o status da minha inscrição nos cursos Mermãs Digitais!",
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#9854CB" }}>
      {/* Scrollable content */}
      <div className="relative z-10 min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Link href="/">
                <button className="rounded-[65px] px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm transition-all duration-200 hover:bg-white/20 hover:border-white/30 font-poppins flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
              </Link>

              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white font-paytone-one">
                  Acompanhar Inscrição
                </h1>
                <p className="text-white/80 mt-2 font-poppins">
                  Consulte o status da sua inscrição nos cursos Mermãs Digitais
                </p>
              </div>

              {inscricao && (
                <button
                  onClick={handleShare}
                  className="rounded-[65px] px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm transition-all duration-200 hover:bg-white/20 hover:border-white/30 font-poppins flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </button>
              )}
            </div>
          </div>

          {/* Search Section */}
          <div className="rounded-2xl bg-white shadow-lg px-4 sm:px-6 pt-6 pb-6 font-poppins mb-8">
            {/* Header do formulário */}
            <div className="text-center mb-6">
              <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                CONSULTA DE INSCRIÇÃO
              </div>
              <p className="text-gray-600 mt-2 text-sm font-poppins">
                Digite seu CPF para acompanhar sua inscrição
              </p>
            </div>

            {/* Formulário de busca */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="cpf"
                  className="block text-sm font-semibold text-gray-700 font-poppins mb-1"
                >
                  CPF do candidato
                  <span className="text-[#FF4A97] ml-1">*</span>
                </label>
                <input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                  className="w-full rounded-[65px] px-4 sm:px-6 py-3 sm:py-4 bg-[#F8F8F8] text-base text-gray-800 border-2 border-transparent transition-all duration-200 focus:ring-0 focus:outline-none focus:border-[#FF4A97] focus:bg-white font-poppins disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                />
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={handleNewSearch}
                  disabled={loading || cpf.length < 14}
                  className="w-full max-w-xs rounded-[65px] px-6 py-3 sm:py-4 bg-gradient-to-r from-[#FF4A97] to-[#FF6B9D] hover:from-[#E6397A] hover:to-[#E65A8A] text-white font-semibold text-base transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FF4A97] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-poppins min-h-[48px] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Buscar Inscrição
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Alert className="mb-8 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Card className="mb-8">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {inscricao && (
            <div className="space-y-6">
              {/* Status Card */}
              <div className="rounded-2xl bg-white shadow-lg px-4 sm:px-6 pt-6 pb-6 font-poppins">
                <div className="text-center mb-6">
                  <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                    STATUS DA INSCRIÇÃO
                  </div>
                  <p className="text-gray-600 mt-2 text-sm font-poppins">
                    Informações sobre sua inscrição
                  </p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-purple-700 font-semibold">
                    Status da Inscrição
                  </h2>
                  {getStatusBadge(inscricao.status)}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Curso selecionado</p>
                    <p className="font-semibold text-lg text-purple-700">
                      {cursoDisplayNames[inscricao.curso_interesse] ||
                        inscricao.curso_interesse}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data da inscrição</p>
                    <p className="font-semibold">
                      {formatDate(inscricao.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="rounded-2xl bg-white shadow-lg px-4 sm:px-6 pt-6 pb-6 font-poppins">
                <div className="text-center mb-6">
                  <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                    DADOS PESSOAIS
                  </div>
                  <p className="text-gray-600 mt-2 text-sm font-poppins">
                    Informações pessoais do candidato
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Nome completo
                      </p>
                      <p className="font-semibold">{inscricao.nome_completo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">CPF</p>
                      <p className="font-semibold">
                        {formatCPF(inscricao.cpf)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Data de nascimento
                      </p>
                      <p className="font-semibold">
                        {formatDate(inscricao.data_nascimento)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Telefone do responsável
                      </p>
                      <p className="font-semibold">
                        {formatPhone(inscricao.telefone)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4 text-purple-600" />
                      {inscricao.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Responsible Info */}
              <div className="rounded-2xl bg-white shadow-lg px-4 sm:px-6 pt-6 pb-6 font-poppins">
                <div className="text-center mb-6">
                  <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                    DADOS DO RESPONSÁVEL
                  </div>
                  <p className="text-gray-600 mt-2 text-sm font-poppins">
                    Informações do responsável legal
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Nome do responsável
                    </p>
                    <p className="font-semibold">
                      {inscricao.nome_responsavel || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      CPF do responsável
                    </p>
                    <p className="font-semibold">
                      {inscricao.cpf_responsavel
                        ? formatCPF(inscricao.cpf_responsavel)
                        : "Não informado"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Info */}
              <div className="rounded-2xl bg-white shadow-lg px-4 sm:px-6 pt-6 pb-6 font-poppins">
                <div className="text-center mb-6">
                  <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                    ENDEREÇO
                  </div>
                  <p className="text-gray-600 mt-2 text-sm font-poppins">
                    Localização do candidato
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Endereço</p>
                    <p className="font-semibold">{inscricao.endereco}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">CEP</p>
                    <p className="font-semibold">{inscricao.cep}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Cidade</p>
                    <p className="font-semibold">{inscricao.cidade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estado</p>
                    <p className="font-semibold">{inscricao.estado}</p>
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <div className="rounded-2xl bg-white shadow-lg px-4 sm:px-6 pt-6 pb-6 font-poppins">
                <div className="text-center mb-6">
                  <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                    INFORMAÇÕES ESCOLARES
                  </div>
                  <p className="text-gray-600 mt-2 text-sm font-poppins">
                    Dados escolares do candidato
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Série</p>
                    <p className="font-semibold capitalize">
                      {inscricao.experiencia_nivel}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Escola</p>
                    <p className="font-semibold">
                      {inscricao.motivacao.includes("Escola:")
                        ? inscricao.motivacao.split("Escola:")[1]?.trim() ||
                          "Não informado"
                        : "Não informado"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg px-4 sm:px-6 pt-6 pb-6 font-poppins border-2 border-purple-200">
                <div className="text-center mb-6">
                  <div className="text-xs font-semibold text-[#FF4A97] tracking-wider mb-0 font-poppins">
                    PRÓXIMOS PASSOS
                  </div>
                  <p className="text-gray-600 mt-2 text-sm font-poppins">
                    O que acontece após sua inscrição
                  </p>
                </div>
                {getNextSteps(inscricao.status, inscricao)}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-12 text-gray-500">
            <p className="text-sm">
              © 2025 Mermãs Digitais. Construindo o futuro digital feminino.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
