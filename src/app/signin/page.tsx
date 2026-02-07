"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type AuthMode = "magic-link" | "password-login" | "password-signup";

function SignInContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("password-login");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Supabase 클라이언트 생성 (렌더 중 setState 호출 방지)
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  // Supabase 클라이언트 생성 실패 시 상태 업데이트
  useEffect(() => {
    if (!supabase) {
      setIsSupabaseConfigured(false);
    }
  }, [supabase]);

  // URL 에러 파라미터 처리
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "auth") {
      setMessage({ type: "error", text: "인증에 실패했습니다. 다시 시도해주세요." });
    }
  }, [searchParams]);

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Auth error:", error);
        setMessage({ type: "error", text: "로그인 중 오류가 발생했습니다. 이메일 주소를 확인해주세요." });
      } else {
        setMessage({
          type: "success",
          text: "이메일을 확인해주세요! 로그인 링크를 보냈습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다. 다시 시도해주세요." });
    }

    setIsLoading(false);
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setIsLoading(true);
    setMessage(null);

    try {
      if (authMode === "password-signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: name },
          },
        });

        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          setMessage({
            type: "success",
            text: "회원가입이 완료되었습니다. 이메일 인증이 필요한 경우 이메일을 확인해주세요.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage({ type: "error", text: "이메일 또는 비밀번호가 올바르지 않습니다." });
        } else {
          router.push("/app");
          router.refresh();
        }
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) return;

    setIsGoogleLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Google auth error:", error);
        setMessage({ type: "error", text: "Google 로그인 중 오류가 발생했습니다." });
        setIsGoogleLoading(false);
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
      setIsGoogleLoading(false);
    }
  };

  // Supabase가 설정되지 않은 경우
  if (!isSupabaseConfigured) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Supabase 설정 필요</h1>
        <p className="mt-4 text-muted-foreground">
          로그인 기능을 사용하려면 Supabase 프로젝트를 설정해야 합니다.
        </p>
        <div className="mt-6 rounded-lg border bg-muted/50 p-4 text-left text-sm">
          <p className="font-medium">설정 방법:</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
            <li>supabase.com에서 프로젝트 생성</li>
            <li>Settings → API에서 URL과 anon key 복사</li>
            <li>.env.local 파일에 환경 변수 설정</li>
            <li>서버 재시작 (npm run dev)</li>
          </ol>
        </div>
        <Button className="mt-6" asChild>
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2" aria-label="Arky 홈으로 이동">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
            <span className="text-lg font-bold text-background" aria-hidden="true">A</span>
          </div>
        </Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          {authMode === "password-signup" ? "계정 만들기" : "로그인"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {authMode === "password-signup"
            ? "Arky와 함께 지식 캔버스를 시작하세요"
            : "계정에 로그인하고 지식 캔버스를 시작하세요"}
        </p>
      </div>

      <div className="space-y-6">
        <Button
          variant="outline"
          className="h-12 w-full gap-3"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Google로 계속하기
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        <form onSubmit={authMode === "magic-link" ? handleMagicLinkSignIn : handlePasswordAuth} className="space-y-4">
          {authMode === "password-signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12"
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
              autoComplete="email"
            />
          </div>

          {authMode !== "magic-link" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
                {authMode === "password-login" && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setAuthMode("magic-link")}
                  >
                    비밀번호를 잊으셨나요? (매직 링크)
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
                autoComplete={authMode === "password-signup" ? "new-password" : "current-password"}
              />
            </div>
          )}

          <Button type="submit" className="h-12 w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              authMode === "password-signup"
                ? "회원가입"
                : authMode === "password-login"
                  ? "로그인"
                  : "매직 링크 보내기"
            )}
          </Button>

          <div className="text-center">
            {authMode === "password-login" ? (
              <p className="text-sm text-muted-foreground">
                계정이 없으신가요?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("password-signup")}
                  className="font-medium text-foreground hover:underline"
                >
                  회원가입
                </button>
              </p>
            ) : authMode === "password-signup" ? (
              <p className="text-sm text-muted-foreground">
                이미 계정이 있으신가요?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("password-login")}
                  className="font-medium text-foreground hover:underline"
                >
                  로그인
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setAuthMode("password-login")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                비밀번호로 로그인하기
              </button>
            )}
          </div>
        </form>


        {message && (
          <div
            role="alert"
            aria-live="polite"
            className={`rounded-lg p-4 text-sm ${message.type === "success"
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-destructive/10 text-destructive"
              }`}
          >
            {message.text}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          계속하면{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            이용약관
          </Link>{" "}
          및{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            개인정보처리방침
          </Link>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

function SignInLoading() {
  return (
    <div className="w-full max-w-sm">
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense fallback={<SignInLoading />}>
        <SignInContent />
      </Suspense>
    </div>
  );
}
