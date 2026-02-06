import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import fs from "fs";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  // File log for debugging
  const logMsg = `\n[${new Date().toISOString()}] Callback received: code=${code?.substring(0, 5)}... origin=${origin}\n`;
  fs.appendFileSync("auth_debug.log", logMsg);


  // Open Redirect 취약점 방지: 상대 경로만 허용
  const isValidPath = next.startsWith("/") && !next.startsWith("//") && !next.includes(":");
  const safePath = isValidPath ? next : "/app";

  if (code) {
    console.log("Exchange code for session start", { code: code.substring(0, 5) + "..." });
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      fs.appendFileSync("auth_debug.log", `Success! Redirecting to ${safePath}\n`);
      console.log("Exchange success, redirecting to", safePath);
      return NextResponse.redirect(`${origin}${safePath}`);
    } else {
      fs.appendFileSync("auth_debug.log", `Error: ${JSON.stringify(error)}\n`);
      console.error("Exchange error:", error);
    }

  } else {
    console.warn("No code provided in callback");
  }

  return NextResponse.redirect(`${origin}/signin?error=auth`);
}
