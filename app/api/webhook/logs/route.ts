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
  "Access-Control-Allow-Headers": "Content-Type",
};

function isUuid(s: string): boolean {
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRe.test(s);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const type = String(body?.type ?? "").trim();
    const clientIdOrSlug = String(body?.clientId ?? body?.client_id ?? "").trim();

    if (!type || !clientIdOrSlug) {
      return NextResponse.json(
        { error: "Missing required fields: type, clientId (or client_id)" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const message = String(body?.message ?? "").trim();
    if (!message) {
      return NextResponse.json(
        { error: "Missing required field: message" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (type !== "ui_log" && type !== "server_log" && type !== "api_log") {
      return NextResponse.json(
        { error: "Invalid type. Must be ui_log, server_log, or api_log" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    let clientId: string;

    if (isUuid(clientIdOrSlug)) {
      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("id", clientIdOrSlug)
        .maybeSingle();
      if (!client) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404, headers: CORS_HEADERS },
        );
      }
      clientId = client.id;
    } else {
      const { data: client, error: clientError } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("slug", clientIdOrSlug)
        .maybeSingle();
      if (clientError) {
        return NextResponse.json(
          { error: clientError.message },
          { status: 500, headers: CORS_HEADERS },
        );
      }
      if (!client) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404, headers: CORS_HEADERS },
        );
      }
      clientId = client.id;
    }

    const level = ["error", "warning", "info"].includes(String(body?.level ?? ""))
      ? String(body.level)
      : "error";
    const source = body?.source != null ? String(body.source) : null;
    const metadata =
      body?.metadata != null && typeof body.metadata === "object"
        ? body.metadata
        : null;

    const { error: insertError } = await supabaseAdmin.from("log_events").insert({
      client_id: clientId,
      type,
      message,
      level,
      source: source || null,
      metadata: metadata || null,
    });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
