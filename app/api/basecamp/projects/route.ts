import { NextResponse } from "next/server";

type BasecampProject = {
  id: number;
  name: string;
  description: string;
  purpose: string;
  app_url: string;
  created_at: string;
  updated_at: string;
};

async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.BASECAMP_CLIENT_ID;
  const clientSecret = process.env.BASECAMP_CLIENT_SECRET;
  const tokenUrl =
    process.env.BASECAMP_TOKEN_URL ?? "https://launchpad.37signals.com/authorization/token";

  if (!clientId || !clientSecret) {
    throw new Error("Missing BASECAMP_CLIENT_ID or BASECAMP_CLIENT_SECRET");
  }

  const body = new URLSearchParams({
    type: "refresh",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Token refresh failed (${res.status}): ${errBody}`);
  }

  const json = await res.json();
  if (!json.access_token) {
    throw new Error("Token refresh returned no access_token");
  }

  return {
    accessToken: json.access_token as string,
    refreshToken: (json.refresh_token as string) || refreshToken,
  };
}

export async function GET() {
  const accessToken = process.env.BASECAMP_ACCESS_TOKEN;
  const refreshToken = process.env.BASECAMP_REFRESH_TOKEN;
  const accountId = process.env.BASECAMP_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    return NextResponse.json(
      { error: "Missing Basecamp configuration (ACCESS_TOKEN or ACCOUNT_ID)" },
      { status: 500 },
    );
  }

  const userAgent = process.env.BASECAMP_USER_AGENT ?? "MaintainAI (support@maintainai.local)";

  function getNextPageUrl(linkHeader: string | null): string | null {
    if (!linkHeader) return null;
    const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    return match ? match[1] : null;
  }

  async function fetchAllProjects(token: string): Promise<{ ok: boolean; status: number; data: BasecampProject[]; error?: string }> {
    const allProjects: BasecampProject[] = [];
    let url: string | null = `https://3.basecampapi.com/${accountId}/projects.json`;

    while (url) {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": userAgent,
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, status: res.status, data: [], error: body };
      }

      const page: BasecampProject[] = await res.json();
      allProjects.push(...page);
      url = getNextPageUrl(res.headers.get("Link"));
    }

    return { ok: true, status: 200, data: allProjects };
  }

  let result = await fetchAllProjects(accessToken);

  if (!result.ok && result.status === 401 && refreshToken) {
    try {
      const refreshed = await refreshAccessToken(refreshToken);
      result = await fetchAllProjects(refreshed.accessToken);
    } catch (err) {
      return NextResponse.json(
        { error: "Token refresh failed", details: err instanceof Error ? err.message : "" },
        { status: 401 },
      );
    }
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: `Basecamp API error (${result.status})`, details: result.error },
      { status: result.status },
    );
  }

  const projects = result.data.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || "",
    app_url: p.app_url || "",
  }));

  return NextResponse.json(projects);
}
