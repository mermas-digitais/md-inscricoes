import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

// Force Node.js runtime for nodemailer compatibility
export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, nomeCompleto, nomeCurso, cpf } = await request.json();

    if (!email || !nomeCompleto || !nomeCurso || !cpf) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      );
    }

    // Configure nodemailer
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

    // Verify connection
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
    }

    // Create tracking link
    const trackingLink = `${
      process.env.NEXTAUTH_URL || "https://md-inscricoes.vercel.app"
    }/acompanhar?cpf=${encodeURIComponent(cpf)}`;

    // Send confirmation email
    const mailOptions = {
      from:
        process.env.SMTP_FROM ||
        "Mermãs Digitais <noreply@mermasdigitais.com.br>",
      to: email,
      subject: "🎉 Inscrição confirmada - Mermãs Digitais",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Inscrição Confirmada</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            
            <!-- Header com fundo arco-íris -->
            <div style="background: linear-gradient(135deg, #FFD700, #FFA500, #FF69B4, #FF1493); padding: 25px 20px; text-align: center; border-bottom: 3px solid #FF4A97;">
              <!-- Logo da Mermãs Digitais -->
              <div style="margin-bottom: 15px;">
                <img src="https://yibtbjjamezyxbepdnnw.supabase.co/storage/v1/object/public/asset/logo_asset.png" alt="Mermãs Digitais" style="height: 35px; max-width: 180px; object-fit: contain;" />
              </div>
              
              <h1 style="color: white; font-size: 22px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                Mermãs Digitais
              </h1>
              <p style="color: white; font-size: 14px; margin: 5px 0 0 0; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                Bem-vinda à nossa comunidade! 🎉
              </p>
            </div>

            <!-- Conteúdo principal -->
            <div style="padding: 40px 30px;">
              
              <!-- Celebração -->
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
                <h2 style="color: #6C2EB5; font-size: 28px; font-weight: 700; margin-bottom: 10px;">
                  Parabéns, ${nomeCompleto.split(" ")[0]}!
                </h2>
                <p style="color: #6b7280; font-size: 18px; line-height: 1.6;">
                  Sua inscrição foi confirmada com sucesso!
                </p>
              </div>

              <!-- Detalhes do curso -->
              <div style="background: linear-gradient(135deg, #FF4A97, #6C2EB5); padding: 3px; border-radius: 16px; margin: 30px 0;">
                <div style="background: white; padding: 30px; border-radius: 13px;">
                  <div style="text-align: center; margin-bottom: 25px;">
                    <h3 style="color: #6C2EB5; font-size: 20px; font-weight: 700; margin-bottom: 10px;">
                      📚 Curso Selecionado
                    </h3>
                    <div style="font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #FF4A97, #6C2EB5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: #FF4A97; margin: 15px 0;">
                      ${nomeCurso}
                    </div>
                  </div>
                  
                  <!-- Status da inscrição -->
                  <div style="background: rgba(34, 197, 94, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #22c55e; margin-top: 25px;">
                    <div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 10px;">
                      <span style="font-size: 20px;">✅</span>
                      <span style="color: #15803d; font-weight: 600; font-size: 16px;">
                        Status: Inscrição Confirmada
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Próximos passos -->
              <div style="background: #f9fafb; padding: 30px; border-radius: 16px; margin: 30px 0;">
                <h3 style="color: #6C2EB5; font-size: 20px; font-weight: 700; margin-bottom: 20px; text-align: center;">
                  🚀 Próximos Passos
                </h3>
                <div style="space-y: 15px;">
                  <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                    <span style="color: #FF4A97; font-size: 20px; margin-right: 15px; margin-top: 2px;">1️⃣</span>
                    <p style="color: #374151; font-size: 15px; margin: 0; line-height: 1.6;">
                      <strong>Fique atenta ao seu email</strong> - Enviaremos mais detalhes sobre o curso em breve
                    </p>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                    <span style="color: #FF4A97; font-size: 20px; margin-right: 15px; margin-top: 2px;">2️⃣</span>
                    <p style="color: #374151; font-size: 15px; margin: 0; line-height: 1.6;">
                      <strong>Acompanhe sua inscrição</strong> - Use o link abaixo para verificar o status
                    </p>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                    <span style="color: #FF4A97; font-size: 20px; margin-right: 15px; margin-top: 2px;">3️⃣</span>
                    <p style="color: #374151; font-size: 15px; margin: 0; line-height: 1.6;">
                      <strong>Siga-nos nas redes sociais</strong> - Para novidades e conteúdos exclusivos
                    </p>
                  </div>
                </div>
              </div>

              <!-- Botão de acompanhamento -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${trackingLink}" style="display: inline-block; background: linear-gradient(135deg, #FFD700, #FFA500, #FF69B4, #FF1493); color: white; padding: 18px 35px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 25px rgba(255, 74, 151, 0.4); transition: all 0.3s ease; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  📋 Acompanhar Minha Inscrição
                </a>
              </div>

              <!-- Mensagem especial -->
              <div style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 105, 180, 0.1)); padding: 25px; border-radius: 16px; text-align: center; margin: 30px 0; border: 2px solid rgba(255, 74, 151, 0.2);">
                <h4 style="color: #6C2EB5; font-size: 18px; font-weight: 700; margin-bottom: 15px;">
                  💝 Bem-vinda à família Mermãs Digitais!
                </h4>
                <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 0;">
                  Você acabou de dar um passo importante rumo ao seu futuro digital. 
                  Nossa missão é emponderar mulheres através da tecnologia, e estamos 
                  animadas para ter você conosco nessa jornada transformadora! ✨
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; margin-bottom: 15px;">
                Este email foi enviado para confirmar sua inscrição. Guarde-o para consultas futuras.
              </p>
              <div style="margin: 20px 0;">
                <a href="#" style="color: #FF4A97; text-decoration: none; margin: 0 15px; font-size: 14px; font-weight: 500;">📸 Instagram</a>
                <span style="color: #d1d5db;">•</span>
                <a href="#" style="color: #FF4A97; text-decoration: none; margin: 0 15px; font-size: 14px; font-weight: 500;">🌐 Site</a>
                <span style="color: #d1d5db;">•</span>
                <a href="#" style="color: #FF4A97; text-decoration: none; margin: 0 15px; font-size: 14px; font-weight: 500;">💬 Suporte</a>
              </div>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                © 2025 Mermãs Digitais. Construindo o futuro digital feminino. 💪✨
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `🎉 Inscrição Confirmada - Mermãs Digitais

Parabéns, ${nomeCompleto.split(" ")[0]}!

Sua inscrição foi confirmada com sucesso para o curso: ${nomeCurso}

Status: ✅ Inscrição Confirmada

Próximos passos:
1️⃣ Fique atenta ao seu email - Enviaremos mais detalhes sobre o curso em breve
2️⃣ Acompanhe sua inscrição em: ${trackingLink}
3️⃣ Siga-nos nas redes sociais para novidades e conteúdos exclusivos

Bem-vinda à família Mermãs Digitais! 💝

Você acabou de dar um passo importante rumo ao seu futuro digital. Nossa missão é emponderar mulheres através da tecnologia, e estamos animadas para ter você conosco nessa jornada transformadora!

---
Mermãs Digitais
Construindo o futuro digital feminino`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent successfully:", info.messageId);

    // Close the transporter
    transporter.close();

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
