"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { createCanvas } from "@/lib/api/canvases";

export default function NewCanvasPage() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const canvas = await createCanvas(name.trim() || "Untitled");
      router.push(`/app/canvas/${canvas.id}`);
    } catch (err) {
      console.error("Failed to create canvas:", err);
      setError("캔버스 생성에 실패했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-8">
      <div className="mb-8">
        <Link
          href="/app/canvas"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          캔버스로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">새 캔버스</h1>
        <p className="mt-2 text-muted-foreground">
          새로운 지식 캔버스를 만들어보세요.
        </p>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">캔버스 이름</Label>
            <Input
              id="name"
              placeholder="예: 프로젝트 아이디어, 독서 노트..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button type="submit" className="h-12" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "캔버스 만들기"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
