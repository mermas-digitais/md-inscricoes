import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

// Force Node.js runtime for nodemailer compatibility
export const runtime = "nodejs";

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
      const existingCode = await prisma.verificationCodes.findFirst({
        where: {
          code: code,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

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
    await prisma.verificationCodes.deleteMany({
      where: { email: email },
    });

    // Store code in database
    try {
      await prisma.verificationCodes.create({
        data: {
          email,
          code,
          expiresAt: expires,
        },
      });
      console.log(`MDX25 Verification code for ${email}: ${code}`);
    } catch (dbError) {
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
      console.log("MDX25 SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("MDX25 SMTP verification failed:", verifyError);
      // Continue anyway, sometimes verify fails but sending works
    }

    // Send email
    const mailOptions = {
      from:
        process.env.SMTP_FROM ||
        "MDX25 - Mermãs Digitais <noreply@mermasdigitais.com.br>",
      to: email,
      subject: "MDX25 - Código de Verificação",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>MDX25 - Código de Verificação</title>
          <style>
            body {
              font-family: 'Poppins', Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f8f9fa;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #FF4A97 0%, #C769E3 50%, #6C2EB5 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 16px;
              opacity: 0.9;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .code-container {
              background: linear-gradient(135deg, #FF4A97 0%, #C769E3 50%, #6C2EB5 100%);
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
              box-shadow: 0 4px 15px rgba(255, 74, 151, 0.3);
            }
            .code {
              font-size: 36px;
              font-weight: 700;
              color: white;
              letter-spacing: 8px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
              margin: 0;
            }
            .instructions {
              color: #6c757d;
              font-size: 16px;
              line-height: 1.6;
              margin: 20px 0;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              color: #856404;
              font-size: 14px;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 30px;
              text-align: center;
              color: #6c757d;
              font-size: 14px;
              border-top: 1px solid #e9ecef;
            }
            .footer p {
              margin: 0;
            }
            .highlight {
              color: #FF4A97;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 MDX25</h1>
              <p>Mermãs Digitais Experience 2025</p>
            </div>
            
            <div class="content">
              <h2 style="color: #6C2EB5; margin-bottom: 20px;">Código de Verificação</h2>
              
              <div class="code-container">
                <p class="code">${code}</p>
              </div>
              
              <div class="instructions">
                <p>Use este código para continuar sua inscrição no <span class="highlight">MDX25</span>.</p>
                <p>Este código é válido por <strong>10 minutos</strong> e pode ser usado apenas uma vez.</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Não compartilhe este código com ninguém. 
                A equipe do MDX25 nunca solicitará seu código de verificação por telefone ou WhatsApp.
              </div>
            </div>
            
            <div class="footer">
              <p><strong>MDX25 - Mermãs Digitais</strong></p>
              <p>Construindo o futuro digital feminino</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
MDX25 - Mermãs Digitais Experience 2025

Código de Verificação: ${code}

Use este código para continuar sua inscrição no MDX25.

Este código é válido por 10 minutos e pode ser usado apenas uma vez.

⚠️ Importante: Não compartilhe este código com ninguém. 
A equipe do MDX25 nunca solicitará seu código de verificação por telefone ou WhatsApp.

MDX25 - Mermãs Digitais
Construindo o futuro digital feminino`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("MDX25 Email sent successfully:", info.messageId);

    // Close the transporter
    transporter.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending MDX25 verification email:", error);

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
