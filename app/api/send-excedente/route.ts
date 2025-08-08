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
    const body = await request.json();
    console.log("Received excedente email request:", body);

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

    // Send excedente email
    const mailOptions = {
      from:
        process.env.SMTP_FROM ||
        "Mermãs Digitais <noreply@mermasdigitais.com.br>",
      to: email,
      subject: "💜 Você está na lista de excedentes - Mermãs Digitais",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Lista de Excedentes - Mermãs Digitais</title>
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
              padding-top: 280px;
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
                Você está na lista de excedentes 💜
              </div>
              <div
                style="
                  margin-bottom: 16px;
                  line-height: 1.6;
                  font-family: Poppins, sans-serif;
                "
              >
                Agradecemos muito pelo seu interesse em participar do projeto Mermãs Digitais
              </div>
              
              <div
                style="
                  margin-bottom: 16px;
                  line-height: 1.6;
                  font-family: Poppins, sans-serif;
                "
              >
                No momento, você está como excedente. Isso significa que, se surgirem novas vagas, poderemos te chamar para participar das atividades. Fique de olho no seu e-mail e em nossas redes sociais para novidades!
              </div>
              
              <!-- Botão de ação -->
              <div style="
                margin: 25px 0;
                text-align: center;
              ">
                <a href="${trackingLink}" 
                   style="
                     display: inline-block;
                     background: linear-gradient(135deg, #FFCD34, #FF4A97);
                     color: white;
                     padding: 14px 28px;
                     text-decoration: none;
                     border-radius: 25px;
                     font-weight: 600;
                     font-size: 14px;
                     font-family: Poppins, sans-serif;
                     box-shadow: 0 4px 15px rgba(255, 205, 52, 0.3);
                     transition: all 0.3s ease;
                   "
                   onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 205, 52, 0.4)'"
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255, 205, 52, 0.3)'"
                >
                  Acompanhar Inscrição →
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
                ✨ <strong>Continue acompanhando!</strong> - Novas oportunidades podem surgir a qualquer momento!
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `💜 Você está na lista de excedentes - Mermãs Digitais

Olá, Mermã!

Você está na lista de excedentes 💜

Agradecemos muito pelo seu interesse em participar do projeto Mermãs Digitais

No momento, você está como excedente. Isso significa que, se surgirem novas vagas, poderemos te chamar para participar das atividades. Fique de olho no seu e-mail e em nossas redes sociais para novidades!

Acompanhe sua inscrição em: ${trackingLink}

✨ Continue acompanhando! - Novas oportunidades podem surgir a qualquer momento!

---
Mermãs Digitais
Construindo o futuro digital feminino`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Excedente email sent successfully:", info.messageId);

    // Close the transporter
    transporter.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending excedente email:", error);

    let errorMessage = "Erro ao enviar email de excedente";
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
