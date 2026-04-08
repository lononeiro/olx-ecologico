import Constants from "expo-constants";
import type {
  MaterialOption,
  MobileAuthResponse,
  ProfileUpdateInput,
  RegisterInput,
  SolicitacaoCreateInput,
} from "@shared";
import type { CepLookupResult } from "@/lib/address";

type RequestOptions = RequestInit & {
  accessToken?: string;
};

type ApiFieldErrors = Record<string, string[] | undefined>;

export type AppRole = MobileAuthResponse["user"]["role"];

const extra = Constants.expoConfig?.extra ?? {};
export const API_BASE_URL = String(extra.apiBaseUrl ?? "http://localhost:3000");

export class ApiError extends Error {
  status: number;
  fieldErrors?: ApiFieldErrors;
  data?: unknown;

  constructor(
    message: string,
    status: number,
    options?: {
      fieldErrors?: ApiFieldErrors;
      data?: unknown;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = options?.fieldErrors;
    this.data = options?.data;
  }
}

export interface RegisterResponse {
  message: string;
  id: number;
}

export interface CheckEmailResponse {
  existe: boolean;
  mensagem: string;
}

export interface ForgotPasswordResponse {
  mensagem: string;
  resetLink?: string;
}

export interface ResetPasswordResponse {
  mensagem: string;
}

export interface MobileProfileResponse {
  id: number;
  nome: string;
  email: string;
  endereco: string | null;
  telefone: string | null;
  status: string;
  createdAt: string;
  role: {
    id: number;
    nome: string;
  };
  company: {
    id: number;
    cnpj: string;
    descricao: string | null;
    createdAt: string;
  } | null;
}

export interface SolicitacaoImage {
  id: number;
  url: string;
}

export interface MessageItem {
  id: number;
  mensagem: string;
  coletaId: number;
  remetenteId: number;
  createdAt: string;
  remetente: {
    id: number;
    nome: string;
  };
}

export interface SolicitacaoItem {
  id: number;
  titulo: string;
  descricao: string;
  quantidade: string;
  endereco: string;
  status: string;
  aprovado: boolean;
  createdAt: string;
  userId: number;
  material: {
    id: number;
    nome: string;
  };
  imagens: SolicitacaoImage[];
  user?: {
    id: number;
    nome: string;
    email: string;
    telefone?: string | null;
    endereco?: string | null;
  };
  coleta?: {
    id: number;
    status: string;
    dataAceite: string;
    dataConclusao?: string | null;
    codigoConfirmacao?: string | null;
    company: {
      id: number;
      cnpj?: string;
      user: {
        id: number;
        nome: string;
        email?: string;
      };
    };
    mensagens?: MessageItem[];
  } | null;
}

export interface ColetaItem {
  id: number;
  status: string;
  dataAceite: string;
  dataConclusao: string | null;
  codigoConfirmacao: string | null;
  companyId: number;
  solicitacaoId: number;
  solicitacao: SolicitacaoItem;
  company: {
    id: number;
    user: {
      id: number;
      nome: string;
      email: string;
    };
  };
  mensagens: MessageItem[];
}

function getFieldErrors(data: unknown): ApiFieldErrors | undefined {
  if (!data || typeof data !== "object") return undefined;

  const error = (data as { error?: unknown }).error;
  if (!error || typeof error !== "object" || Array.isArray(error)) return undefined;

  return error as ApiFieldErrors;
}

function getFirstFieldError(fieldErrors?: ApiFieldErrors) {
  if (!fieldErrors) return null;

  for (const value of Object.values(fieldErrors)) {
    if (Array.isArray(value) && value[0]) {
      return value[0];
    }
  }

  return null;
}

function getErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const error = (data as { error?: unknown; resumo?: unknown }).error;

    if (typeof error === "string" && error.trim()) {
      return error;
    }

    const resumo = (data as { resumo?: unknown }).resumo;
    if (typeof resumo === "string" && resumo.trim()) {
      return resumo;
    }

    const fieldMessage = getFirstFieldError(getFieldErrors(data));
    if (fieldMessage) {
      return fieldMessage;
    }
  }

  return fallback;
}

export function getReadableErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Nao foi possivel conectar ao servidor. Verifique a URL da API e sua rede.",
      0
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data, "Erro na requisicao"), response.status, {
      fieldErrors: getFieldErrors(data),
      data,
    });
  }

  return data as T;
}

export function loginMobile(email: string, senha: string) {
  return apiFetch<MobileAuthResponse>("/api/auth/mobile/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
}

export function refreshMobileSession(refreshToken: string) {
  return apiFetch<MobileAuthResponse>("/api/auth/mobile/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function registerMobile(payload: RegisterInput) {
  return apiFetch<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function checkEmailAvailability(email: string) {
  return apiFetch<CheckEmailResponse>(
    `/api/auth/check-email?email=${encodeURIComponent(email)}`,
    { method: "GET" }
  );
}

export function requestPasswordReset(email: string) {
  return apiFetch<ForgotPasswordResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(
  token: string,
  email: string,
  novaSenha: string
) {
  return apiFetch<ResetPasswordResponse>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, email, novaSenha }),
  });
}

export function getMyProfile(accessToken: string) {
  return apiFetch<MobileProfileResponse>("/api/users/me", {
    method: "GET",
    accessToken,
  });
}

export function updateMyProfile(
  accessToken: string,
  payload: ProfileUpdateInput
) {
  return apiFetch<MobileProfileResponse>("/api/users/me", {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function getMateriais() {
  return apiFetch<MaterialOption[]>("/api/materiais", { method: "GET" });
}

export function lookupCep(cep: string) {
  return apiFetch<CepLookupResult>(`/api/cep/${cep}`, { method: "GET" });
}

export function getSolicitacoes(accessToken: string) {
  return apiFetch<SolicitacaoItem[]>("/api/solicitacoes", {
    method: "GET",
    accessToken,
  });
}

export function getSolicitacaoById(accessToken: string, id: number) {
  return apiFetch<SolicitacaoItem>(`/api/solicitacoes/${id}`, {
    method: "GET",
    accessToken,
  });
}

export function createSolicitacao(
  accessToken: string,
  payload: SolicitacaoCreateInput
) {
  return apiFetch<SolicitacaoItem>("/api/solicitacoes", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function getEmpresaColetas(accessToken: string) {
  return apiFetch<ColetaItem[]>("/api/empresa/coletas", {
    method: "GET",
    accessToken,
  });
}

export function getColetaById(accessToken: string, id: number) {
  return apiFetch<ColetaItem>(`/api/empresa/coletas/${id}`, {
    method: "GET",
    accessToken,
  });
}

export function acceptSolicitacao(accessToken: string, solicitacaoId: number) {
  return apiFetch<ColetaItem>("/api/empresa/coletas", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ solicitacaoId }),
  });
}

export function updateColetaStatus(
  accessToken: string,
  id: number,
  payload: {
    status: string;
    codigoConfirmacao?: string;
  }
) {
  return apiFetch<ColetaItem>(`/api/empresa/coletas/${id}`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function sendMensagem(
  accessToken: string,
  coletaId: number,
  mensagem: string
) {
  return apiFetch<MessageItem>(`/api/mensagens/${coletaId}`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ mensagem }),
  });
}

export function moderateSolicitacao(
  accessToken: string,
  id: number,
  aprovado: boolean
) {
  return apiFetch<SolicitacaoItem>(`/api/admin/solicitacoes/${id}`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({ aprovado }),
  });
}
