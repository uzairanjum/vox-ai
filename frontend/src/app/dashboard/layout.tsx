import { redirect } from "next/navigation"
import { DashboardLayoutClient } from "./layout.client"
import { getCurrentUser } from "@/utils/auth/user"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/login")
  }


  return (
    <DashboardLayoutClient user={user}>
      {children}
    </DashboardLayoutClient>
  )
}