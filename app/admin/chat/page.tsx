"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Empty } from "@/components/ui/empty"
import { Search, Trash2, User, MessageSquare } from "lucide-react"

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

export default function AdminChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMessages()
  }, [])

  async function loadMessages() {
    const { data } = await supabase
      .from("chat_messages")
      .select("*, profiles:user_id(username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(100)

    if (data) {
      setMessages(data as Message[])
    }
    setLoading(false)
  }

  async function handleDelete(messageId: string) {
    setDeleting(messageId)
    await supabase.from("chat_messages").delete().eq("id", messageId)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "Mensagem de chat deletada",
        target_id: messageId,
        target_type: "message",
      })
    }
    
    await loadMessages()
    setDeleting(null)
  }

  const filteredMessages = messages.filter((message) =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h2 className="text-2xl font-bold text-foreground">Gerenciar Chat</h2>
        <p className="text-muted-foreground">Visualize e modere mensagens do chat geral</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Mensagens do Chat</CardTitle>
              <CardDescription>{filteredMessages.length} mensagem(s)</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar mensagens..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <Empty
              icon={<MessageSquare className="h-12 w-12" />}
              title="Nenhuma mensagem"
              description="O chat está vazio."
            />
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                      {message.profiles?.avatar_url ? (
                        <img src={message.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {message.profiles?.username || "Usuário"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{message.content}</p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(message.id)}
                    disabled={deleting === message.id}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    {deleting === message.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
