import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query || query.length < 2) {
        return NextResponse.json({ users: [] });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .ilike("email", `%${query}%`)
        .limit(5);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
}
