import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Check if registration is still open
    const deadline = process.env.MDX25_REGISTRATION_DEADLINE;
    if (deadline && new Date() > new Date(deadline)) {
      return NextResponse.json(
        { error: "Inscrições MDX25 encerradas" },
        { status: 400 }
      );
    }

    // Determine course based on escolaridade for MDX25
    const curso =
      data.escolaridade === "Ensino Fundamental 2"
        ? "MDX25-Jogos"
        : "MDX25-Robótica";

    // TODO: Verificar quantas inscrições já existem para este curso no banco MDX25
    // For now, we'll use a simple limit
    const LIMITE_VAGAS_MDX25 = 100;
    const vagasOcupadas = 0; // TODO: Replace with actual database query
    const status =
      vagasOcupadas >= LIMITE_VAGAS_MDX25 ? "EXCEDENTE" : "INSCRITA";

    // TODO: Insert into MDX25 database
    // In the real implementation, you would:
    // 1. Connect to the MDX25 PostgreSQL database
    // 2. Insert the inscription data into inscricoes_mdx25 table
    // 3. Handle any database errors

    console.log("MDX25 Inscription data:", {
      email: data.email,
      nome: data.nome,
      cpf: data.cpf,
      curso,
      status,
    });

    // TODO: Send appropriate email based on status
    // For now, we'll just log the email data
    try {
      const emailData = {
        email: data.email,
        nomeCompleto: data.nome,
        nomeCurso: curso,
        cpf: data.cpf,
      };

      console.log(
        "MDX25 Sending email with data:",
        emailData,
        "Status:",
        status
      );

      // TODO: Choose the correct email API based on status
      // const emailEndpoint = status === "EXCEDENTE" ? "/api/mdx25/send-excedente" : "/api/mdx25/send-confirmation";

      // TODO: Send email using the appropriate endpoint
      console.log("MDX25 Email would be sent here");
    } catch (emailError) {
      console.error("Error sending MDX25 email:", emailError);
      // Don't fail the inscription if email fails
    }

    return NextResponse.json({
      success: true,
      curso,
      status,
      message: "Inscrição MDX25 realizada com sucesso!",
    });
  } catch (error) {
    console.error("Error creating MDX25 inscription:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
