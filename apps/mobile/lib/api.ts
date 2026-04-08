import Constants from "expo-constants";
import type { MobileAuthResponse } from "@shared";

type RequestOptions = RequestInit & {
  accessToken?: string;
};

const extra = Constants.expoConfig?.extra ?? {};
export const API_BASE_URL = String(extra.apiBaseUrl ?? "http://localhost:3000");

export async function apiFetch<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.error === "string" ? data.error : "Erro na requisicao";
    throw new Error(message);
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

export function getMyProfile(accessToken: string) {
  return apiFetch<MobileProfileResponse>("/api/users/me", {
    method: "GET",
    accessToken,
  });
}
