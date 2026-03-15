"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  MessageSquare,
  Bell,
  Download,
  FileText,
  Shield,
} from "lucide-react"

interface SidebarProps {
  profile: {
    id: string
    username: string
    avatar_url: string | null
    role: string
  }
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Usuários", href: "/admin/users", icon: Users },
  { name: "Aprovações", href: "/admin/approvals", icon: UserCheck },
  { name: "Chat", href: "/admin/chat", icon: MessageSquare },
  { name: "Atualizações", href: "/admin/updates", icon: Bell },
  { name: "Downloads", href: "/admin/downloads", icon: Download },
  { name: "Logs", href: "/admin/logs", icon: FileText },
]

export function AdminSidebar({ profile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-border bg-card lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
            <Shield className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <span className="text-xl font-bold text-foreground">Admin</span>
            <p className="text-xs text-muted-foreground">Painel de Controle</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Back to dashboard */}
        <div className="border-t border-border p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            Voltar ao Dashboard
          </Link>
        </div>
      </aside>

      {/* Mobile navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card p-2 lg:hidden">
        {navigation.slice(0, 5).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          )
        })}
      </nav>
    </>
  )
}
