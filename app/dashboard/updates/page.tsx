import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Sparkles, Bug, Wrench } from "lucide-react"

const typeIcons = {
  feature: Sparkles,
  bugfix: Bug,
  improvement: Wrench,
  announcement: Bell,
}

const typeLabels = {
  feature: "Novo Recurso",
  bugfix: "Correção",
  improvement: "Melhoria",
  announcement: "Anúncio",
}

const typeColors = {
  feature: "text-chart-2 bg-chart-2/10",
  bugfix: "text-destructive bg-destructive/10",
  improvement: "text-chart-3 bg-chart-3/10",
  announcement: "text-primary bg-primary/10",
}

export default async function UpdatesPage() {
  const supabase = await createClient()
  
  const { data: updates } = await supabase
    .from("updates")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Atualizações</h2>
        <p className="text-muted-foreground">Novidades e changelog do FLUXZ</p>
      </div>

      {updates && updates.length > 0 ? (
        <div className="space-y-4">
          {updates.map((update) => {
            const type = update.type as keyof typeof typeIcons
            const Icon = typeIcons[type] || Bell
            const label = typeLabels[type] || "Atualização"
            const colorClass = typeColors[type] || "text-primary bg-primary/10"

            return (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
                          {label}
                        </span>
                        {update.version && (
                          <span className="text-xs text-muted-foreground">
                            v{update.version}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg">{update.title}</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(update.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {update.content}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma atualização disponível.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
