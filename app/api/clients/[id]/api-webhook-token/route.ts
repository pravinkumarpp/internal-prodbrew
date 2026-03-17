import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function generateToken(): string {
  // ~43 chars base64url, good enough for a per-client secret
  return crypto.randomBytes(32).toString("base64url");
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Client id required." }, { status: 400 });
  }

  const { data: client, error: fetchError } = await supabaseAdmin
    .from("clients")
    .select("id, api_webhook_token")
    .eq("id", id)
    .single();

  if (fetchError || !client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const existing = (client as { api_webhook_token: string | null }).api_webhook_token;
  if (existing) {
    return NextResponse.json({ token: existing });
  }

  const token = generateToken();

  const { error: updateError } = await supabaseAdmin
    .from("clients")
    .update({ api_webhook_token: token })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ token });
}

