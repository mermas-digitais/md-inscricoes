/**
 * Utilitários de mapeamento camelCase ↔ snake_case para Supabase
 */

type Mapping = Record<string, string>;

// Campos por tabela que precisam de mapeamento explícito
export const TABLE_FIELD_MAPPING: Record<string, Mapping> = {
  eventos: {
    dataInicio: "data_inicio",
    dataFim: "data_fim",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  modalidades: {
    eventoId: "evento_id",
    limiteVagas: "limite_vagas",
    vagasOcupadas: "vagas_ocupadas",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  inscricoesEventos: {
    eventoId: "evento_id",
    orientadorId: "orientador_id",
    modalidadeId: "modalidade_id",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  participantesEventos: {
    inscricaoId: "inscricao_id",
    dataNascimento: "data_nascimento",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  orientadores: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  // tabelas genéricas
  inscricoes: {
    createdAt: "created_at",
    updatedAt: "updated_at",
    data_nascimento: "data_nascimento",
  },
};

function mapKey(table: string, key: string): string {
  const mapping = TABLE_FIELD_MAPPING[table];
  if (mapping && mapping[key]) return mapping[key];
  // fallback: converter camelCase → snake_case simples
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/__/g, "_")
    .toLowerCase();
}

export function toSnakeCaseData(table: string, data: Record<string, any>) {
  const out: Record<string, any> = {};
  Object.entries(data || {}).forEach(([k, v]) => {
    const sk = mapKey(table, k);
    if (v instanceof Date) {
      out[sk] = v.toISOString();
    } else {
      out[sk] = v;
    }
  });
  return out;
}

export function toSnakeCaseWhere(table: string, where: Record<string, any>) {
  const out: Record<string, any> = {};
  Object.entries(where || {}).forEach(([k, v]) => {
    const sk = mapKey(table, k);
    out[sk] = v;
  });
  return out;
}

export function toSnakeCaseOrderBy(
  table: string,
  orderBy: Record<string, "asc" | "desc">
) {
  const out: Record<string, "asc" | "desc"> = {};
  Object.entries(orderBy || {}).forEach(([k, v]) => {
    const sk = mapKey(table, k);
    out[sk] = v;
  });
  return out;
}

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function fromSnakeCaseRow(table: string, row: any) {
  if (!row || typeof row !== "object") return row;
  const reverse: Record<string, string> = {};
  const mapping = TABLE_FIELD_MAPPING[table] || {};
  Object.entries(mapping).forEach(([camel, snake]) => {
    reverse[snake] = camel;
  });
  const out: Record<string, any> = {};
  Object.entries(row).forEach(([k, v]) => {
    const camel = reverse[k] || snakeToCamelKey(k);
    out[camel] = v;
  });
  return out;
}

export function fromSnakeCaseRows(table: string, rows: any[]) {
  if (!Array.isArray(rows)) return rows;
  return rows.map((r) => fromSnakeCaseRow(table, r));
}
