import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// Force Node.js runtime for nodemailer compatibility
export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o email existe na tabela monitores
    const { data: monitor, error: monitorError } = await supabase
      .from("monitores")
      .select("email")
      .eq("email", email.toLowerCase())
      .single();

    if (monitorError || !monitor) {
      return NextResponse.json(
        { error: "Email não encontrado na lista de monitores" },
        { status: 404 }
      );
    }

    // Generate unique 6-digit code with collision avoidance
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      // Use crypto.randomInt for better randomness if available, fallback to Math.random
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        // Use crypto for better randomness
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        code = (100000 + (array[0] % 900000)).toString();
      } else {
        // Fallback to Math.random with timestamp salt
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 900000);
        code = (100000 + ((random + timestamp) % 900000)).toString();
      }

      // Check if code already exists for any active verification
      const { data: existingCode } = await supabase
        .from("verification_codes")
        .select("code")
        .eq("code", code)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!existingCode) {
        break; // Code is unique, we can use it
      }

      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      console.error(
        "Failed to generate unique verification code after",
        maxAttempts,
        "attempts"
      );
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      );
    }

    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up any existing codes for this email first
    await supabase.from("verification_codes").delete().eq("email", email);

    // Store code in database
    const { error: dbError } = await supabase
      .from("verification_codes")
      .insert({
        email,
        code,
        expires_at: expires.toISOString(),
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Erro ao salvar código" },
        { status: 500 }
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
      rateDelta: 20000,
      rateLimit: 5,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });

    // Email template for monitor access - Mermãs Digitais style
    const mailOptions = {
      from:
        process.env.SMTP_FROM ||
        "Mermãs Digitais <noreply@mermasdigitais.com.br>",
      to: email,
      subject: "✨ Código de acesso - Monitor Mermãs Digitais",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Acesso - Monitor</title>
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
                Mermãs Digitais - Monitor
              </h1>
              <p style="color: white; font-size: 14px; margin: 5px 0 0 0; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                Acesso ao painel administrativo! 🚀
              </p>
            </div>

            <!-- Conteúdo principal -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #6C2EB5; font-size: 24px; font-weight: 700; margin-bottom: 10px;">
                  Olá, monitor(a)! 👋
                </h2>
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                  Aqui está seu código de acesso ao painel. Vamos monitorar as inscrições juntos!
                </p>
              </div>

              <!-- Card do código -->
              <div style="background: linear-gradient(135deg, #FF4A97, #6C2EB5); padding: 3px; border-radius: 16px; margin: 30px 0;">
                <div style="background: white; padding: 30px; text-align: center; border-radius: 13px;">
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                    Seu código de acesso
                  </p>
                  <div style="font-size: 36px; font-weight: 800; background: linear-gradient(135deg, #FF4A97, #6C2EB5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: #FF4A97; letter-spacing: 8px; margin: 20px 0;">
                    ${code}
                  </div>
                  <div style="margin-top: 20px; padding: 15px; background: rgba(255, 74, 151, 0.1); border-radius: 8px; border-left: 4px solid #FF4A97;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                      ⏰ <strong>Válido por 10 minutos</strong> - Use rapidinho!
                    </p>
                  </div>
                </div>
              </div>

              <!-- Instruções -->
              <div style="background: #f9fafb; padding: 25px; border-radius: 12px; margin: 30px 0;">
                <h3 style="color: #6C2EB5; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
                  🎯 Como acessar o painel:
                </h3>
                <ol style="color: #6b7280; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                  <li>Volte para a página de login do monitor</li>
                  <li>Digite o código de 6 dígitos acima</li>
                  <li>Clique em "Verificar" para entrar</li>
                  <li>Gerencie as inscrições com superpoderes! ⚡</li>
                </ol>
              </div>

              <!-- Call to action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #FF4A97, #6C2EB5); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 74, 151, 0.3); transition: all 0.3s ease;">
                  Acessar Painel →
                </a>
              </div>

              <!-- Mensagem especial para monitor -->
              <div style="background: linear-gradient(135deg, rgba(255, 74, 151, 0.1), rgba(108, 46, 181, 0.1)); padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0;">
                <p style="color: #6C2EB5; font-size: 16px; font-weight: 600; margin: 0;">
                  🌟 Obrigada por fazer parte da equipe Mermãs Digitais!
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">
                  Você é essencial para construir o futuro digital feminino ✨
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin-bottom: 10px;">
                Se você não solicitou este código, pode ignorar este email com segurança.
              </p>
              <div style="margin: 15px 0;">
                <a href="#" style="color: #FF4A97; text-decoration: none; margin: 0 10px; font-size: 14px;">Instagram</a>
                <span style="color: #d1d5db;">•</span>
                <a href="#" style="color: #FF4A97; text-decoration: none; margin: 0 10px; font-size: 14px;">Site</a>
                <span style="color: #d1d5db;">•</span>
                <a href="#" style="color: #FF4A97; text-decoration: none; margin: 0 10px; font-size: 14px;">Suporte</a>
              </div>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 15px;">
                © 2025 Mermãs Digitais. Construindo o futuro digital feminino.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `✨ Mermãs Digitais - Código de Acesso Monitor

Olá, monitor(a)!

Seu código de acesso ao painel é: ${code}

Este código expira em 10 minutos. Use-o para acessar o painel administrativo e gerenciar as inscrições.

Como usar:
1. Volte para a página de login do monitor
2. Digite o código de 6 dígitos acima
3. Clique em "Verificar" para entrar

Obrigada por fazer parte da equipe Mermãs Digitais! 🌟

---
© 2025 Mermãs Digitais. Construindo o futuro digital feminino.
      `,
    };

    try {
      await transporter.sendMail(mailOptions);

      return NextResponse.json({
        success: true,
        email: monitor.email,
        message: "Código de verificação enviado com sucesso",
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return NextResponse.json(
        { error: "Erro ao enviar email de verificação" },
        { status: 500 }
      );
    } finally {
      transporter.close();
    }
  } catch (error) {
    console.error("Error verifying monitor email:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
