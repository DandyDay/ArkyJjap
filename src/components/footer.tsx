import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
              <span className="text-xs font-bold text-background">A</span>
            </div>
            <span className="font-medium">Arky</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              개인정보처리방침
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2024 Arky. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
