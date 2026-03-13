import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

async function findInvitedUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 50;
  while (true) {
    const {
      data: { users },
      error,
    } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) return null;
    const match = users.find(
      (u) => u.email?.trim().toLowerCase() === normalized,
    );
    if (match) return match;
    if (users.length < perPage) break;
    page++;
  }
  return null;
}

export async function POST(request: Request) {
  const { email, fullName, role } = await request.json();

  if (!email || !role) {
    return NextResponse.json(
      { error: "Email and role are required." },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const origin =
    request.headers.get("origin") ||
    (request.headers.get("x-forwarded-host")
      ? `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("x-forwarded-host")}`
      : null) ||
    url.origin;
  const redirectTo = `${origin}/confirmation`;

  const existing = await findInvitedUserByEmail(email);
  if (existing) {
    if (existing.email_confirmed_at) {
      return NextResponse.json(
        {
          error:
            "This user already has an account. They can sign in on the login page.",
        },
        { status: 400 },
      );
    }
    if (existing.invited_at) {
      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(
        existing.id,
      );
      if (delErr) {
        return NextResponse.json(
          { error: "Could not resend invite. Try again later." },
          { status: 500 },
        );
      }
    }
  }

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        full_name: fullName,
        role,
      },
      redirectTo,
    },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, user: data }, { status: 200 });
}
