import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function resolveClientIdFromToken(token: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("api_webhook_token", token)
    .maybeSingle();
  return data?.id ?? null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Client apps POST here on success/error paths.
 *
 * Body (minimal):
 * {
 *   name?: "Stripe Payments",
 *   url: "https://example.com/api/foo",
 *   method?: "GET",
 *   status: "up" | "down",
 *   status_code?: 200,
 *   response_time_ms?: 123,
 *   error?: "Timeout" | "...",
 *   metadata?: { ... }
 * }
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "") || "";
  if (!auth) {
    return NextResponse.json(
      { error: "Missing Authorization header." },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  const body = await request.json().catch(() => null);
  const url = String(body?.url ?? "").trim();
  const method = String(body?.method ?? "GET").trim().toUpperCase();
  const status = String(body?.status ?? "").trim();

  if (!url || (status !== "up" && status !== "down")) {
    return NextResponse.json(
      { error: "Required: url, status ('up'|'down')" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const clientId = await resolveClientIdFromToken(auth);
  if (!clientId) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  const allowedMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);
  const safeMethod = allowedMethods.has(method) ? method : "GET";

  const name = String(body?.name ?? "").trim();
  const endpointName = name || (() => {
    try {
      const p = new URL(url).pathname || "/";
      const seg = p.replace(/\/$/, "").split("/").filter(Boolean).pop();
      return seg || "API Endpoint";
    } catch {
      return "API Endpoint";
    }
  })();

  // Find or create endpoint (dedupe by client + url + method)
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("api_endpoints")
    .select("id")
    .eq("client_id", clientId)
    .eq("url", url)
    .eq("method", safeMethod)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500, headers: CORS_HEADERS });
  }

  let endpointId = existing?.id as string | undefined;
  if (!endpointId) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("api_endpoints")
      .insert({
        client_id: clientId,
        name: endpointName,
        method: safeMethod,
        url,
        expected_status: 200,
        timeout_ms: 12_000,
        enabled: true,
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500, headers: CORS_HEADERS });
    }
    endpointId = inserted.id as string;
  }

  const statusCode = body?.status_code != null ? Number(body.status_code) : null;
  const responseTimeMs = body?.response_time_ms != null ? Number(body.response_time_ms) : null;
  const errorText = body?.error != null ? String(body.error) : null;
  const metadata =
    body?.metadata != null && typeof body.metadata === "object" ? body.metadata : null;

  const { error: checkInsertError } = await supabaseAdmin.from("api_checks").insert({
    client_id: clientId,
    api_endpoint_id: endpointId,
    checked_at: new Date().toISOString(),
    status,
    status_code: Number.isFinite(statusCode as number) ? statusCode : null,
    response_time_ms: Number.isFinite(responseTimeMs as number) ? responseTimeMs : null,
    error: errorText,
    metadata,
  });

  if (checkInsertError) {
    return NextResponse.json({ error: checkInsertError.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: CORS_HEADERS });
}

