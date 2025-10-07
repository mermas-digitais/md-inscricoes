"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  Database,
  Cloud,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface TableStatus {
  table: string;
  localCount: number;
  supabaseCount: number;
  difference: number;
  status:
    | "synced"
    | "local_ahead"
    | "supabase_ahead"
    | "error"
    | "local_only"
    | "supabase_only";
  error?: string;
  type: "common" | "local_only" | "supabase_only";
}

interface SyncStatus {
  success: boolean;
  overallStatus: "synced" | "out_of_sync" | "error";
  summary: {
    totalTables: number;
    commonTables: number;
    localOnlyTables: number;
    syncedTables: number;
    errorTables: number;
    totalLocalRecords: number;
    totalSupabaseRecords: number;
    totalDifference: number;
  };
  tables: TableStatus[];
  recommendations: string[];
}

interface SyncResult {
  success: boolean;
  message: string;
  results: Array<{
    table: string;
    synced: number;
    errors: number;
    total: number;
    success: boolean;
    error?: string;
  }>;
  summary: {
    totalSynced: number;
    totalErrors: number;
    tablesProcessed: number;
    successfulTables: number;
    failedTables: number;
  };
}

export default function SyncPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);
  const [syncingTable, setSyncingTable] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sync/status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Erro ao buscar status:", error);
    } finally {
      setLoading(false);
    }
  };

  const performSync = async (
    direction: "to-supabase" | "from-supabase" | "bidirectional"
  ) => {
    setSyncing(true);
    try {
      const endpoint =
        direction === "bidirectional"
          ? "/api/sync/bidirectional"
          : "/api/sync/full-database";

      const body = direction === "bidirectional" ? {} : { direction };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      setLastSync(result);

      // Atualizar status após sincronização
      await fetchStatus();
    } catch (error) {
      console.error("Erro na sincronização:", error);
    } finally {
      setSyncing(false);
    }
  };

  const performSingleTableSync = async (
    tableName: string,
    direction: "to-supabase" | "from-supabase" | "bidirectional"
  ) => {
    setSyncingTable(tableName);
    try {
      const response = await fetch("/api/sync/single-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableName,
          direction,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(
          `✅ Sincronização da tabela ${tableName} concluída:`,
          result.result
        );
        // Atualizar status após sincronização
        await fetchStatus();
      } else {
        console.error(
          `❌ Erro na sincronização da tabela ${tableName}:`,
          result.error
        );
      }
    } catch (error) {
      console.error(`Erro na sincronização da tabela ${tableName}:`, error);
    } finally {
      setSyncingTable(null);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "synced":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "local_ahead":
        return <Database className="h-4 w-4 text-blue-500" />;
      case "supabase_ahead":
        return <Cloud className="h-4 w-4 text-orange-500" />;
      case "local_only":
        return <Database className="h-4 w-4 text-purple-500" />;
      case "supabase_only":
        return <Cloud className="h-4 w-4 text-purple-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "synced":
        return "bg-green-100 text-green-800";
      case "local_ahead":
        return "bg-blue-100 text-blue-800";
      case "supabase_ahead":
        return "bg-orange-100 text-orange-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case "synced":
        return "text-green-600";
      case "out_of_sync":
        return "text-orange-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sincronização de Bancos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie a sincronização entre o banco local e o Supabase
          </p>
        </div>
        <Button onClick={fetchStatus} disabled={loading} variant="outline">
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Atualizar Status
        </Button>
      </div>

      {/* Status Geral */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Status Geral
              <Badge className={getStatusColor(status.overallStatus)}>
                {status.overallStatus === "synced" && "Sincronizado"}
                {status.overallStatus === "out_of_sync" && "Fora de Sincronia"}
                {status.overallStatus === "error" && "Erro"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {status.summary.totalLocalRecords}
                </div>
                <div className="text-sm text-gray-600">Registros Locais</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {status.summary.totalSupabaseRecords}
                </div>
                <div className="text-sm text-gray-600">Registros Supabase</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    status.summary.totalDifference > 0
                      ? "text-blue-600"
                      : status.summary.totalDifference < 0
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {status.summary.totalDifference > 0 ? "+" : ""}
                  {status.summary.totalDifference}
                </div>
                <div className="text-sm text-gray-600">Diferença</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {status.summary.syncedTables}
                </div>
                <div className="text-sm text-gray-600">
                  Tabelas Sincronizadas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {status && status.recommendations.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Recomendações:</strong>
            <ul className="mt-2 list-disc list-inside">
              {status.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Ações de Sincronização */}
      <Card>
        <CardHeader>
          <CardTitle>Ações de Sincronização</CardTitle>
          <CardDescription>
            Escolha a direção da sincronização ou use a sincronização
            bidirecional inteligente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => performSync("to-supabase")}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Local → Supabase
            </Button>
            <Button
              onClick={() => performSync("from-supabase")}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <Cloud className="h-4 w-4" />
              Supabase → Local
            </Button>
            <Button
              onClick={() => performSync("bidirectional")}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sincronização Bidirecional
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado da Última Sincronização */}
      {lastSync && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Última Sincronização
              <Badge
                className={
                  lastSync.success
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {lastSync.success ? "Sucesso" : "Erro"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{lastSync.message}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {lastSync.summary.totalSynced}
                </div>
                <div className="text-sm text-gray-600">
                  Registros Sincronizados
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {lastSync.summary.totalErrors}
                </div>
                <div className="text-sm text-gray-600">Erros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {lastSync.summary.successfulTables}
                </div>
                <div className="text-sm text-gray-600">Tabelas com Sucesso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {lastSync.summary.failedTables}
                </div>
                <div className="text-sm text-gray-600">Tabelas com Erro</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status das Tabelas */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Status das Tabelas</CardTitle>
            <CardDescription>
              Detalhes de sincronização por tabela
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {status.tables.map((table) => (
                <div
                  key={table.table}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(table.status)}
                    <div>
                      <div className="font-medium">{table.table}</div>
                      <div className="text-sm text-gray-600">
                        Local: {table.localCount} | Supabase:{" "}
                        {table.supabaseCount}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(table.status)}>
                      {table.status === "synced" && "Sincronizado"}
                      {table.status === "local_ahead" && "Local à frente"}
                      {table.status === "supabase_ahead" && "Supabase à frente"}
                      {table.status === "error" && "Erro"}
                      {table.status === "local_only" && "Apenas Local"}
                      {table.status === "supabase_only" && "Apenas Supabase"}
                    </Badge>
                    {table.difference !== 0 && (
                      <span
                        className={`text-sm font-medium ${
                          table.difference > 0
                            ? "text-blue-600"
                            : "text-orange-600"
                        }`}
                      >
                        {table.difference > 0 ? "+" : ""}
                        {table.difference}
                      </span>
                    )}

                    {/* Botões de sincronização individual - todas as tabelas são comuns agora */}
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          performSingleTableSync(table.table, "to-supabase")
                        }
                        disabled={syncingTable === table.table}
                        className="h-7 px-2 text-xs"
                        title="Sincronizar para Supabase"
                      >
                        <Database className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          performSingleTableSync(table.table, "from-supabase")
                        }
                        disabled={syncingTable === table.table}
                        className="h-7 px-2 text-xs"
                        title="Sincronizar do Supabase"
                      >
                        <Cloud className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          performSingleTableSync(table.table, "bidirectional")
                        }
                        disabled={syncingTable === table.table}
                        className="h-7 px-2 text-xs"
                        title="Sincronização bidirecional"
                      >
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
