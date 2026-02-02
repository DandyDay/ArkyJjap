"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Sparkles } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex flex-col p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">검색</h1>
        <p className="mt-2 text-muted-foreground">
          AI로 노트와 캔버스를 검색하세요.
        </p>
      </div>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="검색어를 입력하세요..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 pl-12 text-lg"
          />
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
            <Sparkles className="h-8 w-8 text-brand" />
          </div>
          <h3 className="text-lg font-medium">AI 검색</h3>
          <p className="mt-1 max-w-sm text-muted-foreground">
            검색어를 입력하면 AI가 관련된 노트와 캔버스를 찾아드립니다.
            의미 기반 검색으로 연관된 지식을 발견하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
