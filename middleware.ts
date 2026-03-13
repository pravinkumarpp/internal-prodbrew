import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const isProtectedPath = (pathname: string) => {
  if (pathname === "/confirmation" || pathname === "/login") return false;
  return (
    pathname === "/" ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/add-client") ||
    pathname === "/team" ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/client")
  );
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isSecure = request.nextUrl.protocol === "https:";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              secure: isSecure,
              sameSite: "lax",
              path: "/",
            });
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
