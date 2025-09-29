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
    console.log("MDX25: Received confirmation email request:", body);

    const { email, nomeCompleto, nomeCurso, cpf } = body;

    if (!email || !nomeCompleto || !nomeCurso || !cpf) {
      console.error("MDX25: Missing required fields:", {
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

    // Enviar email de confirmação MDX25
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `🎉 Confirmação de Inscrição MDX25 - ${nomeCurso}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #6C2EB5, #FF4A97); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 MDX25 - Mermãs Digitais</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Inscrição Confirmada!</p>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <p style="font-size: 18px; color: #333;">Olá, <strong style="color: #6C2EB5;">${nomeCompleto}</strong>!</p>
            <p style="font-size: 16px; color: #666; line-height: 1.6;">
              Sua inscrição para <strong style="color: #FF4A97;">${nomeCurso}</strong> foi realizada com sucesso!
            </p>
            
            <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #6C2EB5;">
              <h3 style="color: #6C2EB5; margin: 0 0 15px 0; font-size: 18px;">📋 Detalhes da Inscrição</h3>
              <p style="margin: 8px 0; color: #333;"><strong>Nome:</strong> ${nomeCompleto}</p>
              <p style="margin: 8px 0; color: #333;"><strong>CPF:</strong> ${cpf}</p>
              <p style="margin: 8px 0; color: #333;"><strong>Modalidade:</strong> ${nomeCurso}</p>
              <p style="margin: 8px 0; color: #333;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✅ Confirmada</span></p>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 10px; margin: 25px 0;">
              <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 16px;">📅 Próximos Passos</h3>
              <ul style="color: #333; margin: 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Aguarde informações sobre data e local do evento</li>
                <li style="margin: 8px 0;">Fique atenta ao seu email para atualizações</li>
                <li style="margin: 8px 0;">Prepare-se para uma experiência incrível!</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; color: #666; line-height: 1.6;">
              Em breve você receberá mais informações sobre o evento, incluindo data, local e horário.
            </p>
          </div>
          
          <div style="background-color: #6C2EB5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: white; margin: 0; font-size: 16px;">
              <strong>Equipe Mermãs Digitais</strong><br>
              <span style="font-size: 14px; opacity: 0.9;">Construindo o futuro digital feminino</span>
            </p>
          </div>
        </div>
      `,
    };

    console.log("MDX25: Sending confirmation email to:", email);
    await transporter.sendMail(mailOptions);
    console.log("MDX25: Confirmation email sent successfully");

    return NextResponse.json({
      success: true,
      message: "Email de confirmação MDX25 enviado com sucesso!",
    });
  } catch (error) {
    console.error("MDX25: Error sending confirmation email:", error);

    let errorMessage = "Erro ao enviar email de confirmação MDX25";
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
