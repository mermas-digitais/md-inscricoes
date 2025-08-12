import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface InscricaoData {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  data_nascimento: string;
  escolaridade: string;
  situacao_trabalho: string;
  renda_familiar: string;
  motivacao: string;
  experiencia_tech: string;
  disponibilidade: string;
  como_conheceu: string;
  created_at: string;
  [key: string]: any;
}

function replaceVariables(template: string, data: InscricaoData): string {
  let result = template;

  // Substituir variáveis padrão
  const variables = {
    "{{nome}}": data.nome || "",
    "{{email}}": data.email || "",
    "{{telefone}}": data.telefone || "",
    "{{endereco}}": data.endereco || "",
    "{{bairro}}": data.bairro || "",
    "{{cep}}": data.cep || "",
    "{{cidade}}": data.cidade || "",
    "{{estado}}": data.estado || "",
    "{{data_nascimento}}": data.data_nascimento || "",
    "{{escolaridade}}": data.escolaridade || "",
    "{{situacao_trabalho}}": data.situacao_trabalho || "",
    "{{renda_familiar}}": data.renda_familiar || "",
    "{{motivacao}}": data.motivacao || "",
    "{{experiencia_tech}}": data.experiencia_tech || "",
    "{{disponibilidade}}": data.disponibilidade || "",
    "{{como_conheceu}}": data.como_conheceu || "",
    "{{data_inscricao}}":
      new Date(data.created_at).toLocaleDateString("pt-BR") || "",
  };

  // Substituir todas as variáveis
  Object.entries(variables).forEach(([variable, value]) => {
    result = result.replace(new RegExp(variable, "g"), value);
  });

  return result;
}

function createEmailTemplate(
  subject: string,
  htmlContent: string,
  textContent: string
): EmailTemplate {
  // Usar o mesmo estilo visual do email de verificação
  const styledHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
        rel="stylesheet"
      />
    </head>
    <body
      style="
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        background-color: #9854cb;
        color: #212529;
        width: 100vw;
        min-height: 100vh;
      "
    >
      <div
        style="
          background-image: url('https://yibtbjjamezyxbepdnnw.supabase.co/storage/v1/object/public/asset//email_asset.png');
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center;
          width: 100vw;
          min-height: 100vh;
          position: relative;
          padding: 40px;
          box-sizing: border-box;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 220px;
          padding-bottom: 150px;
        "
      >
        <div
          style="
            background: white;
            border-radius: 12px;
            padding: 24px 20px;
            width: 100%;
            max-width: 600px;
            font-family: 'Poppins', sans-serif;
            color: #000;
            font-size: 14px;
            box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 1;
            box-sizing: border-box;
            min-height: fit-content;
          "
        >
          <div
            style="
              color: #d63384;
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
              text-transform: uppercase;
              font-family: Poppins, sans-serif;
            "
          >
            Olá, Mermã!
          </div>
          <div
            style="
              font-size: 20px;
              font-weight: 700;
              color: #3e1363;
              margin-bottom: 20px;
              font-family: Poppins, sans-serif;
            "
          >
            ${subject}
          </div>
          <div
            style="
              margin-bottom: 16px;
              line-height: 1.6;
              font-family: Poppins, sans-serif;
            "
          >
            ${htmlContent}
          </div>
          
          <!-- Logo -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <img src="https://yibtbjjamezyxbepdnnw.supabase.co/storage/v1/object/public/asset/logo_asset.png" alt="Mermãs Digitais" style="height: 35px; max-width: 180px; object-fit: contain;" />
            <div style="margin-top: 10px; font-size: 12px; color: #6b7280; font-family: Poppins, sans-serif;">
              Construindo o futuro digital feminino 💜
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    subject,
    html: styledHtml,
    text: textContent,
  };
}

export async function POST(request: NextRequest) {
  try {
    const {
      subject,
      htmlContent,
      textContent,
      recipients = "all",
      filters = {},
    } = await request.json();

    // Validação básica
    if (!subject || !htmlContent) {
      return NextResponse.json(
        { error: "Assunto e conteúdo HTML são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar inscrições baseado nos filtros
    let query = supabase.from("inscricoes").select("*");

    // Aplicar filtros se fornecidos
    if (filters.escolaridade) {
      query = query.eq("escolaridade", filters.escolaridade);
    }
    if (filters.situacao_trabalho) {
      query = query.eq("situacao_trabalho", filters.situacao_trabalho);
    }
    if (filters.cidade) {
      query = query.ilike("cidade", `%${filters.cidade}%`);
    }
    if (filters.estado) {
      query = query.eq("estado", filters.estado);
    }
    if (filters.experiencia_tech) {
      query = query.eq("experiencia_tech", filters.experiencia_tech);
    }

    const { data: inscricoes, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao buscar inscrições" },
        { status: 500 }
      );
    }

    if (!inscricoes || inscricoes.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma inscrição encontrada com os filtros aplicados" },
        { status: 404 }
      );
    }

    // Configurar transporter (reutilizando configuração do send-verification)
    const transporter = nodemailer.createTransport({
      // @ts-expect-error: Type definitions may not include all SMTP options
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: false,
      maxConnections: 1,
      maxMessages: 1,
      rateDelta: 1000,
      rateLimit: 1,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      tls: {
        rejectUnauthorized: false,
      },
      debug: process.env.NODE_ENV === "development",
      logger: process.env.NODE_ENV === "development",
    });

    // Verificar conexão
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
    }

    // Enviar emails
    const results = [];
    const errors = [];

    for (const inscricao of inscricoes) {
      try {
        // Substituir variáveis no template
        const personalizedSubject = replaceVariables(subject, inscricao);
        const personalizedHtmlContent = replaceVariables(
          htmlContent,
          inscricao
        );
        const personalizedTextContent = replaceVariables(
          textContent || htmlContent.replace(/<[^>]*>/g, ""),
          inscricao
        );

        const template = createEmailTemplate(
          personalizedSubject,
          personalizedHtmlContent,
          personalizedTextContent
        );

        const mailOptions = {
          from:
            process.env.SMTP_FROM ||
            "Mermãs Digitais <noreply@mermasdigitais.com.br>",
          to: inscricao.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        };

        const info = await transporter.sendMail(mailOptions);
        results.push({
          email: inscricao.email,
          nome: inscricao.nome,
          success: true,
          messageId: info.messageId,
        });

        // Delay entre envios para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (emailError) {
        console.error(`Error sending email to ${inscricao.email}:`, emailError);
        errors.push({
          email: inscricao.email,
          nome: inscricao.nome,
          error:
            emailError instanceof Error
              ? emailError.message
              : "Erro desconhecido",
        });
      }
    }

    // Fechar transporter
    transporter.close();

    return NextResponse.json({
      success: true,
      totalRecipients: inscricoes.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error("Error sending mass email:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
