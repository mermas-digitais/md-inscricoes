// import { type NextRequest, NextResponse } from "next/server";
// import nodemailer from "nodemailer";
// import { createClient } from "@supabase/supabase-js";

// // Force Node.js runtime for nodemailer compatibility
// export const runtime = "nodejs";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// export async function POST(request: NextRequest) {
//   try {
//     const { email } = await request.json();

//     if (!email) {
//       return NextResponse.json(
//         { error: "Email é obrigatório" },
//         { status: 400 }
//       );
//     }

//     // Verificar se o email existe na tabela monitores
//     const { data: monitor, error: monitorError } = await supabase
//       .from("monitores")
//       .select("email")
//       .eq("email", email.toLowerCase())
//       .single();

//     if (monitorError || !monitor) {
//       return NextResponse.json(
//         { error: "Email não encontrado na lista de monitores" },
//         { status: 404 }
//       );
//     }

//     // Generate unique 6-digit code with collision avoidance
//     let code: string;
//     let attempts = 0;
//     const maxAttempts = 10;

//     do {
//       // Use crypto.randomInt for better randomness if available, fallback to Math.random
//       if (typeof crypto !== "undefined" && crypto.getRandomValues) {
//         // Use crypto for better randomness
//         const array = new Uint32Array(1);
//         crypto.getRandomValues(array);
//         code = (100000 + (array[0] % 900000)).toString();
//       } else {
//         // Fallback to Math.random with timestamp salt
//         const timestamp = Date.now();
//         const random = Math.floor(Math.random() * 900000);
//         code = (100000 + ((random + timestamp) % 900000)).toString();
//       }

//       // Check if code already exists for any active verification
//       const { data: existingCode } = await supabase
//         .from("verification_codes")
//         .select("code")
//         .eq("code", code)
//         .gt("expires_at", new Date().toISOString())
//         .single();

//       if (!existingCode) {
//         break; // Code is unique, we can use it
//       }

//       attempts++;
//     } while (attempts < maxAttempts);

//     if (attempts >= maxAttempts) {
//       console.error(
//         "Failed to generate unique verification code after",
//         maxAttempts,
//         "attempts"
//       );
//       return NextResponse.json(
//         { error: "Erro interno do servidor" },
//         { status: 500 }
//       );
//     }

//     const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//     // Clean up any existing codes for this email first
//     await supabase.from("verification_codes").delete().eq("email", email);

//     // Store code in database
//     const { error: dbError } = await supabase
//       .from("verification_codes")
//       .insert({
//         email,
//         code,
//         expires_at: expires.toISOString(),
//         created_at: new Date().toISOString(),
//       });

//     if (dbError) {
//       console.error("Database error:", dbError);
//       return NextResponse.json(
//         { error: "Erro ao salvar código" },
//         { status: 500 }
//       );
//     }

//     // Configure nodemailer
//     const transporter = nodemailer.createTransport({
//       // @ts-expect-error: Type definitions may not include all SMTP options
//       host: process.env.SMTP_HOST,
//       port: Number.parseInt(process.env.SMTP_PORT || "587"),
//       secure: process.env.SMTP_PORT === "465",
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//       pool: false,
//       maxConnections: 1,
//       rateDelta: 20000,
//       rateLimit: 5,
//       connectionTimeout: 60000,
//       greetingTimeout: 30000,
//       socketTimeout: 60000,
//     });

//     // Email template specifically for monitor access
//     const mailOptions = {
//       from: {
//         name: "MD Inscrições 2025",
//         address: process.env.SMTP_FROM || process.env.SMTP_USER || "",
//       },
//       to: email,
//       subject: "🔐 Código de Acesso - Painel do Monitor",
//       html: `
//         <!DOCTYPE html>
//         <html>
//         <head>
//             <meta charset="utf-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <title>Código de Acesso - Monitor</title>
//         </head>
//         <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
//             <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; min-height: 100vh;">
//                 <!-- Header with Rainbow Gradient -->
//                 <div style="background: linear-gradient(90deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #f9ca24 75%, #f0932b 100%); padding: 2px;">
//                     <div style="background-color: #ffffff; padding: 40px 30px; text-align: center;">
//                         <h1 style="color: #2d3748; margin: 0; font-size: 32px; font-weight: bold;">
//                             🔐 Acesso ao Painel
//                         </h1>
//                         <p style="color: #718096; margin: 10px 0 0 0; font-size: 16px;">
//                             Monitor - MD Inscrições 2025
//                         </p>
//                     </div>
//                 </div>
                
//                 <!-- Content -->
//                 <div style="padding: 40px 30px;">
//                     <div style="text-align: center; margin-bottom: 40px;">
//                         <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px;">
//                             Seu código de verificação
//                         </h2>
//                         <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
//                             Use o código abaixo para acessar o painel do monitor:
//                         </p>
                        
//                         <!-- Verification Code -->
//                         <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
//                             <div style="font-size: 48px; font-weight: bold; color: #ffffff; font-family: 'Courier New', monospace; letter-spacing: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
//                                 ${code}
//                             </div>
//                         </div>
                        
//                         <!-- Instructions -->
//                         <div style="background-color: #edf2f7; border-radius: 8px; padding: 20px; margin: 30px 0;">
//                             <p style="color: #2d3748; margin: 0; font-size: 14px; line-height: 1.6;">
//                                 <strong>📱 Como usar:</strong><br>
//                                 1. Acesse o painel do monitor<br>
//                                 2. Digite este código no campo solicitado<br>
//                                 3. Clique em "Verificar"
//                             </p>
//                         </div>
                        
//                         <!-- Warning -->
//                         <div style="background-color: #fed7d7; border-left: 4px solid #f56565; padding: 15px; margin: 20px 0; border-radius: 4px;">
//                             <p style="color: #c53030; margin: 0; font-size: 14px;">
//                                 ⚠️ <strong>Importante:</strong> Este código expira em 10 minutos e é válido apenas para este acesso.
//                             </p>
//                         </div>
//                     </div>
//                 </div>
                
//                 <!-- Footer -->
//                 <div style="background: linear-gradient(90deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #f9ca24 75%, #f0932b 100%); padding: 2px;">
//                     <div style="background-color: #f7fafc; padding: 30px; text-align: center;">
//                         <p style="color: #718096; margin: 0; font-size: 14px;">
//                             © 2025 MD Inscrições - Painel do Monitor
//                         </p>
//                         <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 12px;">
//                             Este é um email automático, não responda.
//                         </p>
//                     </div>
//                 </div>
//             </div>
//         </body>
//         </html>
//       `,
//       text: `
//         🔐 CÓDIGO DE ACESSO - PAINEL DO MONITOR
        
//         MD Inscrições 2025
        
//         Seu código de verificação: ${code}
        
//         Use este código para acessar o painel do monitor.
        
//         IMPORTANTE: Este código expira em 10 minutos e é válido apenas para este acesso.
        
//         Como usar:
//         1. Acesse o painel do monitor
//         2. Digite este código no campo solicitado
//         3. Clique em "Verificar"
        
//         ---
//         © 2025 MD Inscrições - Painel do Monitor
//         Este é um email automático, não responda.
//       `,
//     };

//     try {
//       await transporter.sendMail(mailOptions);

//       return NextResponse.json({
//         success: true,
//         email: monitor.email,
//         message: "Código de verificação enviado com sucesso",
//       });
//     } catch (emailError) {
//       console.error("Email sending error:", emailError);
//       return NextResponse.json(
//         { error: "Erro ao enviar email de verificação" },
//         { status: 500 }
//       );
//     } finally {
//       transporter.close();
//     }
//   } catch (error) {
//     console.error("Error sending monitor verification:", error);
//     return NextResponse.json(
//       { error: "Erro interno do servidor" },
//       { status: 500 }
//     );
//   }
// }
