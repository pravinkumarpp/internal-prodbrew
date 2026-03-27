import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function firstN(s: string | null | undefined, n: number) {
  if (!s) return "";
  const str = String(s);
  return str.length > n ? `${str.slice(0, n)}...` : str;
}

function normalizeClientName(s: string | null | undefined) {
  if (!s) return "";
  return String(s)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Tiny Levenshtein to tolerate minor typos between automation payload and clients.name.
function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const m = a.length;
  const n = b.length;
  const dp: number[] = Array(n + 1)
    .fill(0)
    .map((_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const cur = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1, // delete
        dp[j - 1] + 1, // insert
        prev + cost, // replace
      );
      prev = cur;
    }
  }

  return dp[n];
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

  const { data: clientRow, error: clientErr } = await supabaseAdmin
    .from("clients")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (clientErr) {
    return NextResponse.json(
      { error: clientErr.message },
      { status: 500 },
    );
  }
  if (!clientRow) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const clientName = clientRow.name as string;
  const clientNameNorm = normalizeClientName(clientName);

  // Fetch a window of recent events and normalize-match client names in JS.
  // This is more robust than exact string equality when the stored value
  // has minor differences in spacing/casing/symbols.
  const { data: events, error } = await supabaseAdmin
    .from("automation_webhook_events")
    .select(
      "id,client_name,event_type,event_id,request_id,status,source,event_time,prompt,base_branch,new_branch,repo_full_name,pr_number,pr_url,error_code,error_message,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const matched = (events ?? []).filter((e: any) => {
    const evClientNorm = normalizeClientName(e?.client_name);
    if (!evClientNorm) return false;
    if (evClientNorm === clientNameNorm) return true;

    // Fallback: tolerate small edit distance (e.g. "Pricing" vs "Prcing").
    // Events window is small (limit 20), so this is fine.
    const distance = levenshtein(evClientNorm, clientNameNorm);
    return distance <= 2;
  });

  return NextResponse.json(
    matched.map((e: any) => ({
      id: String(e.id),
      eventType: e.event_type ?? null,
      eventId: e.event_id ?? null,
      requestId: e.request_id ?? null,
      status: e.status ?? null,
      source: e.source ?? null,
      eventTime: e.event_time ?? e.created_at ?? null,
      prompt: e.prompt ?? null,
      baseBranch: e.base_branch ?? null,
      newBranch: e.new_branch ?? null,
      repoFullName: e.repo_full_name ?? null,
      prNumber: typeof e.pr_number === "number" ? e.pr_number : null,
      prUrl: e.pr_url ?? null,
      errorCode: e.error_code ?? null,
      errorMessage: e.error_message ?? null,
      promptPreview: firstN(e.prompt ?? null, 120),
    })),
  );
}

