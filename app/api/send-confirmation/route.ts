import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Force Node.js runtime for nodemailer compatibility
export const runtime = "nodejs";

// Configuração do transporter de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  tls: {
    rejectUnauthorized: false,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received confirmation email request:", body);

    const { email, nomeCompleto, nomeCurso, cpf } = body;

    if (!email || !nomeCompleto || !nomeCurso || !cpf) {
      console.error("Missing required fields:", {
        email: !!email,
        nomeCompleto: !!nomeCompleto,
        nomeCurso: !!nomeCurso,
        cpf: !!cpf,
      });
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      );
    }

    // Enviar email de confirmação diretamente
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Confirmação de Inscrição - ${nomeCurso}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6C2EB5;">Inscrição Confirmada!</h2>
          <p>Olá, <strong>${nomeCompleto}</strong>!</p>
          <p>Sua inscrição para <strong>${nomeCurso}</strong> foi realizada com sucesso!</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Nome:</strong> ${nomeCompleto}</p>
            <p style="margin: 5px 0;"><strong>CPF:</strong> ${cpf}</p>
            <p style="margin: 5px 0;"><strong>Curso:</strong> ${nomeCurso}</p>
          </div>
          <p>Em breve você receberá mais informações sobre o evento.</p>
          <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe Mermãs Digitais</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    const result = { success: true };

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erro ao enviar email de confirmação" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending confirmation email:", error);

    let errorMessage = "Erro ao enviar email de confirmação";
    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND")) {
        errorMessage = "Erro de conexão com servidor SMTP";
      } else if (error.message.includes("authentication")) {
        errorMessage = "Erro de autenticação SMTP";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Timeout na conexão SMTP";
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
