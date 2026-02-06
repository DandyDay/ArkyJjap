import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  // Open Redirect 취약점 방지: 상대 경로만 허용
  const isValidPath = next.startsWith("/") && !next.startsWith("//") && !next.includes(":");
  const safePath = isValidPath ? next : "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 프로필 자동 생성 (Self-healing: 최초 로그인 시 1회만 실행)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!profile) {
          await supabase.from("profiles").insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url
          });
        }
      }

      return NextResponse.redirect(`${origin}${safePath}`);
    } else {
      console.error("[Auth] Code exchange error:", error.message);
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth`);
}
