"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Empty } from "@/components/ui/empty"
import { Plus, Trash2, Bell, Sparkles, Bug, Wrench } from "lucide-react"

interface Update {
  id: string
  title: string
  content: string
  type: string
  version: string | null
  created_at: string
}

const typeOptions = [
  { value: "announcement", label: "Anúncio", icon: Bell },
  { value: "feature", label: "Novo Recurso", icon: Sparkles },
  { value: "bugfix", label: "Correção", icon: Bug },
  { value: "improvement", label: "Melhoria", icon: Wrench },
]

export default function AdminUpdatesPage() {
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState("announcement")
  const [version, setVersion] = useState("")
  
  const supabase = createClient()

  useEffect(() => {
    loadUpdates()
  }, [])

  async function loadUpdates() {
    const { data } = await supabase
      .from("updates")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) {
      setUpdates(data)
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase.from("updates").insert({
      title,
      content,
      type,
      version: version || null,
      created_by: user?.id,
    })

    if (user) {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: `Atualização criada: ${title}`,
        target_type: "update",
      })
    }

    setTitle("")
    setContent("")
    setType("announcement")
    setVersion("")
    setShowForm(false)
    await loadUpdates()
    setSaving(false)
  }

  async function handleDelete(updateId: string) {
    setDeleting(updateId)
    await supabase.from("updates").delete().eq("id", updateId)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "Atualização deletada",
        target_id: updateId,
        target_type: "update",
      })
    }
    
    await loadUpdates()
    setDeleting(null)
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Atualizações</h2>
          <p className="text-muted-foreground">Gerencie as atualizações e changelog</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Atualização
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Atualização</CardTitle>
            <CardDescription>Adicione uma nova atualização ao sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">Título</FieldLabel>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título da atualização"
                    required
                    disabled={saving}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="type">Tipo</FieldLabel>
                    <select
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={saving}
                    >
                      {typeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="version">Versão (opcional)</FieldLabel>
                    <Input
                      id="version"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="Ex: 2.5.0"
                      disabled={saving}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="content">Conteúdo</FieldLabel>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Descreva a atualização..."
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                    disabled={saving}
                  />
                </Field>
              </FieldGroup>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner className="mr-2" /> : null}
                  {saving ? "Criando..." : "Criar Atualização"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Atualizações Existentes</CardTitle>
          <CardDescription>{updates.length} atualização(ões)</CardDescription>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <Empty
              icon={<Bell className="h-12 w-12" />}
              title="Nenhuma atualização"
              description="Crie a primeira atualização."
            />
          ) : (
            <div className="space-y-3">
              {updates.map((update) => {
                const typeOpt = typeOptions.find((t) => t.value === update.type)
                const Icon = typeOpt?.icon || Bell
                return (
                  <div
                    key={update.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {update.title}
                          </span>
                          {update.version && (
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                              v{update.version}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {update.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(update.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(update.id)}
                      disabled={deleting === update.id}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      {deleting === update.id ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
