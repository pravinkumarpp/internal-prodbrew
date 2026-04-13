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
type BasecampTarget = "todo" | "card" | "message_board";
type BasecampDockItem = {
  id?: number;
  enabled?: boolean;
  url?: string;
};

type SavedAttachment = {
  path: string;
  url: string;
  type: string;
  size: number;
  name: string;
};

function getBasecampAuthHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent":
      process.env.BASECAMP_USER_AGENT ?? "MaintainAI (support@maintainai.local)",
  };
}

function getBasecampJsonHeaders(accessToken: string) {
  return {
    ...getBasecampAuthHeaders(accessToken),
    "Content-Type": "application/json",
  };
}

function buildBasecampContent(params: {
  description: string;
  priority: string;
  taskType: string;
  clientName: string;
}) {
  const { description, priority, taskType, clientName } = params;
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const toRichDiv = (value: string) =>
    `<div>${escapeHtml(value).replace(/\n/g, "<br>")}</div>`;

  return [
    toRichDiv(description),
    toRichDiv(`Priority: ${priority}`),
    toRichDiv(`Task Type: ${taskType}`),
    toRichDiv(`Client: ${clientName}`),
  ].join("");
}

function appendAttachmentEmbeds(content: string, sgids: string[]) {
  if (sgids.length === 0) return content;
  const embedTags = sgids
    .map((sgid) => `<div><bc-attachment sgid="${sgid}"></bc-attachment></div>`)
    .join("\n");
  return `${content}${embedTags}`;
}

async function createBasecampEntity(params: {
  accountId: string;
  projectId: string;
  accessToken: string;
  title: string;
  description: string;
  priority: string;
  taskType: string;
  clientName: string;
  target: BasecampTarget;
  attachments: SavedAttachment[];
}) {
  const {
    accountId,
    projectId,
    accessToken,
    title,
    description,
    priority,
    taskType,
    clientName,
    target,
    attachments,
  } = params;
  const authHeaders = getBasecampAuthHeaders(accessToken);
  const jsonHeaders = getBasecampJsonHeaders(accessToken);
  const projectUrl = `https://3.basecampapi.com/${accountId}/projects/${projectId}.json`;
  const projectRes = await fetch(projectUrl, { headers: authHeaders });

  if (!projectRes.ok) {
    const body = await projectRes.text().catch(() => "");
    throw new Error(`Basecamp project read failed (${projectRes.status}): ${body}`);
  }

  const projectData = (await projectRes.json()) as { dock?: BasecampDockItem[] };
  const dock = Array.isArray(projectData?.dock) ? projectData.dock : [];
  const vaultTool = dock.find(
    (item) =>
      item?.enabled !== false &&
      typeof item?.url === "string" &&
      item.url.includes("/vaults/"),
  );
  const vaultId = vaultTool?.id;
  if (attachments.length > 0 && !vaultId) {
    throw new Error("No Vault tool found in project dock for file attachments.");
  }
  const content = buildBasecampContent({
    description,
    priority,
    taskType,
    clientName,
  });
  const uploadedAttachmentSgids = await createBasecampAttachmentSgids({
    accountId,
    vaultId: vaultId ?? 0,
    accessToken,
    attachments,
  });
  const contentWithAttachments = appendAttachmentEmbeds(
    content,
    uploadedAttachmentSgids,
  );

  if (target === "todo") {
    const todoSetTool = dock.find(
      (item) =>
        item?.enabled !== false &&
        typeof item?.url === "string" &&
        item.url.includes("/todosets/"),
    );
    const todoSetId = todoSetTool?.id;
    if (!todoSetId) {
      throw new Error("No To-do set found in project dock.");
    }
    const createTodoListUrl = `https://3.basecampapi.com/${accountId}/buckets/${projectId}/todosets/${todoSetId}/todolists.json`;
    const todoRes = await fetch(createTodoListUrl, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        name: title,
        description: contentWithAttachments,
      }),
    });
    if (!todoRes.ok) {
      const body = await todoRes.text().catch(() => "");
      throw new Error(`Basecamp To-do creation failed (${todoRes.status}): ${body}`);
    }
    return;
  }

  if (target === "card") {
    const cardTableTool = dock.find(
      (item) =>
        item?.enabled !== false &&
        typeof item?.url === "string" &&
        item.url.includes("/card_tables/"),
    );
    if (!cardTableTool?.url) {
      throw new Error("No Card Table tool found in project dock.");
    }

    const cardTableRes = await fetch(cardTableTool.url, { headers: authHeaders });
    if (!cardTableRes.ok) {
      const body = await cardTableRes.text().catch(() => "");
      throw new Error(`Basecamp Card Table read failed (${cardTableRes.status}): ${body}`);
    }
    const cardTableData = (await cardTableRes.json()) as {
      lists?: Array<{ id?: number }>;
      columns?: Array<{ id?: number }>;
    };
    const cardLists = Array.isArray(cardTableData?.lists)
      ? cardTableData.lists
      : Array.isArray(cardTableData?.columns)
        ? cardTableData.columns
        : [];
    let resolvedListId = cardLists[0]?.id;

    if (!resolvedListId && cardTableTool.id) {
      const listsRes = await fetch(
        `https://3.basecampapi.com/${accountId}/card_tables/${cardTableTool.id}/lists.json`,
        { headers: authHeaders },
      );
      if (listsRes.ok) {
        const listsData = (await listsRes.json()) as Array<{ id?: number }>;
        resolvedListId = listsData[0]?.id;
      }
    }
    if (!resolvedListId) {
      throw new Error("No Card Table columns found in this project.");
    }

    const createCardUrl = `https://3.basecampapi.com/${accountId}/card_tables/lists/${resolvedListId}/cards.json`;
    const cardRes = await fetch(createCardUrl, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        title,
        content: contentWithAttachments,
      }),
    });
    if (!cardRes.ok) {
      const body = await cardRes.text().catch(() => "");
      throw new Error(`Basecamp Card creation failed (${cardRes.status}): ${body}`);
    }
    return;
  }

  const messageBoardTool = dock.find(
    (item) =>
      item?.enabled !== false &&
      typeof item?.url === "string" &&
      item.url.includes("/message_boards/"),
  );
  const boardId = messageBoardTool?.id;
  if (!boardId) {
    throw new Error("No Message Board tool found in project dock.");
  }
  const createMessageUrl = `https://3.basecampapi.com/${accountId}/buckets/${projectId}/message_boards/${boardId}/messages.json`;
  const messageRes = await fetch(createMessageUrl, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      subject: title,
      content: contentWithAttachments,
      status: "active",
    }),
  });
  if (!messageRes.ok) {
    const body = await messageRes.text().catch(() => "");
    throw new Error(`Basecamp Message creation failed (${messageRes.status}): ${body}`);
  }
}

async function createBasecampAttachmentSgids(params: {
  accountId: string;
  vaultId: number;
  accessToken: string;
  attachments: SavedAttachment[];
}): Promise<string[]> {
  const { accountId, vaultId, accessToken, attachments } = params;
  if (attachments.length === 0) return [];

  const authHeaders = getBasecampAuthHeaders(accessToken);
  const createAttachmentBaseUrl = `https://3.basecampapi.com/${accountId}/attachments.json`;
  const sgids: string[] = [];

  for (const attachment of attachments) {
    const sourceRes = await fetch(attachment.url);
    if (!sourceRes.ok) {
      const body = await sourceRes.text().catch(() => "");
      throw new Error(
        `Failed to download attachment from Supabase (${sourceRes.status}): ${body}`,
      );
    }

    const fileArrayBuffer = await sourceRes.arrayBuffer();
    const contentType =
      sourceRes.headers.get("content-type") || attachment.type || "application/octet-stream";
    const createAttachmentUrl = `${createAttachmentBaseUrl}?name=${encodeURIComponent(attachment.name)}`;

    const attachmentRes = await fetch(createAttachmentUrl, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": contentType,
        "Content-Length": String(fileArrayBuffer.byteLength),
      },
      body: fileArrayBuffer,
    });
    if (!attachmentRes.ok) {
      const body = await attachmentRes.text().catch(() => "");
      throw new Error(`Basecamp attachment create failed (${attachmentRes.status}): ${body}`);
    }

    const attachmentJson = (await attachmentRes.json()) as { attachable_sgid?: string };
    if (!attachmentJson.attachable_sgid) {
      throw new Error("Basecamp attachment creation succeeded but no attachable_sgid returned.");
    }

    sgids.push(attachmentJson.attachable_sgid);
  }

  return sgids;
}

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
  const basecampTarget = String(formData.get("basecamp_target") ?? "").trim() as BasecampTarget;

  const validTargets: BasecampTarget[] = ["todo", "card", "message_board"];
  if (
    !slug ||
    !title ||
    !priority ||
    !taskType ||
    !description ||
    !validTargets.includes(basecampTarget)
  ) {
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

  const attachments: SavedAttachment[] = [];

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
      name: file.name,
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

  // Trigger core automation callback.
  try {
    const clientName = (client as { id: string; name?: string }).name ?? slug;
    const callbackUrl = new URL("/api/public/tasks/post-create", request.url).toString();

    await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task.id,
        description,
        clientId: client.id,
        clientName,
        taskType,
        source: "card_creation_callback_only",
      }),
    });
  } catch (callbackErr) {
    console.error("Post-create callback failed:", callbackErr);
  }

  const accessToken = process.env.BASECAMP_ACCESS_TOKEN;
  const accountId = process.env.BASECAMP_ACCOUNT_ID;
  const projectId = process.env.BASECAMP_PROJECT_ID;
  if (!accessToken || !accountId || !projectId) {
    return NextResponse.json(
      {
        error:
          "Missing Basecamp configuration. Required: BASECAMP_ACCESS_TOKEN, BASECAMP_ACCOUNT_ID, BASECAMP_PROJECT_ID",
      },
      { status: 500 },
    );
  }

  try {
    const clientName = (client as { name?: string }).name ?? "Unknown";
    await createBasecampEntity({
      accountId,
      projectId,
      accessToken,
      title,
      description,
      priority,
      taskType,
      clientName,
      target: basecampTarget,
      attachments,
    });
  } catch (err) {
    console.error("Basecamp creation failed:", err);
    return NextResponse.json(
      {
        error: "Task saved, but Basecamp creation failed.",
        details: err instanceof Error ? err.message : "Unknown Basecamp error",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, id: task.id }, { status: 201 });
}

