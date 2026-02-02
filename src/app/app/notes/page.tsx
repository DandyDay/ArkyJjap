import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText } from "lucide-react";

export default function NotesPage() {
  return (
    <div className="flex flex-col p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">노트</h1>
          <p className="mt-2 text-muted-foreground">
            모든 노트를 한 곳에서 관리하세요.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/notes/new">
            <Plus className="mr-2 h-4 w-4" />
            새 노트
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">노트가 없습니다</h3>
          <p className="mt-1 max-w-sm text-muted-foreground">
            새 노트를 작성하고 캔버스에 연결해보세요.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/app/notes/new">
              <Plus className="mr-2 h-4 w-4" />
              첫 번째 노트 작성하기
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
