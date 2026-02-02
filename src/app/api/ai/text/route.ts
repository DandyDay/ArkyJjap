import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { text, type } = await req.json();

    if (!text) {
        return new NextResponse("Text is required", { status: 400 });
    }

    // TODO: Integrate OpenAI or another LLM provider here
    // For now, we simulate AI processing

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate latency

    let result = text;

    if (type === "improve") {
        result = `(AI Improved)\n${text}\n\n✨ 문장이 더 자연스럽게 다듬어졌습니다.`;
    } else if (type === "fix_grammar") {
        result = `(Grammar Fixed)\n${text}`;
    } else if (type === "summarize") {
        result = `YOUR SUMMARY:\n\n${text.substring(0, 50)}...`;
    } else if (type === "translate") {
        result = `(Translated)\n${text}`;
    }

    return NextResponse.json({ result });
}
