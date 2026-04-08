import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { MobileAuthResponse } from "@shared";

const ACCESS_TOKEN_KEY = "econecta.accessToken";
const REFRESH_TOKEN_KEY = "econecta.refreshToken";
const USER_KEY = "econecta.user";
type StoredUser = MobileAuthResponse["user"];

function hasSecureStore() {
  return (
    typeof SecureStore.getItemAsync === "function" &&
    typeof SecureStore.setItemAsync === "function" &&
    typeof SecureStore.deleteItemAsync === "function"
  );
}

function getWebStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

async function setItem(key: string, value: string) {
  if (Platform.OS === "web" || !hasSecureStore()) {
    getWebStorage()?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (Platform.OS === "web" || !hasSecureStore()) {
    return getWebStorage()?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === "web" || !hasSecureStore()) {
    getWebStorage()?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function saveAuthSession(session: MobileAuthResponse) {
  await Promise.all([
    setItem(ACCESS_TOKEN_KEY, session.accessToken),
    setItem(REFRESH_TOKEN_KEY, session.refreshToken),
    setItem(USER_KEY, JSON.stringify(session.user)),
  ]);
}

export async function saveStoredUser(user: StoredUser) {
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function clearAuthSession() {
  await Promise.all([
    deleteItem(ACCESS_TOKEN_KEY),
    deleteItem(REFRESH_TOKEN_KEY),
    deleteItem(USER_KEY),
  ]);
}

export async function getStoredAccessToken() {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function getStoredRefreshToken() {
  return getItem(REFRESH_TOKEN_KEY);
}

export async function getStoredUser(): Promise<StoredUser | null> {
  const user = await getItem(USER_KEY);
  if (!user) return null;

  try {
    return JSON.parse(user) as StoredUser;
  } catch {
    return null;
  }
}
