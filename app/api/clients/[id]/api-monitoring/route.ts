import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type ApiEndpointRow = {
  id: string;
  client_id: string;
  name: string;
  method: string;
  url: string;
  expected_status: number;
  timeout_ms: number;
  enabled: boolean;
  created_at: string;
};

type ApiCheckRow = {
  api_endpoint_id: string;
  status: string;
  status_code: number | null;
  response_time_ms: number | null;
  checked_at: string;
};

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

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

  const { data: endpoints, error: endpointsError } = await supabaseAdmin
    .from("api_endpoints")
    .select("id, client_id, name, method, url, expected_status, timeout_ms, enabled, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  if (endpointsError) {
    return NextResponse.json({ error: endpointsError.message }, { status: 500 });
  }

  const endpointIds = (endpoints ?? []).map((e) => (e as ApiEndpointRow).id);
  if (endpointIds.length === 0) {
    return NextResponse.json({ endpoints: [], latestByEndpoint: {}, uptimePctByEndpoint: {} });
  }

  // Latest check per endpoint (fetch a chunk and reduce client-side)
  const { data: checks, error: checksError } = await supabaseAdmin
    .from("api_checks")
    .select("api_endpoint_id, status, status_code, response_time_ms, checked_at")
    .in("api_endpoint_id", endpointIds)
    .order("checked_at", { ascending: false })
    .limit(500);

  if (checksError) {
    return NextResponse.json({ error: checksError.message }, { status: 500 });
  }

  const latestByEndpoint: Record<string, ApiCheckRow> = {};
  const totals: Record<string, { total: number; up: number }> = {};

  for (const row of checks ?? []) {
    const r = row as ApiCheckRow;
    if (!latestByEndpoint[r.api_endpoint_id]) latestByEndpoint[r.api_endpoint_id] = r;
    const t = totals[r.api_endpoint_id] || { total: 0, up: 0 };
    t.total += 1;
    if (r.status === "up") t.up += 1;
    totals[r.api_endpoint_id] = t;
  }

  const uptimePctByEndpoint: Record<string, number | null> = {};
  for (const id of endpointIds) {
    const t = totals[id];
    uptimePctByEndpoint[id] = t && t.total > 0 ? (t.up / t.total) * 100 : null;
  }

  return NextResponse.json({
    endpoints: (endpoints ?? []) as ApiEndpointRow[],
    latestByEndpoint,
    uptimePctByEndpoint,
  });
}

