import { NextResponse } from "next/server";
import { AUTOMATION_ENGINE_URL } from "@/lib/config";

function toEnvPrefix(clientName: string): string {
  return clientName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function maskToken(token: string) {
  const t = String(token ?? "");
  if (t.length <= 8) return "****";
  return `${t.slice(0, 4)}...${t.slice(-4)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const description =
      typeof body?.description === "string" ? body.description : "";
    const taskId = typeof body?.taskId === "string" ? body.taskId : null;
    const clientId = typeof body?.clientId === "string" ? body.clientId : null;
    const clientName =
      typeof body?.clientName === "string" ? body.clientName.trim() : "";
    const taskType =
      typeof body?.taskType === "string" ? body.taskType : "";

    if (!clientName) {
      return NextResponse.json(
        { error: "Missing required field: clientName" },
        { status: 400 },
      );
    }

    const prefix = toEnvPrefix(clientName);
    const githubOwner = process.env[`${prefix}_GITHUB_OWNER`] ?? "";
    const githubRepo = process.env[`${prefix}_GITHUB_REPO`] ?? "";
    const githubToken = process.env[`${prefix}_GITHUB_TOKEN`] ?? "";
    const baseBranch = process.env[`${prefix}_GITHUB_BASE_BRANCH`] ?? "main";
    const automationUrl = AUTOMATION_ENGINE_URL;

    if (!githubOwner || !githubRepo || !githubToken) {
      console.error("[PostCreate] Missing client-prefixed GitHub env vars", {
        clientName,
        prefix,
        githubOwner: Boolean(githubOwner),
        githubRepo: Boolean(githubRepo),
        githubToken: Boolean(githubToken),
      });
      return NextResponse.json(
        { error: `Missing GitHub env vars for prefix ${prefix}` },
        { status: 400 },
      );
    }

    console.log("[PostCreate] Task submit callback", {
      taskId,
      clientId,
      clientName,
      taskType,
      description,
    });

    const automationPayload = {
      githubOwner,
      githubRepo,
      githubToken,
      baseBranch,
      prompt: description,
      clientName,
      taskType,
    };

    console.log("[PostCreate] Sending to automation engine", {
      automationUrl,
      githubOwner,
      githubRepo,
      baseBranch,
      clientName,
      taskType,
      promptPreview:
        typeof description === "string" ? description.slice(0, 120) : "",
      githubTokenMasked: maskToken(githubToken),
    });

    const automationRes = await fetch(automationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(automationPayload),
    });

    if (!automationRes.ok) {
      const text = await automationRes.text().catch(() => "");
      console.error("[PostCreate] Automation call failed:", {
        status: automationRes.status,
        body: text,
      });
      // Non-blocking: task + Basecamp already succeeded; automation is best-effort.
      return NextResponse.json({
        ok: true,
        forwarded: false,
        automationError: "Automation call failed",
        automationStatus: automationRes.status,
      });
    }

    return NextResponse.json({ ok: true, forwarded: true });
  } catch (err) {
    console.error("[PostCreate] callback parse failed:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
