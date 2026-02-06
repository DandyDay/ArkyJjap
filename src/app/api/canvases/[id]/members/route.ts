import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const canvasId = params.id;
    const { email, role = 'editor' } = await request.json();

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Find the user by email
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

    if (profileError || !profile) {
        return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
        );
    }

    // 2. Add as a member
    const { error: inviteError } = await supabase
        .from("canvas_members")
        .upsert({
            canvas_id: canvasId,
            user_id: profile.id,
            role: role
        });

    if (inviteError) {
        return NextResponse.json(
            { error: inviteError.message },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const canvasId = params.id;
    const supabase = await createClient();

    const { data: members, error } = await supabase
        .from("canvas_members")
        .select(`
      id,
      role,
      user_id,
      profiles:user_id (
        email,
        full_name,
        avatar_url
      )
    `)
        .eq("canvas_id", canvasId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members });
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const canvasId = params.id;
    const { userId } = await request.json();

    const supabase = await createClient();

    const { error } = await supabase
        .from("canvas_members")
        .delete()
        .eq("canvas_id", canvasId)
        .eq("user_id", userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
