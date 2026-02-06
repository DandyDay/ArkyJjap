import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_ROLES = ["viewer", "editor"] as const;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: canvasId } = await params;
    const { email, role = 'editor' } = await request.json();

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // role 검증
    if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    try {
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: "사용자를 찾을 수 없습니다. 해당 사용자가 먼저 로그인해야 합니다." },
                { status: 404 }
            );
        }

        const { error: inviteError } = await supabase
            .from("canvas_members")
            .upsert({
                canvas_id: canvasId,
                user_id: profile.id,
                role,
            });

        if (inviteError) {
            console.error("[Members] Invite error:", inviteError.message);
            return NextResponse.json({ error: "멤버 초대에 실패했습니다." }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[Members] Unexpected error:", err instanceof Error ? err.message : err);
        return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
    }
}

interface MemberRow {
    id: string;
    role: string;
    user_id: string;
}

interface ProfileRow {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: canvasId } = await params;

    try {
        const { data: members, error: membersError } = await supabase
            .from("canvas_members")
            .select("id, role, user_id")
            .eq("canvas_id", canvasId);

        if (membersError) throw membersError;

        if (!members || members.length === 0) {
            return NextResponse.json({ members: [] });
        }

        const userIds = members.map((m: MemberRow) => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, email, full_name, avatar_url")
            .in("id", userIds);

        if (profilesError) throw profilesError;

        const membersWithProfiles = members.map((m: MemberRow) => ({
            ...m,
            profiles: profiles?.find((p: ProfileRow) => p.id === m.user_id) || null
        }));

        return NextResponse.json({ members: membersWithProfiles });
    } catch (err) {
        console.error("[Members] GET error:", err instanceof Error ? err.message : err);
        return NextResponse.json({ error: "멤버 목록을 가져오는데 실패했습니다.", members: [] }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: canvasId } = await params;
    const { userId } = await request.json();

    if (!userId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { error } = await supabase
        .from("canvas_members")
        .delete()
        .eq("canvas_id", canvasId)
        .eq("user_id", userId);

    if (error) {
        console.error("[Members] DELETE error:", error.message);
        return NextResponse.json({ error: "멤버 삭제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
