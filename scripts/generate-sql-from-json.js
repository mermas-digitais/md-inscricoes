const fs = require("fs");
const path = require("path");

// Ler o arquivo JSON
const jsonPath = path.join(__dirname, "..", "esolas-imperatriz-ma.json");
const schoolsData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// Função para escapar aspas simples em SQL
function escapeSql(str) {
  return str.replace(/'/g, "''");
}

// Gerar as linhas SQL
const sqlLines = schoolsData.map((school) => {
  const nome = escapeSql(school.nome);
  const tipo = escapeSql(school.tipo);
  return `('${nome}', '${tipo}')`;
});

// Criar o conteúdo SQL completo
const sqlContent = `-- Dados atualizados das escolas de Imperatriz-MA
INSERT INTO escolas (nome, tipo) VALUES
${sqlLines.join(",\n")}
ON CONFLICT (nome) DO UPDATE SET 
  tipo = EXCLUDED.tipo,
  cidade = EXCLUDED.cidade,
  estado = EXCLUDED.estado;
`;

// Escrever para um arquivo
const outputPath = path.join(__dirname, "insert-escolas-updated.sql");
fs.writeFileSync(outputPath, sqlContent, "utf8");

console.log(`✅ SQL gerado com sucesso!`);
console.log(`📄 Arquivo: ${outputPath}`);
console.log(`📊 Total de escolas: ${schoolsData.length}`);
console.log(
  `🏫 Estaduais: ${schoolsData.filter((s) => s.tipo === "Estadual").length}`
);
console.log(
  `🏫 Municipais: ${schoolsData.filter((s) => s.tipo === "Municipal").length}`
);
