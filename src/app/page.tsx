import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Network, FileText, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-transparent" />
            <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-brand" />
                <span>AI 기반 지식 관리</span>
              </div>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                당신의{" "}
                <span className="bg-gradient-to-r from-brand to-brand/60 bg-clip-text text-transparent">
                  지식 캔버스
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                아이디어를 자유롭게 연결하고, AI와 함께 지식을 구조화하세요.
                생각의 흐름을 시각화하고 새로운 통찰을 발견하세요.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="h-12 px-8" asChild>
                  <Link href="/signin">
                    무료로 시작하기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8" asChild>
                  <Link href="#features">기능 살펴보기</Link>
                </Button>
              </div>
            </div>

            {/* Preview Image Placeholder */}
            <div className="mt-20 overflow-hidden rounded-2xl border border-border/40 bg-muted/30 shadow-2xl">
              <div className="aspect-video w-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground/10">
                    <Network className="h-8 w-8" />
                  </div>
                  <p className="text-sm">앱 미리보기</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                생각을 정리하는 새로운 방법
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                복잡한 아이디어도 직관적으로 관리하세요
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<Network className="h-6 w-6" />}
                title="그래프 기반 연결"
                description="노드와 엣지로 지식을 연결하고, 아이디어 간의 관계를 시각적으로 탐색하세요."
              />
              <FeatureCard
                icon={<FileText className="h-6 w-6" />}
                title="마크다운 에디터"
                description="익숙한 마크다운 문법으로 빠르게 메모하고, 수식과 코드도 지원합니다."
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title="AI 어시스턴트"
                description="AI가 관련 노트를 추천하고, 지식의 연결고리를 발견하도록 도와줍니다."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border/40 py-20 md:py-32">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              지금 바로 시작하세요
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              무료로 시작하고, 당신만의 지식 캔버스를 만들어보세요.
            </p>
            <Button size="lg" className="mt-8 h-12 px-8" asChild>
              <Link href="/signin">
                무료로 시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-border/40 bg-card p-8 transition-all hover:border-border hover:shadow-lg">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}
