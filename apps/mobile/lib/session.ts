import { ApiError } from "@/lib/api";

export async function resolveAccessToken(
  accessToken: string | null,
  refreshSession: () => Promise<string | null>
) {
  return accessToken ?? (await refreshSession());
}

export async function withAutoRefresh<T>(
  accessToken: string | null,
  refreshSession: () => Promise<string | null>,
  request: (token: string) => Promise<T>
) {
  const token = await resolveAccessToken(accessToken, refreshSession);
  if (!token) {
    throw new Error("Sua sessao expirou. Entre novamente.");
  }

  try {
    return await request(token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    const refreshedToken = await refreshSession();
    if (!refreshedToken) {
      throw new Error("Sua sessao expirou. Entre novamente.");
    }

    return request(refreshedToken);
  }
}
