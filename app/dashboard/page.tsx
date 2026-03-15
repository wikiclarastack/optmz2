import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, MessageSquare, Bell, Zap } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: updates } = await supabase
    .from("updates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3)

  const { data: latestDownload } = await supabase
    .from("download_links")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-8">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindo ao FLUXZ
          </h2>
          <p className="text-muted-foreground max-w-lg">
            Seu PC está pronto para ser otimizado. Baixe a versão mais recente e comece a melhorar o desempenho agora.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/download">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Download</p>
                  <p className="text-xs text-muted-foreground">
                    {latestDownload?.version || "Disponível"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/updates">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Bell className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Atualizações</p>
                  <p className="text-xs text-muted-foreground">
                    {updates?.length || 0} novas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/chat">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-3/10">
                  <MessageSquare className="h-6 w-6 text-chart-3" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Chat</p>
                  <p className="text-xs text-muted-foreground">Comunidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Status</p>
                <p className="text-xs text-primary">Ativo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent updates */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Atualizações</CardTitle>
          <CardDescription>Novidades e melhorias do FLUXZ</CardDescription>
        </CardHeader>
        <CardContent>
          {updates && updates.length > 0 ? (
            <div className="space-y-4">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="flex items-start gap-4 rounded-lg border border-border p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {update.title}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {update.content}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(update.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma atualização disponível.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
