import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Force Node.js runtime for nodemailer compatibility
export const runtime = "nodejs";

// Configuração do transporter de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Mudança de SMTP_PASSWORD para SMTP_PASS
  },
  // Configurações para resolver timeout
  connectionTimeout: 60000, // 60 segundos
  greetingTimeout: 30000, // 30 segundos
  socketTimeout: 60000, // 60 segundos
  // Configurações de TLS
  tls: {
    rejectUnauthorized: false,
    ciphers: "SSLv3",
  },
  // Pool de conexões
  pool: true,
  maxConnections: 1,
  maxMessages: 3,
  rateDelta: 20000,
  rateLimit: 5,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("MDX25: Received confirmation email request:", body);

    const { email, nomeCompleto, nomeCurso, cpf } = body;
    const isOuvinte =
      typeof nomeCurso === "string" &&
      nomeCurso.toUpperCase().includes("OUVINTE");

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
      subject: isOuvinte
        ? `🎉 Confirmação de Participação como Ouvinte - MDX25`
        : `🎉 Confirmação de Inscrição MDX25 - ${nomeCurso}`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
          <!-- Header com gradiente e logo -->
          <div style="background: linear-gradient(135deg, #6C2EB5, #FF4A97); padding: 40px 30px; text-align: center; border-radius: 15px 15px 0 0; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -30px; left: -30px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
            
            <!-- Logo MDX25 -->
            <div style="margin-bottom: 20px;">
              <img src="https://md-inscricoes.vercel.app/assets/images/mdx25/logo_mdx25.png" alt="MDX25 Logo" style="height: 80px; width: auto; filter: brightness(0) invert(1);">
            </div>
            
            <div style="background: rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 30px; display: inline-block; margin-top: 10px;">
              <span style="color: white; font-size: 18px; font-weight: 600;">✅ ${
                isOuvinte
                  ? "Participação como Ouvinte Confirmada!"
                  : "Inscrição Confirmada!"
              }</span>
            </div>
          </div>
          
          <!-- Conteúdo principal -->
          <div style="padding: 40px 30px; background-color: white;">
            <p style="font-size: 20px; color: #333; margin: 0 0 20px 0;">Olá, <strong style="color: #6C2EB5;">${nomeCompleto}</strong>! 👋</p>
            ${
              isOuvinte
                ? `<p style="font-size: 18px; color: #666; line-height: 1.6; margin: 0 0 30px 0;">Sua participação como <strong style=\"color: #FF4A97; background: linear-gradient(135deg, #FF4A97, #C769E3); -webkit-background-clip: text; -webkit-text-fill-color: transparent;\">Ouvinte</strong> no <strong>MDX25</strong> foi confirmada!</p>`
                : `<p style=\"font-size: 18px; color: #666; line-height: 1.6; margin: 0 0 30px 0;\">Sua inscrição para <strong style=\"color: #f8f9fa; background: linear-gradient(135deg, #FF4A97, #C769E3); -webkit-background-clip: text; -webkit-text-fill-color: transparent;\">${nomeCurso}</strong> foi realizada com sucesso!</p>`
            }
            
            <!-- Card de detalhes -->
            <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 30px; border-radius: 20px; margin: 30px 0; border-left: 6px solid #6C2EB5; box-shadow: 0 8px 25px rgba(108, 46, 181, 0.15);">
              <div style="display: flex; align-items: center; margin-bottom: 25px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6C2EB5, #FF4A97); border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center; margin-right: 15px;">
              <span style="color: white; font-size: 18px; display: inline-block; line-height: 1;">📋</span>
            </div>
                <h3 style="color: #6C2EB5; margin: 0; font-size: 22px; font-weight: 700;">Detalhes da Inscrição</h3>
              </div>
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                  <span style="color: #666; font-weight: 500; font-size: 16px;">Nome:</span>
                  <span style="color: #333; font-weight: 600; font-size: 16px;">${nomeCompleto}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                  <span style="color: #666; font-weight: 500; font-size: 16px;">CPF:</span>
                  <span style="color: #333; font-weight: 600; font-size: 16px;">${cpf}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                  <span style="color: #666; font-weight: 500; font-size: 16px;">Modalidade:</span>
                  <span style="color: white; font-weight: 700; background: linear-gradient(135deg, #FF4A97, #C769E3); padding: 8px 18px; border-radius: 25px; font-size: 14px; box-shadow: 0 3px 12px rgba(255, 74, 151, 0.4); text-shadow: 0 2px 4px rgba(0,0,0,0.5); letter-spacing: 0.5px;">${
                    isOuvinte ? "Ouvinte" : nomeCurso
                  }</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                  <span style="color: #666; font-weight: 500; font-size: 16px;">Status:</span>
                  <span style="color: #155724; font-weight: bold; background: linear-gradient(135deg, #d4edda, #c3e6cb); padding: 6px 16px; border-radius: 25px; font-size: 14px; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);">✅ Confirmada</span>
                </div>
              </div>
            </div>
            
            <!-- Card de próximos passos -->
            <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 30px; border-radius: 20px; margin: 30px 0; border-left: 6px solid #1976d2; box-shadow: 0 8px 25px rgba(25, 118, 210, 0.15);">
              <div style="display: flex; align-items: center; margin-bottom: 25px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #1976d2, #42a5f5); border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center; margin-right: 15px;">
              <span style="color: white; font-size: 18px; display: inline-block; line-height: 1;">📅</span>
            </div>
                <h3 style="color: #1976d2; margin: 0; font-size: 22px; font-weight: 700;">Próximos Passos</h3>
              </div>
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: center; padding: 12px 0;">
                  <div style="width: 30px; height: 30px; background: #e3f2fd; border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center; margin-right: 15px;">
                    <span style="font-size: 16px; display: inline-block; line-height: 1;">📧</span>
                  </div>
                  <span style="color: #333; font-size: 16px; font-weight: 500;">Aguarde informações sobre data e local do evento</span>
                </div>
                <div style="display: flex; align-items: center; padding: 12px 0;">
                  <div style="width: 30px; height: 30px; background: #e3f2fd; border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center; margin-right: 15px;">
                    <span style="font-size: 16px; display: inline-block; line-height: 1;">🔔</span>
                  </div>
                  <span style="color: #333; font-size: 16px; font-weight: 500;">Fique atenta ao seu email para atualizações</span>
                </div>
                <div style="display: flex; align-items: center; padding: 12px 0;">
                  <div style="width: 30px; height: 30px; background: #e3f2fd; border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center; margin-right: 15px;">
                    <span style="font-size: 16px; display: inline-block; line-height: 1;">🚀</span>
                  </div>
                  <span style="color: #333; font-size: 16px; font-weight: 500;">Prepare-se para uma experiência incrível!</span>
                </div>
                <div style="display: flex; align-items: center; padding: 12px 0;">
                  <div style="width: 30px; height: 30px; background: #e3f2fd; border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center; margin-right: 15px;">
                    <span style="font-size: 16px; display: inline-block; line-height: 1;">👥</span>
                  </div>
                  <span style="color: #333; font-size: 16px; font-weight: 500;">Conecte-se com outras participantes nas redes sociais</span>
                </div>
              </div>
            </div>
            
            <!-- Mensagem motivacional -->
            <div style="background: linear-gradient(135deg, #FF4A97, #C769E3); padding: 35px; border-radius: 20px; margin: 30px 0; text-align: center; color: white; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
              <div style="position: absolute; bottom: -15px; left: -15px; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
              <div style="position: relative; z-index: 1;">
                <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center; margin-bottom: 20px;">
                  <span style="font-size: 24px; display: inline-block; line-height: 1;">🌟</span>
                </div>
                <h3 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Você está pronta para brilhar!</h3>
                <p style="margin: 0; font-size: 18px; line-height: 1.6; opacity: 0.95; font-weight: 500;">
                  O MDX25 é mais que um evento - é uma oportunidade de transformar ideias em realidade e conectar-se com uma comunidade incrível de mulheres na tecnologia.
                </p>
              </div>
            </div>
            
            <p style="font-size: 16px; color: #666; line-height: 1.6; text-align: center; margin: 30px 0 0 0;">
              Em breve você receberá mais informações sobre o evento, incluindo data, local e horário.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: linear-gradient(135deg, #6C2EB5, #4a1a8a); padding: 40px 30px; text-align: center; border-radius: 0 0 20px 20px; color: white; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -30px; left: -30px; width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -20px; right: -20px; width: 60px; height: 60px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
            <div style="position: relative; z-index: 1;">
              <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.15); border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center; margin-bottom: 20px;">
                <span style="font-size: 20px; display: inline-block; line-height: 1;">💜</span>
              </div>
              <h3 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Equipe Mermãs Digitais</h3>
              <p style="margin: 0 0 25px 0; font-size: 18px; opacity: 0.9; font-weight: 500;">Construindo o futuro digital feminino</p>
              <div style="border-top: 2px solid rgba(255,255,255,0.2); padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 14px; opacity: 0.8; font-weight: 400;">
                  Este é um email automático. Por favor, não responda a esta mensagem.
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
    };

    console.log("MDX25: Sending confirmation email to:", email);

    // Tentar enviar email com retry
    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        await transporter.sendMail(mailOptions);
        console.log("MDX25: Confirmation email sent successfully");
        break; // Sucesso, sair do loop
      } catch (error) {
        lastError = error;
        retries--;
        console.log(
          `MDX25: Tentativa de envio falhou, ${retries} tentativas restantes:`,
          error
        );

        if (retries > 0) {
          // Aguardar antes de tentar novamente
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (retries === 0) {
      throw lastError;
    }

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
