import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createClient();

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query || query.length < 1) {
        return NextResponse.json({ users: [] });
    }

    // PostgREST 필터 특수문자 이스케이프 (SQL Injection 방지)
    const sanitized = query.replace(/[%_\\]/g, (char) => `\\${char}`);

    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, email, full_name, avatar_url")
            .or(`email.ilike.%${sanitized}%,full_name.ilike.%${sanitized}%`)
            .neq("id", user.id)
            .limit(10);

        if (error) {
            console.error("[UserSearch] Error:", error.message);
            return NextResponse.json({ error: "검색 중 오류가 발생했습니다.", users: [] }, { status: 500 });
        }

        return NextResponse.json({ users: data || [] });
    } catch (err) {
        console.error("[UserSearch] Unexpected error:", err instanceof Error ? err.message : err);
        return NextResponse.json({ error: "서버 오류가 발생했습니다.", users: [] }, { status: 500 });
    }
}
