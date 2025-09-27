import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    // TODO: Query MDX25 database for schools
    // For now, we'll return a mock response
    // In the real implementation, you would:
    // 1. Connect to the MDX25 PostgreSQL database
    // 2. Query the escolas_mdx25 table
    // 3. Use full-text search with the search parameter
    // 4. Apply the limit

    console.log(`MDX25 Schools search: "${search}" (limit: ${limit})`);

    // Mock data - replace with actual database query
    const mockSchools = [
      { id: 1, nome: "Escola Municipal João Silva", tipo: "Municipal" },
      { id: 2, nome: "Escola Estadual Maria Santos", tipo: "Estadual" },
      { id: 3, nome: "Escola Municipal Pedro Costa", tipo: "Municipal" },
      { id: 4, nome: "Escola Estadual Ana Oliveira", tipo: "Estadual" },
    ];

    // Filter mock data based on search
    const filteredSchools = mockSchools
      .filter((school) =>
        school.nome.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, limit);

    return NextResponse.json({
      escolas: filteredSchools,
      total: filteredSchools.length,
    });
  } catch (error) {
    console.error("Error fetching MDX25 schools:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
