import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";


export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      console.error(`[Auth] getUser error: ${error.message} (path: ${request.nextUrl.pathname})`);
    }


    // 보호된 라우트 처리
    if (
      !user &&
      request.nextUrl.pathname.startsWith("/app")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }

    // 이미 로그인된 사용자가 로그인 페이지 접근 시
    if (user && request.nextUrl.pathname === "/signin") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }


    return supabaseResponse;
  } catch (err) {
    console.error("[Auth] Middleware error:", err instanceof Error ? err.message : err);
    return NextResponse.next({ request });
  }
}
