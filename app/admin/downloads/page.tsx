"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Empty } from "@/components/ui/empty"
import { Plus, Trash2, Download, ExternalLink } from "lucide-react"

interface DownloadLink {
  id: string
  version: string
  url: string
  description: string | null
  is_active: boolean
  created_at: string
}

export default function AdminDownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  const [version, setVersion] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  
  const supabase = createClient()

  useEffect(() => {
    loadDownloads()
  }, [])

  async function loadDownloads() {
    const { data } = await supabase
      .from("download_links")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) {
      setDownloads(data)
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase.from("download_links").insert({
      version,
      url,
      description: description || null,
      is_active: true,
      created_by: user?.id,
    })

    if (user) {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: `Download criado: v${version}`,
        target_type: "download",
      })
    }

    setVersion("")
    setUrl("")
    setDescription("")
    setShowForm(false)
    await loadDownloads()
    setSaving(false)
  }

  async function handleToggleActive(downloadId: string, currentStatus: boolean) {
    await supabase
      .from("download_links")
      .update({ is_active: !currentStatus })
      .eq("id", downloadId)

    await loadDownloads()
  }

  async function handleDelete(downloadId: string) {
    setDeleting(downloadId)
    await supabase.from("download_links").delete().eq("id", downloadId)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "Download deletado",
        target_id: downloadId,
        target_type: "download",
      })
    }
    
    await loadDownloads()
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
          <h2 className="text-2xl font-bold text-foreground">Downloads</h2>
          <p className="text-muted-foreground">Gerencie os links de download</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Download
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Download</CardTitle>
            <CardDescription>Crie um novo link de download</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="version">Versão</FieldLabel>
                    <Input
                      id="version"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="Ex: 2.5.0"
                      required
                      disabled={saving}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="url">URL do Download</FieldLabel>
                    <Input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      required
                      disabled={saving}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="description">Descrição (opcional)</FieldLabel>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Novidades desta versão..."
                    disabled={saving}
                  />
                </Field>
              </FieldGroup>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner className="mr-2" /> : null}
                  {saving ? "Criando..." : "Criar Download"}
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
          <CardTitle>Links de Download</CardTitle>
          <CardDescription>{downloads.length} download(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {downloads.length === 0 ? (
            <Empty
              icon={<Download className="h-12 w-12" />}
              title="Nenhum download"
              description="Adicione o primeiro link de download."
            />
          ) : (
            <div className="space-y-3">
              {downloads.map((download) => (
                <div
                  key={download.id}
                  className={`flex items-center justify-between gap-4 rounded-lg border p-4 ${
                    download.is_active ? "border-primary/30 bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      download.is_active ? "bg-primary/10" : "bg-secondary"
                    }`}>
                      <Download className={`h-5 w-5 ${download.is_active ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          Versão {download.version}
                        </span>
                        {download.is_active && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Ativo
                          </span>
                        )}
                      </div>
                      {download.description && (
                        <p className="text-sm text-muted-foreground">{download.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(download.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <a href={download.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(download.id, download.is_active)}
                    >
                      {download.is_active ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(download.id)}
                      disabled={deleting === download.id}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      {deleting === download.id ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
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
