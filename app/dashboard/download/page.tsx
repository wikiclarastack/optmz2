import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, CheckCircle, Shield, Zap } from "lucide-react"

export default async function DownloadPage() {
  const supabase = await createClient()
  
  const { data: downloads } = await supabase
    .from("download_links")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const latestDownload = downloads?.[0]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Download</h2>
        <p className="text-muted-foreground">Baixe a versão mais recente do FLUXZ</p>
      </div>

      {/* Main download card */}
      {latestDownload ? (
        <Card className="relative overflow-hidden border-primary/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <CardHeader className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                Versão {latestDownload.version}
              </span>
              {latestDownload.is_active && (
                <span className="inline-flex items-center rounded-full bg-chart-4/10 px-2.5 py-0.5 text-xs font-medium text-chart-4">
                  Mais Recente
                </span>
              )}
            </div>
            <CardTitle className="text-xl">FLUXZ {latestDownload.version}</CardTitle>
            <CardDescription>
              {latestDownload.description || "Versão estável com melhorias de desempenho"}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">100% Seguro</p>
                  <p className="text-xs text-muted-foreground">Verificado</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
                  <Zap className="h-5 w-5 text-chart-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Rápido</p>
                  <p className="text-xs text-muted-foreground">Download leve</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                  <CheckCircle className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Testado</p>
                  <p className="text-xs text-muted-foreground">Aprovado</p>
                </div>
              </div>
            </div>

            <a href={latestDownload.url} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full sm:w-auto">
                <Download className="mr-2 h-5 w-5" />
                Baixar FLUXZ {latestDownload.version}
              </Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Download className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum download disponível no momento.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Previous versions */}
      {downloads && downloads.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Versões Anteriores</CardTitle>
            <CardDescription>Histórico de versões do FLUXZ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {downloads.slice(1).map((download) => (
                <div
                  key={download.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Versão {download.version}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(download.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <a href={download.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
