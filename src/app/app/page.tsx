import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Network, Clock, Sparkles } from "lucide-react";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const greeting = getGreeting();
  const userName = user?.user_metadata.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "사용자";

  return (
    <div className="flex flex-col p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {userName}님
        </h1>
        <p className="mt-2 text-muted-foreground">
          오늘도 지식을 연결하고 새로운 통찰을 발견하세요.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="group cursor-pointer transition-all hover:border-brand hover:shadow-md">
          <Link href="/app/canvas/new" className="block h-full">
            <CardHeader className="pb-2">
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                <Plus className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">새 캔버스</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                새로운 지식 캔버스를 만들고 아이디어를 정리하세요.
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="group cursor-pointer transition-all hover:border-border hover:shadow-md">
          <Link href="/app/canvas" className="block h-full">
            <CardHeader className="pb-2">
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                <Network className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">모든 캔버스</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                생성한 캔버스들을 확인하고 관리하세요.
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="group cursor-pointer transition-all hover:border-border hover:shadow-md">
          <Link href="/app/search" className="block h-full">
            <CardHeader className="pb-2">
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">AI 검색</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI로 노트를 검색하고 연관된 지식을 찾아보세요.
              </CardDescription>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">최근 활동</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Network className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">아직 캔버스가 없습니다</h3>
            <p className="mt-1 text-muted-foreground">
              첫 번째 캔버스를 만들어 지식 관리를 시작하세요.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/app/canvas/new">
                <Plus className="mr-2 h-4 w-4" />
                새 캔버스 만들기
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 18) return "좋은 오후에요";
  return "좋은 저녁이에요";
}
