import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const ATTACH_BUCKET = "ai-maintenance-tasks";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  const formData = await request.formData();

  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const priority = String(formData.get("priority") ?? "").trim();
  const taskType = String(formData.get("task_type") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!slug || !title || !priority || !taskType || !description) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  const { data: client, error: clientError } = await supabaseAdmin
    .from("clients")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();

  if (clientError) {
    return NextResponse.json(
      { error: clientError.message },
      { status: 500 },
    );
  }
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const rawFiles = formData.getAll("attachments");
  const files = rawFiles.filter(
    (f): f is File => f instanceof File && f.size > 0,
  );

  const attachments: {
    path: string;
    url: string;
    type: string;
    size: number;
  }[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
    const path = `${client.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(ATTACH_BUCKET)
      .upload(path, file, {
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 },
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(ATTACH_BUCKET)
      .getPublicUrl(path);

    attachments.push({
      path,
      url: urlData.publicUrl,
      type: file.type,
      size: file.size,
    });
  }

  const { data: task, error: insertError } = await supabaseAdmin
    .from("tasks")
    .insert({
      client_id: client.id,
      title,
      priority,
      task_type: taskType,
      description,
      status: "Backlog",
      source: "public_form",
      attachments: attachments.length ? attachments : null,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 },
    );
  }

  // Create Fizzy card if credentials are set
  const fizzyToken = process.env.FIZZY_ACCESS_TOKEN;
  const accountId = process.env.FIZZY_ACCOUNT_ID;
  const boardId = process.env.FIZZY_BOARD_ID;

  if (fizzyToken && accountId && boardId) {
    const clientName = (client as { id: string; name?: string }).name ?? "Unknown";
    const cardDescription = [
      description,
      "",
      `Priority: ${priority} | Type: ${taskType}`,
      `Client: ${clientName}`,
      attachments.length > 0
        ? `\nAttachments (${attachments.length}): ${attachments.map((a) => a.url).join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const fizzyRes = await fetch(
        `https://app.fizzy.do/${accountId}/boards/${boardId}/cards`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${fizzyToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            card: {
              title,
              description: cardDescription,
            },
          }),
        },
      );
      if (!fizzyRes.ok) {
        console.error(
          "Fizzy card creation failed:",
          fizzyRes.status,
          await fizzyRes.text(),
        );
      }
    } catch (err) {
      console.error("Fizzy API error:", err);
    }
  }

  return NextResponse.json({ success: true, id: task.id }, { status: 201 });
}

