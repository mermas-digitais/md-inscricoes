import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createClient } from "@supabase/supabase-js"

// Force Node.js runtime for nodemailer compatibility
export const runtime = "nodejs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store code in database
    const { error: dbError } = await supabase.from("verification_codes").upsert({
      email,
      code,
      expires_at: expires.toISOString(),
      created_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Erro ao salvar código" }, { status: 500 })
    }

    // Configure nodemailer with better settings for serverless
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Add these options to help with serverless environments
      pool: false, // Disable connection pooling
      maxConnections: 1,
      maxMessages: 1,
      rateDelta: 1000,
      rateLimit: 1,
      // Timeout settings
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
      // TLS options
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
      // Debug options (remove in production)
      debug: process.env.NODE_ENV === "development",
      logger: process.env.NODE_ENV === "development",
    })

    // Verify connection before sending
    try {
      await transporter.verify()
      console.log("SMTP connection verified successfully")
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError)
      // Continue anyway, sometimes verify fails but sending works
    }

    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM || "Mermãs Digitais <noreply@mermasdigitais.com.br>",
      to: email,
      subject: "Código de verificação - Mermãs Digitais",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Mermãs Digitais</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #374151; margin-bottom: 20px;">Seu código de verificação</h2>
            <p style="color: #6b7280; margin-bottom: 30px;">
              Use o código abaixo para confirmar seu email e continuar sua inscrição:
            </p>
            <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #ec4899; letter-spacing: 8px;">${code}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Este código expira em 10 minutos. Se você não solicitou este código, ignore este email.
            </p>
          </div>
        </div>
      `,
      text: `Seu código de verificação do Mermãs Digitais é: ${code}. Este código expira em 10 minutos.`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.messageId)

    // Close the transporter
    transporter.close()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending verification email:", error)

    // Provide more specific error messages
    let errorMessage = "Erro ao enviar email"
    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND")) {
        errorMessage = "Erro de conexão com servidor SMTP"
      } else if (error.message.includes("authentication")) {
        errorMessage = "Erro de autenticação SMTP"
      } else if (error.message.includes("timeout")) {
        errorMessage = "Timeout na conexão SMTP"
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
