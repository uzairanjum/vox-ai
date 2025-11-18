"use client"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ModeToggle } from "@/_components/atoms/ToggleTheme"
import { logout } from "../auth/actions/auth"
import { ThemeLogo } from "@/_components/atoms/ThemeLogo"
import { LoadingIcon } from "@/_components/atoms/LoadingIcon"
import Sidebar from "@/_components/blocks/dashboard/sidebar/Sidebar"
import { Breadcrumbs } from "@/_components/blocks/nav/Breadcrumbs"
import { useKeyboardShortcuts, KeyboardShortcutsModal } from "@/_components/blocks/nav/KeyboardShortcuts"

interface DashboardLayoutClientProps {
  children: React.ReactNode
  user: any
}

export function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts()

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      await router.refresh()
      setIsLoggingOut(false)
    } catch (error) {
      console.error("Logout failed:", error)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Fixed positioning with proper z-index */}
      <Sidebar />

      {/* Main content area with proper margins to avoid overlap */}
      <div className="lg:ml-72"> {/* Add left margin to account for sidebar width */}
        {/* Dashboard Navbar - Fixed but only covers the main content area */}
        <header className="border-b border-border fixed top-0 right-0 left-0 lg:left-72 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Top Header Bar */}
          <div className="h-16 px-4 flex items-center justify-between">
            <Link href="/" className="lg:hidden">
              <ThemeLogo />
            </Link>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={isLoggingOut}
                size="sm"
              >
                {isLoggingOut ? (
                  <div className="flex items-center">
                    <LoadingIcon className="mr-2" />
                    Signing Out...
                  </div>
                ) : (
                  "Sign Out"
                )}
              </Button>

              <ModeToggle />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-16"> {/* Add top padding to account for fixed header */}
          {/* Breadcrumbs */}
          <div className="border-b border-border bg-muted/30">
            <div className="px-4 py-3">
              <Breadcrumbs />
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal 
        open={showShortcuts} 
        onOpenChange={setShowShortcuts} 
      />
    </div>
  )
}
