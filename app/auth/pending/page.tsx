"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, LogOut } from "lucide-react"

export default function PendingPage() {
  const [checking, setChecking] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function checkStatus() {
    setChecking(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single()

      if (profile?.status === "approved") {
        router.push("/dashboard")
        return
      }
    }
    setChecking(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000) // Verificar a cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
            <Clock className="h-7 w-7 text-warning animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold">Aguardando Aprovação</CardTitle>
          <CardDescription>
            Seu registro está sendo analisado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground text-sm">
            Um administrador precisa aprovar sua conta antes que você possa acessar o FLUXZ. 
            Isso geralmente leva algumas horas.
          </p>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={checkStatus} 
              variant="outline" 
              className="w-full"
              disabled={checking}
            >
              {checking ? "Verificando..." : "Verificar status"}
            </Button>
            
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              className="w-full text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-primary hover:underline">
              Voltar para a página inicial
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
