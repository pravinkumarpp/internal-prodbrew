import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import tls from "tls";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const CHECK_TIMEOUT_MS = 12_000;
const SSL_WARNING_DAYS = 30;

async function checkUptime(urlStr: string): Promise<{ up: boolean; ms: number | null }> {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(urlStr, {
    method: "GET",
    signal: controller.signal,
    redirect: "follow",
    headers: { "User-Agent": "MaintainAI-Monitor/1.0" },
  });
    clearTimeout(timeout);
    const ms = Date.now() - start;
    // Treat 2xx and 3xx as "up"; only 4xx/5xx mean "down"
    const up = res.status < 400;
    return { up, ms };
  } catch {
    clearTimeout(timeout);
    return { up: false, ms: null };
  }
}

type SslInfo = {
  expiry: Date | null;
  issuer: string | null;
  protocol: string | null;
};

function checkSSL(urlStr: string): Promise<SslInfo> {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const host = u.hostname;
      const port = 443;
      const socket = tls.connect(
        port,
        host,
        { servername: host, rejectUnauthorized: true },
        () => {
          const cert = socket.getPeerCertificate();
          const protocol = socket.getProtocol
            ? (socket.getProtocol() as string | null)
            : null;
          socket.destroy();
          if (cert && cert.valid_to) {
            const issuerRaw =
              cert.issuer && (cert.issuer.O || cert.issuer.CN);
            const issuer =
              typeof issuerRaw === "string" ? issuerRaw : null;
            resolve({
              expiry: new Date(cert.valid_to),
              issuer,
              protocol,
            });
          } else {
            resolve({ expiry: null, issuer: null, protocol });
          }
        },
      );
      socket.on("error", () => {
        socket.destroy();
        resolve({ expiry: null, issuer: null, protocol: null });
      });
      socket.setTimeout(CHECK_TIMEOUT_MS, () => {
        socket.destroy();
        resolve({ expiry: null, issuer: null, protocol: null });
      });
    } catch {
      resolve({ expiry: null, issuer: null, protocol: null });
    }
  });
}

function computeHealth(
  up: boolean,
  sslExpiry: Date | null,
): "Healthy" | "Warning" | "Critical" {
  if (!up) return "Critical";
  if (!sslExpiry) return "Warning";
  const now = new Date();
  const daysLeft = (sslExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "Critical";
  if (daysLeft < SSL_WARNING_DAYS) return "Warning";
  return "Healthy";
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      new URL(request.url).searchParams.get("secret");
    if (auth !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { data: clients, error: fetchError } = await supabaseAdmin
    .from("clients")
    .select("id, url")
    .not("url", "is", null);

  if (fetchError || !clients?.length) {
    return NextResponse.json(
      { ok: true, checked: 0, message: fetchError?.message || "No clients with URL" },
    );
  }

  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let updated = 0;

  for (const client of clients) {
    const urlStr = (client.url as string).trim();
    if (!urlStr) continue;

    const [uptimeResult, sslInfo] = await Promise.all([
      checkUptime(urlStr),
      checkSSL(urlStr),
    ]);
    const up = uptimeResult.up;
    const responseMs = uptimeResult.ms;
    const health = computeHealth(up, sslInfo.expiry);
    const sslExpiryDate = sslInfo.expiry
      ? sslInfo.expiry.toISOString().slice(0, 10)
      : null;

    // Insert individual check record
    await supabaseAdmin.from("monitor_checks").insert({
      client_id: client.id,
      checked_at: now,
      status: up ? "up" : "down",
      response_time_ms: responseMs,
    });

    // Compute uptime over last 7 days based on check history
    const { data: checks, error: checksError } = await supabaseAdmin
      .from("monitor_checks")
      .select("status")
      .eq("client_id", client.id)
      .gte("checked_at", cutoff);

    let uptimePct = null;
    if (!checksError && checks && checks.length > 0) {
      const total = checks.length;
      const upCount = checks.filter((c) => (c as { status: string }).status === "up").length;
      uptimePct = (upCount / total) * 100;
    }

    const { error: updateError } = await supabaseAdmin
      .from("clients")
      .update({
        last_check_at: now,
        last_status: up ? "up" : "down",
        uptime_pct_24h: uptimePct,
        ssl_expiry_date: sslExpiryDate,
        ssl_last_checked_at: now,
        ssl_issuer: sslInfo.issuer,
        ssl_protocol: sslInfo.protocol,
        status: health,
      })
      .eq("id", client.id);

    if (!updateError) updated++;
  }

  return NextResponse.json({
    ok: true,
    checked: clients.length,
    updated,
  });
}
