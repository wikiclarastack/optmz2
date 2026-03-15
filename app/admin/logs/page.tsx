import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty } from "@/components/ui/empty"
import { FileText, User, Clock } from "lucide-react"

export default async function AdminLogsPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from("audit_log")
    .select("*, profiles:user_id(username, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Logs de Auditoria</h2>
        <p className="text-muted-foreground">Histórico de ações no sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>{logs?.length || 0} registro(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <Empty
              icon={<FileText className="h-12 w-12" />}
              title="Nenhum log"
              description="As atividades aparecerão aqui."
            />
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 rounded-lg border border-border p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
                        {log.profiles?.avatar_url ? (
                          <img src={log.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {log.profiles?.username || "Sistema"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.action}</p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono bg-secondary/50 p-2 rounded">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
