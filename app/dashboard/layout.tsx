import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile || profile.status !== "approved") {
    redirect("/auth/pending")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar profile={profile} />
      <div className="lg:pl-72">
        <DashboardHeader profile={profile} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
