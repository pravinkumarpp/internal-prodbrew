import { NextResponse } from "next/server";

type BasecampPerson = {
  id: number;
  name: string;
  email_address: string;
  avatar_url: string;
  admin: boolean;
  company?: { id: number; name: string };
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryProjectId = searchParams.get("project_id");

  const accessToken = process.env.BASECAMP_ACCESS_TOKEN;
  const refreshToken = process.env.BASECAMP_REFRESH_TOKEN;
  const accountId = process.env.BASECAMP_ACCOUNT_ID;
  const projectId = queryProjectId || process.env.BASECAMP_PROJECT_ID;

  if (!accessToken || !accountId || !projectId) {
    return NextResponse.json(
      { error: "Missing Basecamp configuration (ACCESS_TOKEN, ACCOUNT_ID, or PROJECT_ID)" },
      { status: 500 },
    );
  }

  const userAgent = process.env.BASECAMP_USER_AGENT ?? "MaintainAI (support@maintainai.local)";

  const fetchPeople = async (token: string) => {
    const url = `https://3.basecampapi.com/${accountId}/projects/${projectId}/people.json`;
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": userAgent,
      },
    });
  };

  let res = await fetchPeople(accessToken);

  if (res.status === 401 && refreshToken) {
    try {
      const refreshed = await refreshAccessToken(refreshToken);
      res = await fetchPeople(refreshed.accessToken);
    } catch (err) {
      return NextResponse.json(
        { error: "Token refresh failed", details: err instanceof Error ? err.message : "" },
        { status: 401 },
      );
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return NextResponse.json(
      { error: `Basecamp API error (${res.status})`, details: body },
      { status: res.status },
    );
  }

  const people: BasecampPerson[] = await res.json();

  const HIDDEN_NAMES = ["Pravin Kumar P", "Arun"];

  const members = people
    .filter((p) => !HIDDEN_NAMES.includes(p.name))
    .map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email_address,
      avatar_url: p.avatar_url,
    }));

  return NextResponse.json(members);
}
