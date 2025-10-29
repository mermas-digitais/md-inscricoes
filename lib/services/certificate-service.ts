import jsPDF from "jspdf";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export interface CertificateConfig {
  templateUrl: string;
  posicoes: {
    nome: { x: number; y: number };
    cpf: { x: number; y: number };
    data: { x: number; y: number };
    carga_horaria: { x: number; y: number };
  };
  fontes: {
    nome: { size: number; color: string; family: string };
    cpf: { size: number; color: string; family: string };
    data: { size: number; color: string; family: string };
    carga_horaria: { size: number; color: string; family: string };
  };
}

export interface AlunaData {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  curso: string;
  data_conclusao?: Date;
  carga_horaria?: number;
}

export interface CertificateResult {
  success: boolean;
  alunaId: string;
  alunaNome: string;
  email: string;
  error?: string;
  messageId?: string;
}

export class CertificateService {
  private supabase: any;

  constructor() {
    // Inicializar cliente Supabase
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Carrega imagem do template como base64
   */
  private loadTemplateAsBase64(templateUrl: string): string {
    try {
      // Converter URL relativa para caminho absoluto
      const imagePath = path.join(process.cwd(), "public", templateUrl);

      // Verificar se arquivo existe
      if (!fs.existsSync(imagePath)) {
        console.warn(`Template não encontrado: ${imagePath}`);
        return "";
      }

      // Ler arquivo e converter para base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64 = imageBuffer.toString("base64");

      // Determinar tipo MIME baseado na extensão
      const ext = path.extname(imagePath).toLowerCase();
      let mimeType = "image/png";
      if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      if (ext === ".gif") mimeType = "image/gif";

      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error("Erro ao carregar template:", error);
      return "";
    }
  }

  /**
   * Busca dados das alunas selecionadas no banco de dados
   */
  async getAlunasData(alunaIds: string[]): Promise<AlunaData[]> {
    try {
      // Buscar dados das inscrições usando Supabase
      const { data: inscricoes, error } = await this.supabase
        .from("inscricoes")
        .select(
          `
          id,
          nome,
          cpf,
          email,
          curso,
          data_conclusao
        `
        )
        .in("id", alunaIds);

      if (error) {
        throw new Error(`Erro ao buscar inscrições: ${error.message}`);
      }

      if (!inscricoes || inscricoes.length === 0) {
        throw new Error("Nenhuma aluna encontrada com os IDs fornecidos");
      }

      // Buscar carga horária dos cursos para cada inscrição
      const cursosNomes = [...new Set(inscricoes.map((i) => i.curso))];
      const { data: cursos, error: cursosError } = await this.supabase
        .from("cursos")
        .select("nome_curso, carga_horaria")
        .in("nome_curso", cursosNomes);

      if (cursosError) {
        console.warn("Erro ao buscar cursos:", cursosError.message);
      }

      // Criar mapa de curso -> carga horária
      const cargaHorariaMap = new Map();
      if (cursos) {
        cursos.forEach((curso) => {
          cargaHorariaMap.set(curso.nome_curso, curso.carga_horaria);
        });
      }

      // Mapear dados para o formato esperado
      const alunasData: AlunaData[] = inscricoes.map((inscricao: any) => ({
        id: inscricao.id,
        nome: inscricao.nome,
        cpf: inscricao.cpf,
        email: inscricao.email,
        curso: inscricao.curso || "Programação", // Fallback se não tiver curso
        data_conclusao: inscricao.data_conclusao
          ? new Date(inscricao.data_conclusao)
          : new Date(),
        carga_horaria: cargaHorariaMap.get(inscricao.curso) || 40, // Busca carga horária do curso
      }));

      console.log(
        `📊 Encontradas ${alunasData.length} alunas no banco:`,
        alunasData.map((a) => ({ id: a.id, nome: a.nome, email: a.email }))
      );

      return alunasData;
    } catch (error) {
      console.error("Erro ao buscar dados das alunas:", error);
      throw error;
    }
  }

  /**
   * Gera PDF do certificado para uma aluna
   */
  async generateCertificate(
    alunaData: AlunaData,
    config: CertificateConfig
  ): Promise<Buffer> {
    try {
      // Criar PDF em formato A4 landscape
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Carregar imagem de fundo como base64
      const imageBase64 = this.loadTemplateAsBase64(config.templateUrl);

      if (imageBase64) {
        // Adicionar imagem de fundo
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Adicionar imagem cobrindo toda a página
        pdf.addImage(imageBase64, "PNG", 0, 0, pageWidth, pageHeight);
        console.log("✅ Imagem de fundo adicionada ao certificado");
      } else {
        console.warn(
          "⚠️ Imagem de fundo não encontrada, usando layout simples"
        );

        // Layout simples sem imagem
        pdf.setFontSize(24);
        pdf.setTextColor("#2D3748");
        pdf.setFont("helvetica", "bold");
        pdf.text("CERTIFICADO DE CONCLUSÃO", 148, 50, { align: "center" });

        pdf.setFontSize(16);
        pdf.setTextColor("#4A5568");
        pdf.setFont("helvetica", "normal");
        pdf.text("Mermãs Digitais", 148, 70, { align: "center" });
      }

      // Adicionar textos nos campos configurados
      this.addTextToPDF(pdf, alunaData, config);

      return Buffer.from(pdf.output("arraybuffer"));
    } catch (error) {
      console.error("Erro ao gerar certificado:", error);
      throw error;
    }
  }

  /**
   * Adiciona textos ao PDF nas posições configuradas
   */
  private addTextToPDF(
    pdf: jsPDF,
    alunaData: AlunaData,
    config: CertificateConfig
  ): void {
    // Formatar data de conclusão
    const dataConclusao = alunaData.data_conclusao
      ? alunaData.data_conclusao.toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR");

    // Formatar CPF
    const cpfFormatado = alunaData.cpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4"
    );

    // Data de envio (hoje)
    const dataEnvio = new Date().toLocaleDateString("pt-BR");

    // Texto principal do certificado
    const textoCertificado = `Certificamos que ${alunaData.nome} (CPF: ${cpfFormatado}) concluiu com êxito o Curso de ${alunaData.curso}, realizado por Mermãs Digitais, com carga horária total de ${alunaData.carga_horaria} horas, no período de [data de início] a ${dataConclusao}.`;

    // Adicionar texto principal (centralizado)
    pdf.setFontSize(14);
    pdf.setTextColor("#2D3748");
    pdf.setFont("helvetica", "normal");

    // Dividir texto em linhas se necessário
    const maxWidth = 200; // Largura máxima em mm
    const lines = pdf.splitTextToSize(textoCertificado, maxWidth);

    // Posição inicial do texto (100px = ~26mm mais para cima)
    let yPosition = 74;

    // Adicionar cada linha
    lines.forEach((line: string) => {
      pdf.text(line, 148, yPosition, { align: "center" });
      yPosition += 8; // Espaçamento entre linhas
    });

    // Adicionar localização e data (alinhado à direita)
    yPosition += 20; // Espaço adicional
    pdf.setFontSize(12);
    pdf.setTextColor("#4A5568");

    // Calcular posição à direita (página tem 297mm de largura)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const rightMargin = pageWidth - 20; // 20mm da margem direita

    pdf.text(`Imperatriz - MA, ${dataEnvio}`, rightMargin, yPosition, {
      align: "right",
    });
  }

  /**
   * Envia certificado por email
   */
  async sendCertificate(
    alunaData: AlunaData,
    pdfBuffer: Buffer
  ): Promise<string> {
    try {
      // Configurar transporter de email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Configurar email
      const mailOptions = {
        from:
          process.env.SMTP_FROM ||
          "Mermãs Digitais <noreply@mermasdigitais.com.br>",
        to: alunaData.email,
        subject: "🎓 Certificado de Conclusão - Mermãs Digitais",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Parabéns!</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Olá, ${alunaData.nome}!</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                É com grande satisfação que entregamos seu <strong>certificado de conclusão</strong> do curso 
                <strong style="color: #667eea;">${alunaData.curso}</strong> do programa Mermãs Digitais.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                O certificado está anexado a este email e pode ser salvo ou impresso conforme necessário.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                <strong>Parabéns pela dedicação e sucesso na conclusão do curso!</strong> 🚀
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; background: #e9ecef; border-radius: 8px;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                Atenciosamente,<br>
                <strong style="color: #667eea;">Equipe Mermãs Digitais</strong>
              </p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `Certificado_${alunaData.nome.replace(/\s+/g, "_")}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      // Enviar email
      const info = await transporter.sendMail(mailOptions);
      transporter.close();

      console.log(`✅ Email enviado com sucesso para ${alunaData.email}`);
      console.log(`📧 Message ID: ${info.messageId}`);

      return info.messageId;
    } catch (error) {
      console.error(`❌ Erro ao enviar email para ${alunaData.email}:`, error);
      throw error;
    }
  }

  /**
   * Processa envio de certificados para múltiplas alunas
   */
  async sendCertificates(
    alunaIds: string[],
    dataConclusao?: Date
  ): Promise<CertificateResult[]> {
    try {
      // Configuração padrão do certificado
      const config: CertificateConfig = {
        templateUrl: "/assets/certificados/A4.png",
        posicoes: {
          nome: { x: 150, y: 180 },
          cpf: { x: 150, y: 220 },
          data: { x: 150, y: 260 },
          carga_horaria: { x: 150, y: 300 },
        },
        fontes: {
          nome: { size: 18, color: "#2D3748", family: "helvetica" },
          cpf: { size: 14, color: "#4A5568", family: "helvetica" },
          data: { size: 14, color: "#4A5568", family: "helvetica" },
          carga_horaria: { size: 14, color: "#4A5568", family: "helvetica" },
        },
      };

      // Buscar dados das alunas
      const alunasData = await this.getAlunasData(alunaIds);
      if (alunasData.length === 0) {
        throw new Error("Nenhuma aluna encontrada");
      }

      const results: CertificateResult[] = [];

      // Processar cada aluna
      for (const alunaData of alunasData) {
        try {
          // Usar data de conclusão fornecida ou da aluna
          const dataFinal =
            dataConclusao || alunaData.data_conclusao || new Date();
          const alunaComData = { ...alunaData, data_conclusao: dataFinal };

          // Gerar PDF
          const pdfBuffer = await this.generateCertificate(
            alunaComData,
            config
          );

          // Enviar email
          const messageId = await this.sendCertificate(alunaComData, pdfBuffer);

          // Por enquanto, vamos apenas logar o certificado enviado
          console.log("Certificado enviado para:", {
            alunaId: alunaData.id,
            nome: alunaData.nome,
            email: alunaData.email,
            templateUrl: config.templateUrl,
            dataConclusao: dataFinal,
          });

          results.push({
            success: true,
            alunaId: alunaData.id,
            alunaNome: alunaData.nome,
            email: alunaData.email,
            messageId,
          });

          // Delay entre envios para evitar rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(
            `Erro ao processar certificado para ${alunaData.nome}:`,
            error
          );
          results.push({
            success: false,
            alunaId: alunaData.id,
            alunaNome: alunaData.nome,
            email: alunaData.email,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Erro ao enviar certificados:", error);
      throw error;
    }
  }
}
