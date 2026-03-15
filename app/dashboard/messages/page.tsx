"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Send, Mail, User, Search, ArrowLeft } from "lucide-react"

interface Profile {
  id: string
  username: string
  avatar_url: string | null
}

interface DirectMessage {
  id: string
  content: string
  created_at: string
  sender_id: string
  receiver_id: string
  sender: Profile
  receiver: Profile
}

export default function MessagesPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
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
        await loadUsers(user.id)
      }
      setLoading(false)
    }

    init()
  }, [])

  useEffect(() => {
    if (!selectedUser || !currentUserId) return

    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`dm_${selectedUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        async (payload) => {
          const newMsg = payload.new as any
          if (
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === selectedUser.id) ||
            (newMsg.sender_id === selectedUser.id && newMsg.receiver_id === currentUserId)
          ) {
            const { data } = await supabase
              .from("direct_messages")
              .select("*, sender:sender_id(id, username, avatar_url), receiver:receiver_id(id, username, avatar_url)")
              .eq("id", newMsg.id)
              .single()

            if (data) {
              setMessages((prev) => [...prev, data as DirectMessage])
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedUser, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function loadUsers(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .neq("id", userId)
      .eq("status", "approved")
      .order("username")

    if (data) {
      setUsers(data)
    }
  }

  async function loadMessages() {
    if (!selectedUser || !currentUserId) return

    const { data } = await supabase
      .from("direct_messages")
      .select("*, sender:sender_id(id, username, avatar_url), receiver:receiver_id(id, username, avatar_url)")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true })
      .limit(100)

    if (data) {
      setMessages(data as DirectMessage[])
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending || !selectedUser || !currentUserId) return

    setSending(true)
    
    await supabase.from("direct_messages").insert({
      content: newMessage.trim(),
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
    })
    
    setNewMessage("")
    setSending(false)
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
    <div className="space-y-6 h-[calc(100vh-180px)] flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Mensagens Diretas</h2>
        <p className="text-muted-foreground">Converse em privado com outros usuários</p>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Users list */}
        <Card className={`w-full md:w-80 flex-shrink-0 flex flex-col overflow-hidden ${selectedUser ? "hidden md:flex" : "flex"}`}>
          <CardHeader className="border-b border-border py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar usuário..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Nenhum usuário encontrado.
              </p>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                      selectedUser?.id === user.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <span className="text-sm font-medium truncate">{user.username}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className={`flex-1 flex flex-col overflow-hidden ${!selectedUser ? "hidden md:flex" : "flex"}`}>
          {selectedUser ? (
            <>
              <CardHeader className="border-b border-border py-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedUser(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <CardTitle className="text-base">{selectedUser.username}</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Mail className="h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhuma mensagem. Comece a conversa!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender_id === currentUserId
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
                          {message.sender?.avatar_url ? (
                            <img src={message.sender.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className={`max-w-[70%] ${isOwnMessage ? "text-right" : ""}`}>
                          <div className="flex items-center gap-2 mb-1">
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
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Mail className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Selecione um usuário</p>
              <p className="text-sm">Escolha alguém para iniciar uma conversa</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
