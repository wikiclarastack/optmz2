"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Send, MessageSquare, User } from "lucide-react"

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
      await loadMessages()
      setLoading(false)
    }

    init()

    // Subscribe to new messages
    const channel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        async (payload) => {
          const { data } = await supabase
            .from("chat_messages")
            .select("*, profiles:user_id(username, avatar_url)")
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data as Message])
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function loadMessages() {
    const { data } = await supabase
      .from("chat_messages")
      .select("*, profiles:user_id(username, avatar_url)")
      .order("created_at", { ascending: true })
      .limit(100)

    if (data) {
      setMessages(data as Message[])
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase.from("chat_messages").insert({
        content: newMessage.trim(),
        user_id: user.id,
      })
      setNewMessage("")
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6 h-[calc(100vh-180px)] flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Chat Geral</h2>
        <p className="text-muted-foreground">Converse com outros usuários</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b border-border py-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Comunidade FLUXZ</CardTitle>
            <span className="ml-auto text-xs text-muted-foreground">
              {messages.length} mensagens
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma mensagem ainda. Seja o primeiro a enviar!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.user_id === currentUserId
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                    {message.profiles?.avatar_url ? (
                      <img 
                        src={message.profiles.avatar_url} 
                        alt="" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className={`max-w-[70%] ${isOwnMessage ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${isOwnMessage ? "text-primary" : "text-foreground"}`}>
                        {message.profiles?.username || "Usuário"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className={`rounded-lg p-3 ${
                      isOwnMessage 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-foreground"
                    }`}>
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Message input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? <Spinner /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
