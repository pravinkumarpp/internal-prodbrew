import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const LOGO_BUCKET = "ai-maintenance-client-logos";

function getStoragePathFromLogoUrl(logoUrl: string): string | null {
  const prefix = `/object/public/${LOGO_BUCKET}/`;
  const i = logoUrl.indexOf(prefix);
  if (i === -1) return null;
  const path = logoUrl.slice(i + prefix.length);
  return path && !path.includes("..") ? path : null;
}

export async function GET(
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

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await supabaseAdmin
    .from("clients")
    .select(
      "id, name, slug, url, status, last_check_at, last_status, uptime_pct_24h, ssl_expiry_date, ssl_last_checked_at, ssl_issuer, ssl_protocol, ssl_auto_renewal, frontend_script_generated_at, api_webhook_token",
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
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

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: client, error: fetchError } = await supabaseAdmin
    .from("clients")
    .select("id, logo_url")
    .eq("id", id)
    .single();

  if (fetchError || !client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const logoUrl = client.logo_url as string | null;
  if (logoUrl && typeof logoUrl === "string") {
    const path = getStoragePathFromLogoUrl(logoUrl);
    if (path) {
      await supabaseAdmin.storage.from(LOGO_BUCKET).remove([path]);
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from("clients")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
