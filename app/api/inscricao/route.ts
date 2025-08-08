import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Check if registration is still open
    const deadline = process.env.REGISTRATION_DEADLINE;
    if (deadline && new Date() > new Date(deadline)) {
      return NextResponse.json(
        { error: "Inscrições encerradas" },
        { status: 400 }
      );
    }

    // Determine course based on escolaridade
    const curso =
      data.escolaridade === "Ensino Fundamental 2" ? "Jogos" : "Robótica";

    // Verificar quantas inscrições já existem para este curso (apenas INSCRITA e MATRICULADA contam para o limite)
    const { data: existingInscricoes, error: countError } = await supabase
      .from("inscricoes")
      .select("id", { count: "exact" })
      .eq("curso", curso)
      .in("status", ["INSCRITA", "MATRICULADA"]);

    if (countError) {
      console.error("Error counting inscricoes:", countError);
      return NextResponse.json(
        { error: "Erro ao verificar disponibilidade de vagas" },
        { status: 500 }
      );
    }

    // Definir o status baseado na disponibilidade de vagas
    const vagasOcupadas = existingInscricoes?.length || 0;
    const LIMITE_VAGAS = 50;
    const status = vagasOcupadas >= LIMITE_VAGAS ? "EXCEDENTE" : "INSCRITA";

    // Insert into database
    const { data: inscricao, error } = await supabase
      .from("inscricoes")
      .insert([
        {
          email: data.email,
          nome: data.nome,
          cpf: data.cpf,
          data_nascimento: data.data_nascimento,
          cep: data.cep,
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          nome_responsavel: data.nome_responsavel,
          telefone_whatsapp: data.telefone_whatsapp,
          escolaridade: data.escolaridade,
          ano_escolar: data.ano_escolar,
          escola: data.escola, // Novo campo da escola
          curso,
          status,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao salvar inscrição" },
        { status: 500 }
      );
    }

    // Send confirmation email
    try {
      const emailData = {
        email: data.email,
        nomeCompleto: data.nome,
        nomeCurso: curso,
        cpf: data.cpf,
      };

      console.log("Sending confirmation email with data:", emailData);

      const confirmationResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/api/send-confirmation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailData),
        }
      );

      if (!confirmationResponse.ok) {
        const errorText = await confirmationResponse.text();
        console.error(
          "Failed to send confirmation email:",
          confirmationResponse.status,
          errorText
        );
        // Don't fail the inscription if email fails
      } else {
        console.log("Confirmation email sent successfully");
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the inscription if email fails
    }

    return NextResponse.json({ success: true, curso });
  } catch (error) {
    console.error("Error creating inscription:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
