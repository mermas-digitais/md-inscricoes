/**
 * Cliente HTTP Abstrato
 *
 * Fornece uma interface unificada para requisições HTTP
 * com retry automático e fallback
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Configurações do cliente HTTP
 */
export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

/**
 * Opções de requisição
 */
export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

/**
 * Resposta da requisição
 */
export interface HttpResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
  headers: Record<string, string>;
}

/**
 * Cliente HTTP abstrato
 */
export class HttpClient {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseURL:
        config.baseURL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000",
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    };
  }

  /**
   * Executa uma requisição HTTP
   */
  public async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const url = this.buildURL(endpoint);
    const requestOptions = this.buildRequestOptions(options);

    let lastError: Error | null = null;
    const maxRetries = options.retries ?? this.config.retries!;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `🌐 HTTP Request: ${requestOptions.method} ${url} (attempt ${
            attempt + 1
          })`
        );

        const response = await fetch(url, requestOptions);
        const responseData = await this.parseResponse<T>(response);

        if (response.ok) {
          console.log(`✅ HTTP Success: ${response.status} ${url}`);
          return responseData;
        }

        // Se não é um erro de servidor (5xx), não tenta novamente
        if (response.status < 500) {
          console.log(`❌ HTTP Client Error: ${response.status} ${url}`);
          return responseData;
        }

        throw new Error(
          `HTTP ${response.status}: ${responseData.error || "Server Error"}`
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `⚠️ HTTP Attempt ${attempt + 1} failed:`,
          lastError.message
        );

        // Se não é a última tentativa, aguarda antes de tentar novamente
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay! * Math.pow(2, attempt); // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    console.error(
      `💥 HTTP Request failed after ${maxRetries + 1} attempts:`,
      lastError?.message
    );
    return {
      success: false,
      error: lastError?.message || "Request failed",
      status: 0,
      headers: {},
    };
  }

  /**
   * Requisição GET
   */
  public async get<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, "method"> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  /**
   * Requisição POST
   */
  public async post<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  /**
   * Requisição PUT
   */
  public async put<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  /**
   * Requisição DELETE
   */
  public async delete<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, "method"> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  /**
   * Constrói a URL completa
   */
  private buildURL(endpoint: string): string {
    if (endpoint.startsWith("http")) {
      return endpoint;
    }

    const baseURL = this.config.baseURL!.replace(/\/$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    return `${baseURL}${cleanEndpoint}`;
  }

  /**
   * Constrói as opções da requisição
   */
  private buildRequestOptions(options: RequestOptions): RequestInit {
    const requestOptions: RequestInit = {
      method: options.method || "GET",
      headers: {
        ...this.config.headers,
        ...options.headers,
      },
    };

    // Adiciona body se necessário
    if (options.body && options.method !== "GET") {
      if (typeof options.body === "string") {
        requestOptions.body = options.body;
      } else {
        requestOptions.body = JSON.stringify(options.body);
      }
    }

    // Adiciona timeout se suportado
    if (options.timeout || this.config.timeout) {
      const timeout = options.timeout || this.config.timeout!;
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeout);
      requestOptions.signal = controller.signal;
    }

    return requestOptions;
  }

  /**
   * Parseia a resposta
   */
  private async parseResponse<T>(response: Response): Promise<HttpResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let data: T | undefined;
    let error: string | undefined;

    try {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }
    } catch (parseError) {
      error = "Failed to parse response";
    }

    return {
      success: response.ok,
      data,
      error:
        error ||
        (response.ok
          ? undefined
          : (data as any)?.error || `HTTP ${response.status}`),
      status: response.status,
      headers,
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Cliente HTTP singleton
 */
export const httpClient = new HttpClient();

/**
 * Utilitários para APIs
 */
export class ApiClient {
  private http: HttpClient;

  constructor(http: HttpClient = httpClient) {
    this.http = http;
  }

  /**
   * Envia email de confirmação
   */
  async sendConfirmationEmail(data: {
    email: string;
    nomeCompleto: string;
    nomeCurso: string;
    cpf: string;
  }) {
    return this.http.post("/api/send-confirmation", data);
  }

  /**
   * Envia email de excedente
   */
  async sendExcedenteEmail(data: {
    email: string;
    nomeCompleto: string;
    nomeCurso: string;
    cpf: string;
  }) {
    return this.http.post("/api/send-excedente", data);
  }

  /**
   * Verifica CPF
   */
  async checkCPF(cpf: string) {
    return this.http.post("/api/check-cpf", { cpf });
  }

  /**
   * Verifica CPF MDX25
   */
  async checkCPFMDX25(cpf: string) {
    return this.http.post("/api/mdx25/check-cpf", { cpf });
  }

  /**
   * Envia código de verificação
   */
  async sendVerificationCode(email: string) {
    return this.http.post("/api/send-verification", { email });
  }

  /**
   * Envia código de verificação MDX25
   */
  async sendVerificationCodeMDX25(email: string) {
    return this.http.post("/api/mdx25/send-verification", { email });
  }

  /**
   * Verifica código
   */
  async verifyCode(email: string, code: string) {
    return this.http.post("/api/verify-code", { email, code });
  }

  /**
   * Verifica código MDX25
   */
  async verifyCodeMDX25(email: string, code: string) {
    return this.http.post("/api/mdx25/verify-code", { email, code });
  }

  /**
   * Busca escolas
   */
  async findEscolas(search?: string, limit?: number) {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (limit) params.append("limit", limit.toString());

    const query = params.toString();
    return this.http.get(`/api/escolas${query ? `?${query}` : ""}`);
  }

  /**
   * Busca escolas MDX25
   */
  async findEscolasMDX25(search?: string, limit?: number) {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (limit) params.append("limit", limit.toString());

    const query = params.toString();
    return this.http.get(`/api/mdx25/escolas${query ? `?${query}` : ""}`);
  }

  /**
   * Status do banco de dados
   */
  async getDatabaseStatus() {
    return this.http.get("/api/database-status");
  }

  /**
   * Testa conexão do banco
   */
  async testDatabaseConnection() {
    return this.http.post("/api/database-status", { action: "test" });
  }

  /**
   * Força reconexão do banco
   */
  async reconnectDatabase() {
    return this.http.post("/api/database-status", { action: "reconnect" });
  }
}

// Instância singleton
export const apiClient = new ApiClient();
