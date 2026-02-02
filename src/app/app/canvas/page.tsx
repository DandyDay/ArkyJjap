import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Network, MoreHorizontal, Layout, FileText } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import type { Canvas } from "@/lib/types";
import { getCanvases } from "@/lib/api/canvases";

export default async function CanvasListPage() {
  const canvases = await getCanvases();

  return (
    <div className="flex flex-col p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">캔버스</h1>
          <p className="mt-2 text-muted-foreground">
            지식을 연결하고 시각화하세요.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/canvas/new">
            <Plus className="mr-2 h-4 w-4" />
            새 캔버스
          </Link>
        </Button>
      </div>

      {!canvases || canvases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Network className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">캔버스가 없습니다</h3>
            <p className="mt-1 max-w-sm text-muted-foreground">
              새 캔버스를 만들어 아이디어를 연결하고 지식 그래프를 구축하세요.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/app/canvas/new">
                <Plus className="mr-2 h-4 w-4" />
                첫 번째 캔버스 만들기
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(canvases as Canvas[]).map((canvas) => (
            <Link key={canvas.id} href={`/app/canvas/${canvas.id}`}>
              <Card className="group cursor-pointer transition-all hover:border-brand hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {canvas.view_mode === "canvas" ? (
                        <Layout className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <CardTitle className="text-base font-medium line-clamp-1">
                        {canvas.title || "Untitled"}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.preventDefault();
                        // TODO: Show dropdown menu
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {canvas.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {canvas.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(canvas.updated_at))} 수정됨
                  </p>

                  {canvas.tags && canvas.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {canvas.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 text-[10px] rounded-full border bg-background/50"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
