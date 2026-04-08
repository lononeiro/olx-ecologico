import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
  "http://127.0.0.1:19006",
];

function getAllowedOrigins() {
  const configuredOrigins =
    process.env.MOBILE_ALLOWED_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]);
}

function resolveAllowOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return "*";

  return getAllowedOrigins().has(origin) ? origin : "null";
}

export function applyCors(request: NextRequest, response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", resolveAllowOrigin(request));
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Vary", "Origin");

  return response;
}

export function createCorsPreflightResponse(request: NextRequest) {
  return applyCors(request, new NextResponse(null, { status: 204 }));
}
