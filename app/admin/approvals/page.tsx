"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Empty } from "@/components/ui/empty"
import { CheckCircle, XCircle, User, Clock } from "lucide-react"

interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export default function ApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPendingUsers()
  }, [])

  async function loadPendingUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })

    if (data) {
      setPendingUsers(data)
    }
    setLoading(false)
  }

  async function handleApprove(userId: string) {
    setActionLoading(userId)
    await supabase
      .from("profiles")
      .update({ status: "approved" })
      .eq("id", userId)

    await logAction(userId, "Usuário aprovado")
    await loadPendingUsers()
    setActionLoading(null)
  }

  async function handleReject(userId: string) {
    setActionLoading(userId)
    await supabase
      .from("profiles")
      .update({ status: "banned" })
      .eq("id", userId)

    await logAction(userId, "Usuário rejeitado")
    await loadPendingUsers()
    setActionLoading(null)
  }

  async function logAction(targetUserId: string, action: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action,
        target_id: targetUserId,
        target_type: "user",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Aprovações</h2>
        <p className="text-muted-foreground">Aprovar ou rejeitar novos usuários</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários Pendentes</CardTitle>
          <CardDescription>
            {pendingUsers.length} usuário(s) aguardando aprovação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <Empty
              icon={<Clock className="h-12 w-12" />}
              title="Nenhum usuário pendente"
              description="Todos os usuários foram processados."
            />
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-warning/30 bg-warning/5 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {user.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Registrado em {new Date(user.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(user.id)}
                      disabled={actionLoading === user.id}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      {actionLoading === user.id ? (
                        <Spinner className="mr-2 h-4 w-4" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(user.id)}
                      disabled={actionLoading === user.id}
                      className="bg-chart-4 text-chart-4-foreground hover:bg-chart-4/90"
                    >
                      {actionLoading === user.id ? (
                        <Spinner className="mr-2 h-4 w-4" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Aprovar
                    </Button>
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
