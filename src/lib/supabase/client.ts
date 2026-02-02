import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요."
    );
  }

  // 더미 값 체크
  if (supabaseUrl.includes("your-project") || supabaseAnonKey === "your-anon-key") {
    throw new Error(
      "Supabase 환경 변수가 더미 값입니다. 실제 Supabase 프로젝트 정보로 교체해주세요."
    );
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
