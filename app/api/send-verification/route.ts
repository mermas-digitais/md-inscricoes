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
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
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

    // Configure nodemailer with better settings for serverless
    const transporter = nodemailer.createTransport({
      // Explicitly specify the transport type as SMTP
      // This helps TypeScript recognize the SMTP options
      // @ts-expect-error: Type definitions may not include all SMTP options
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: false, // Disable connection pooling
      maxConnections: 1,
      maxMessages: 1,
      rateDelta: 1000,
      rateLimit: 1,
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
      debug: process.env.NODE_ENV === "development",
      logger: process.env.NODE_ENV === "development",
    });

    // Verify connection before sending
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
      // Continue anyway, sometimes verify fails but sending works
    }

    // Send email
    const mailOptions = {
      from:
        process.env.SMTP_FROM ||
        "Mermãs Digitais <noreply@mermasdigitais.com.br>",
      to: email,
      subject: "💜 Confirme seu e-mail - Mermãs Digitais",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Código de Verificação</title>
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
                   max-width: 500px;
                   font-family: 'Poppins', sans-serif;
                   color: #000;
                   font-size: 14px;
                   box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
                   font-family: Poppins, sans-serif;
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
                Confirme seu e-mail 💜
              </div>
              <div
                style="
                  margin-bottom: 16px;
                  line-height: 1.6;
                  font-family: Poppins, sans-serif;
                "
              >
                Olá! Para concluir sua inscrição no projeto Mermãs Digitais,
                precisamos confirmar seu e-mail.
              </div>
                                                           <div
                  style="
                    text-align: center;
                    margin: 20px 0;
                  "
                >
                  <strong
                    style="
                      color: #3e1363;
                      font-size: large;
                      background: #f8f9fa;
                      padding: 12px 20px;
                      border-radius: 8px;
                      letter-spacing: 2px;
                      text-align: center;
                      display: inline-block;
                      box-sizing: border-box;
                    "
                    >${code}</strong
                  >
                </div>
                                                           <div style="line-height: 1.6; font-family: Poppins, sans-serif">
                  Insira este código no site para continuar sua inscrição: 
                  <a href="${
                    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                  }/inscricao" 
                     style="color: #9854cb; text-decoration: none; font-weight: 600;">
                    ${
                      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                    }/inscricao
                  </a>
                </div>
               
               <!-- Botão de ação -->
               <div style="
                 margin: 25px 0;
                 text-align: center;
               ">
                 <a href="${
                   process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                 }/inscricao" 
                    style="
                      display: inline-block;
                      background: linear-gradient(135deg, #9854cb, #3e1363);
                      color: white;
                      padding: 14px 28px;
                      text-decoration: none;
                      border-radius: 25px;
                      font-weight: 600;
                      font-size: 14px;
                      font-family: Poppins, sans-serif;
                      box-shadow: 0 4px 15px rgba(152, 84, 203, 0.3);
                      transition: all 0.3s ease;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(152, 84, 203, 0.4)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(152, 84, 203, 0.3)'"
                 >
                   Continuar Inscrição →
                 </a>
               </div>
               
               <!-- Informação adicional -->
               <div style="
                 margin-top: 20px;
                 padding: 12px;
                 background: rgba(152, 84, 203, 0.1);
                 border-radius: 8px;
                 border-left: 3px solid #9854cb;
                 font-size: 12px;
                 color: #6b7280;
                 font-family: Poppins, sans-serif;
               ">
                 ⏰ <strong>Válido por 10 minutos</strong> - Use rapidinho!
               </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `✨ Mermãs Digitais - Código de Verificação

Olá!

Seu código de verificação é: ${code}

Este código expira em 10 minutos. Use-o para confirmar seu email e continuar sua inscrição.

Se você não solicitou este código, ignore este email.

---
Mermãs Digitais
Construindo o futuro digital feminino`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);

    // Close the transporter
    transporter.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending verification email:", error);

    // Provide more specific error messages
    let errorMessage = "Erro ao enviar email";
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
