import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import fs from "fs";


export async function updateSession(request: NextRequest) {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
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
      if (typeof window === "undefined" && fs && fs.appendFileSync) {
        fs.appendFileSync("auth_debug.log", `Middleware getUser error: ${error.message} (path: ${request.nextUrl.pathname})\n`);
      }
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
  } catch (err: any) {
    if (typeof window === "undefined" && fs && fs.appendFileSync) {
      fs.appendFileSync("auth_debug.log", `Middleware panic: ${err.message}\n${err.stack}\n`);
    }
    return NextResponse.next({ request });
  }
}
