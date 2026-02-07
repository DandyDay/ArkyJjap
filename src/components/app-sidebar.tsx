"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Network,
  Search,
  Settings,
  Plus,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/app", icon: Home, label: "홈" },
  { href: "/app/canvas", icon: Network, label: "캔버스" },
  { href: "/app/search", icon: Search, label: "검색" },
];

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const userInitial = user.email?.charAt(0).toUpperCase() || "U";

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
          <span className="text-sm font-bold text-background">A</span>
        </div>
        <span className="text-lg font-semibold">Arky</span>
      </div>

      <Separator />

      {/* New Button */}
      <div className="p-4">
        <Button className="w-full gap-2" asChild>
          <Link href="/app/canvas/new">
            <Plus className="h-4 w-4" />
            새 캔버스
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User Menu */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-start gap-3 px-2 py-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata.avatar_url} />
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="text-sm font-medium">
                  {user.user_metadata.full_name || user.email?.split("@")[0]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/app/settings" className="gap-2">
                <Settings className="h-4 w-4" />
                설정
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="gap-2"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  라이트 모드
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  다크 모드
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
