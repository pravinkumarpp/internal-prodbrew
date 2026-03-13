import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const RESERVED_SLUGS = new Set([
  "api", "auth", "clients", "client", "login", "confirmation", "add-client",
  "team", "settings", "_next", "favicon.ico",
]);

function slugFromName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "client";
  return RESERVED_SLUGS.has(base) ? `${base}-c` : base;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("id, name, url, platform, status, logo_url, slug, last_check_at, last_status, uptime_pct_24h, ssl_expiry_date, ssl_last_checked_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch task counts per client
  const { data: taskCounts, error: taskError } = await supabaseAdmin
    .from("tasks")
    .select("client_id, id");

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  const countsMap = new Map<string, number>();
  for (const row of taskCounts ?? []) {
    const r = row as { client_id: string; id: string };
    countsMap.set(r.client_id, (countsMap.get(r.client_id) ?? 0) + 1);
  }

  const withCounts =
    (data ?? []).map((c) => ({
      ...c,
      tasks_count: countsMap.get((c as { id: string }).id) ?? 0,
    })) ?? [];

  return NextResponse.json(withCounts);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    url,
    platform,
    hosting_provider,
    git_repo_url,
    logo_url,
  } = body;

  if (!name || typeof name !== "string" || !url || typeof url !== "string" || !platform) {
    return NextResponse.json(
      { error: "Name, URL, and platform are required." },
      { status: 400 },
    );
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let baseSlug = slugFromName(name);
  const { data: existing } = await supabaseAdmin
    .from("clients")
    .select("slug")
    .ilike("slug", `${baseSlug}%`);
  const used = new Set((existing ?? []).map((r) => (r as { slug: string }).slug));
  let slug = baseSlug;
  for (let n = 2; used.has(slug); n++) slug = `${baseSlug}-${n}`;

  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert({
      name: name.trim(),
      url: url.trim(),
      platform: String(platform),
      status: body.status ?? "Healthy",
      hosting_provider: hosting_provider?.trim() || null,
      git_repo_url: git_repo_url?.trim() || null,
      logo_url: logo_url?.trim() || null,
      slug,
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data?.id, slug: data?.slug }, { status: 201 });
}
