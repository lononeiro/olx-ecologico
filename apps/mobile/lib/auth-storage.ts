import * as SecureStore from "expo-secure-store";
import type { MobileAuthResponse } from "@shared";

const ACCESS_TOKEN_KEY = "econecta.accessToken";
const REFRESH_TOKEN_KEY = "econecta.refreshToken";
const USER_KEY = "econecta.user";
type StoredUser = MobileAuthResponse["user"];

export async function saveAuthSession(session: MobileAuthResponse) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user)),
  ]);
}

export async function clearAuthSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}

export async function getStoredAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getStoredRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function getStoredUser(): Promise<StoredUser | null> {
  const user = await SecureStore.getItemAsync(USER_KEY);
  if (!user) return null;

  try {
    return JSON.parse(user) as StoredUser;
  } catch {
    return null;
  }
}
