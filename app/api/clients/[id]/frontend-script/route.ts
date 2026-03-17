import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function getAppOrigin(): string {
  const url = process.env.APP_URL || process.env.VERCEL_URL;
  if (url) {
    return url.startsWith("http") ? url : `https://${url}`;
  }
  return "";
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
    .select("id, slug, frontend_script_generated_at")
    .eq("id", id)
    .single();

  if (fetchError || !client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("clients")
    .update({ frontend_script_generated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 },
    );
  }

  const origin = getAppOrigin();
  const scriptUrl = origin ? `${origin}/maintainai-logger.js` : "";
  const slug = (client.slug as string) || "";
  const scriptTag = scriptUrl && slug
    ? `<script src="${scriptUrl}" data-client-id="${slug}"></script>`
    : "";

  return NextResponse.json({
    scriptUrl,
    scriptTag,
    frontend_script_generated_at: new Date().toISOString(),
  });
}
