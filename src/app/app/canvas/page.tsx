import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Network, Layout, FileText, Clock } from "lucide-react";

import { formatDistanceToNow } from "@/lib/utils";
import type { Canvas } from "@/lib/types";
import { getCanvases } from "@/lib/api/canvases";
import { createClient } from "@/lib/supabase/server";

export default async function CanvasListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const canvases = await getCanvases(supabase) as Canvas[];

  const ownedCanvases = canvases.filter(c => c.user_id === user?.id);
  const sharedCanvases = canvases.filter(c => c.user_id !== user?.id);

  return (
    <div className="flex flex-col p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">캔버스</h1>
          <p className="mt-2 text-muted-foreground">
            지식을 연결하고 시각화하세요.
          </p>
        </div>
        <Button asChild className="rounded-full px-6">
          <Link href="/app/canvas/new">
            <Plus className="mr-2 h-4 w-4" />
            새 캔버스
          </Link>
        </Button>
      </div>

      <div className="space-y-12">
        {/* Owned Canvases */}
        <section>
          <div className="mb-6 flex items-center gap-2">
            <Layout className="h-5 w-5 text-brand" />
            <h2 className="text-xl font-semibold">내 캔버스</h2>
          </div>

          {ownedCanvases.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">생성한 캔버스가 없습니다.</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/app/canvas/new">첫 번째 캔버스 만들기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ownedCanvases.map((canvas) => (
                <CanvasCard key={canvas.id} canvas={canvas} />
              ))}
            </div>
          )}
        </section>

        {/* Shared Canvases */}
        <section>
          <div className="mb-6 flex items-center gap-2">
            <Network className="h-5 w-5 text-brand" />
            <h2 className="text-xl font-semibold">공유받은 캔버스</h2>
          </div>

          {sharedCanvases.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">공유받은 캔버스가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sharedCanvases.map((canvas) => (
                <CanvasCard key={canvas.id} canvas={canvas} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CanvasCard({ canvas }: { canvas: Canvas }) {
  return (
    <Link href={`/app/canvas/${canvas.id}`}>
      <Card className="group relative h-full cursor-pointer overflow-hidden transition-all hover:border-brand hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {canvas.view_mode === "canvas" ? (
                <Layout className="h-4 w-4 text-muted-foreground" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-brand transition-colors">
                {canvas.title || "Untitled"}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {canvas.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
              {canvas.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(canvas.updated_at))} 수정됨
            </p>
          </div>

          {canvas.tags && canvas.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {canvas.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-full border bg-background/50 backdrop-blur-sm"
                  style={{ borderColor: `${tag.color}40`, color: tag.color, backgroundColor: `${tag.color}10` }}
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

