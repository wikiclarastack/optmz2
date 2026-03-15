"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Ban, Trash2, Shield, User, CheckCircle } from "lucide-react"

interface Profile {
  id: string
  username: string
  avatar_url: string | null
  role: string
  status: string
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) {
      setUsers(data)
    }
    setLoading(false)
  }

  async function handleBan(userId: string) {
    setActionLoading(userId)
    await supabase
      .from("profiles")
      .update({ status: "banned" })
      .eq("id", userId)

    await logAction(userId, "Usuário banido")
    await loadUsers()
    setActionLoading(null)
  }

  async function handleUnban(userId: string) {
    setActionLoading(userId)
    await supabase
      .from("profiles")
      .update({ status: "approved" })
      .eq("id", userId)

    await logAction(userId, "Usuário desbanido")
    await loadUsers()
    setActionLoading(null)
  }

  async function handleDelete(userId: string) {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) return
    
    setActionLoading(userId)
    await supabase.auth.admin.deleteUser(userId)
    await logAction(userId, "Usuário deletado")
    await loadUsers()
    setActionLoading(null)
  }

  async function handleMakeAdmin(userId: string) {
    setActionLoading(userId)
    await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", userId)

    await logAction(userId, "Usuário promovido a admin")
    await loadUsers()
    setActionLoading(null)
  }

  async function handleRemoveAdmin(userId: string) {
    setActionLoading(userId)
    await supabase
      .from("profiles")
      .update({ role: "user" })
      .eq("id", userId)

    await logAction(userId, "Admin rebaixado a usuário")
    await loadUsers()
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

  const filteredUsers = users.filter((user) =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <h2 className="text-2xl font-bold text-foreground">Usuários</h2>
        <p className="text-muted-foreground">Gerencie todos os usuários do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Usuários</CardTitle>
              <CardDescription>{filteredUsers.length} usuário(s)</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar usuário..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum usuário encontrado.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {user.username}
                        </p>
                        {user.role === "admin" && (
                          <Shield className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Criado em {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.status === "approved" 
                        ? "bg-chart-4/10 text-chart-4" 
                        : user.status === "pending"
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {user.status === "approved" ? "Aprovado" : user.status === "pending" ? "Pendente" : "Banido"}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={actionLoading === user.id}>
                          {actionLoading === user.id ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.status === "banned" ? (
                          <DropdownMenuItem onClick={() => handleUnban(user.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Desbanir
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleBan(user.id)}>
                            <Ban className="mr-2 h-4 w-4" />
                            Banir
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {user.role === "admin" ? (
                          <DropdownMenuItem onClick={() => handleRemoveAdmin(user.id)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Remover Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleMakeAdmin(user.id)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Tornar Admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(user.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
