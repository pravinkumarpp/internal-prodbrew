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

function checkUptime(urlStr: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  return fetch(urlStr, {
    method: "GET",
    signal: controller.signal,
    redirect: "follow",
    headers: { "User-Agent": "MaintainAI-Monitor/1.0" },
  })
    .then((res) => {
      clearTimeout(timeout);
      return res.ok;
    })
    .catch(() => {
      clearTimeout(timeout);
      return false;
    });
}

function checkSSLExpiry(urlStr: string): Promise<Date | null> {
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
          socket.destroy();
          if (cert && cert.valid_to) {
            resolve(new Date(cert.valid_to));
          } else {
            resolve(null);
          }
        },
      );
      socket.on("error", () => {
        socket.destroy();
        resolve(null);
      });
      socket.setTimeout(CHECK_TIMEOUT_MS, () => {
        socket.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
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
  let updated = 0;

  for (const client of clients) {
    const urlStr = (client.url as string).trim();
    if (!urlStr) continue;

    const [up, sslExpiry] = await Promise.all([
      checkUptime(urlStr),
      checkSSLExpiry(urlStr),
    ]);
    const health = computeHealth(up, sslExpiry);
    const uptimePct = up ? 100 : 0;
    const sslExpiryDate = sslExpiry ? sslExpiry.toISOString().slice(0, 10) : null;

    const { error: updateError } = await supabaseAdmin
      .from("clients")
      .update({
        last_check_at: now,
        last_status: up ? "up" : "down",
        uptime_pct_24h: uptimePct,
        ssl_expiry_date: sslExpiryDate,
        ssl_last_checked_at: now,
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
