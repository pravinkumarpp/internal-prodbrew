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
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const eventType =
      typeof body?.eventType === "string" ? body.eventType : "unknown";
    const eventId = typeof body?.eventId === "string" ? body.eventId : null;
    const clientName =
      typeof body?.clientName === "string" ? body.clientName : null;
    const requestId =
      typeof body?.requestId === "string" ? body.requestId : null;
    const status = typeof body?.status === "string" ? body.status : "unknown";
    const taskType = typeof body?.taskType === "string" ? body.taskType : null;

    const repo =
      body?.repo && typeof body.repo === "object"
        ? (body.repo as Record<string, unknown>)
        : null;
    const pullRequest =
      body?.pullRequest && typeof body.pullRequest === "object"
        ? (body.pullRequest as Record<string, unknown>)
        : null;
    const error =
      body?.error && typeof body.error === "object"
        ? (body.error as Record<string, unknown>)
        : null;

    const { error: insertError } = await supabaseAdmin
      .from("automation_webhook_events")
      .insert({
        event_type: eventType,
        event_id: eventId,
        client_name: clientName,
        request_id: requestId,
        status,
        source: typeof body?.source === "string" ? body.source : null,
        event_time:
          typeof body?.eventTime === "string" ? body.eventTime : null,
        base_branch:
          typeof body?.baseBranch === "string" ? body.baseBranch : null,
        new_branch:
          typeof body?.newBranch === "string" ? body.newBranch : null,
        prompt: typeof body?.prompt === "string" ? body.prompt : null,
        task_type: taskType,
        repo_full_name:
          typeof repo?.fullName === "string" ? repo.fullName : null,
        pr_number:
          typeof pullRequest?.number === "number" ? pullRequest.number : null,
        pr_url:
          typeof pullRequest?.url === "string" ? pullRequest.url : null,
        error_code: typeof error?.code === "string" ? error.code : null,
        error_message:
          typeof error?.message === "string" ? error.message : null,
        raw_payload: body,
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    console.log("[AutomationWebhook] received", {
      eventType,
      eventId,
      clientName,
      status,
      requestId,
    });

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    console.error("[AutomationWebhook] invalid payload:", err);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
