"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ModeToggle } from "@/_components/atoms/ToggleTheme"
import { ThemeLogo } from "@/_components/atoms/ThemeLogo"
import { logout } from "@/app/auth/actions/auth"
import { LoadingIcon } from "@/_components/atoms/LoadingIcon"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Bot, 
  Plus, 
  Search, 
  MessageSquare, 
  Database, 
  Settings, 
  Globe,
  ChevronDown,
  Sparkles,
  BookOpen,
  Users,
  BarChart3,
  Phone
} from "lucide-react"

const routes = {
  home: "/",
  login: "/auth/login",
  signup: "/auth/signup",
  dashboard: "/dashboard",
} as const

interface GlobalAgent {
  id: string;
  name: string;
}

export default function NavbarClient() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [globalAgent, setGlobalAgent] = useState<GlobalAgent | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  // Check if user is logged in and load global agent info
  useEffect(() => {
    const checkAuthAndLoadAgent = async () => {
      try {
        // Simple auth check based on pathname
        const isAuth = pathname?.startsWith('/dashboard') || false
        setIsLoggedIn(isAuth)

        if (isAuth) {
          // Load global agent info
          const response = await fetch('/api/ai/settings/global')
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data?.default_agent_id) {
              // Get agent details
              const agentsResponse = await fetch('/api/ai/agents')
              if (agentsResponse.ok) {
                const agentsData = await agentsResponse.json()
                if (agentsData.success && agentsData.data) {
                  const agent = agentsData.data.find((a: any) => a.id === data.data.default_agent_id)
                  if (agent) {
                    setGlobalAgent({ id: agent.id, name: agent.name })
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.log('Could not load navbar data:', error)
      }
    }

    checkAuthAndLoadAgent()
  }, [pathname])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      setIsLoggedIn(false)
      setGlobalAgent(null)
      await router.refresh()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
      setShowSearch(false)
    }
  }

  const quickCreateItems = [
    {
      label: "Knowledge Base",
      description: "Upload documents and training data",
      icon: <BookOpen className="h-4 w-4" />,
      href: "/dashboard/app/ai/knowledgebase"
    },
    {
      label: "Voice AI Agent",
      description: "Create AI agent for voice calls",
      icon: <Phone className="h-4 w-4" />,
      href: "/dashboard/app/ai/voice-ai"
    }
  ]

  const smartNavItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
      active: pathname === "/dashboard"
    },
    {
      label: "AI Agents",
      href: "/dashboard/app/ai/agents",
      icon: <Bot className="h-4 w-4" />,
      active: pathname?.startsWith("/dashboard/app/ai/agents")
    },
    {
      label: "Conversations",
      href: "/dashboard/app/leadconnector/conversations",
      icon: <MessageSquare className="h-4 w-4" />,
      active: pathname?.startsWith("/dashboard/app/leadconnector")
    },
    {
      label: "AI Settings",
      href: "/dashboard/app/ai/settings",
      icon: <Settings className="h-4 w-4" />,
      active: pathname?.startsWith("/dashboard/app/ai/settings")
    }
  ]

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href={isLoggedIn ? routes.dashboard : routes.home}>
              <ThemeLogo />
            </Link>

            {/* ✅ NEW: Smart Navigation Menu (for logged in users) */}
            {isLoggedIn && (
              <div className="hidden md:flex items-center gap-1">
                {smartNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button 
                      variant={item.active ? "secondary" : "ghost"} 
                      size="sm"
                      className="gap-2"
                    >
                      {item.icon}
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Center: Global Agent Status (for logged in users) */}
          {isLoggedIn && globalAgent && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
              <Globe className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {globalAgent.name}
              </span>
              <Badge variant="default" className="bg-green-600 text-white text-xs">
                Global
              </Badge>
            </div>
          )}

          {/* Right Side: Actions and Auth */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* ✅ NEW: Smart Search */}
                <div className="hidden md:block">
                  {showSearch ? (
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                      <Input
                        placeholder="Search agents, conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64"
                        autoFocus
                      />
                      <Button type="submit" size="sm" variant="ghost">
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setShowSearch(false)
                          setSearchQuery("")
                        }}
                      >
                        ✕
                      </Button>
                    </form>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowSearch(true)}
                      className="gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Search
                    </Button>
                  )}
                </div>

                {/* ✅ NEW: Quick Create Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Create AI Agents</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Conversation AI Dashboard */}
                    <DropdownMenuItem 
                      onClick={() => router.push('/dashboard/app/ai/conversation-ai')}
                      className="gap-3 p-3"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">Conversation AI Dashboard</div>
                        </div>
                        <div className="text-xs text-muted-foreground">Manage all conversation AI agents and settings</div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Advanced Conversation AI</DropdownMenuLabel>
                    
                    {/* Create Conversation AI Agent - Recommended */}
                    <DropdownMenuItem 
                      onClick={() => router.push('/dashboard/app/ai/agents/new?type=1')}
                      className="gap-3 p-2"
                    >
                      <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                        <Bot className="h-3 w-3" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm">Create Conversation AI Agent</div>
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Recommended</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">Smart AI for customer conversations</div>
                      </div>
                    </DropdownMenuItem>
                    
                    {/* Advanced Agents */}
                    <DropdownMenuItem 
                      onClick={() => router.push('/dashboard/app/ai/agents/new?type=2')}
                      className="gap-3 p-2"
                    >
                      <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                        <MessageSquare className="h-3 w-3" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Query Agent</div>
                        <div className="text-xs text-muted-foreground">Specialized for answering questions</div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => router.push('/dashboard/app/ai/agents/new?type=3')}
                      className="gap-3 p-2"
                    >
                      <div className="w-6 h-6 bg-secondary/10 rounded flex items-center justify-center">
                        <Sparkles className="h-3 w-3" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Suggestions Agent</div>
                        <div className="text-xs text-muted-foreground">Provides intelligent response suggestions</div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => router.push('/dashboard/app/ai/agents/new?type=4')}
                      className="gap-3 p-2"
                    >
                      <div className="w-6 h-6 bg-accent/10 rounded flex items-center justify-center">
                        <Settings className="h-3 w-3" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Response Agent</div>
                        <div className="text-xs text-muted-foreground">Generates automatic responses</div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Voice AI & Resources</DropdownMenuLabel>
                    
                    {quickCreateItems.filter(item => item.label !== "AI Agent").map((item) => (
                      <DropdownMenuItem 
                        key={item.href}
                        onClick={() => router.push(item.href)}
                        className="gap-3 p-2"
                      >
                        <div className="w-6 h-6 bg-muted/50 rounded flex items-center justify-center">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  size="sm"
                >
                  {isLoggingOut ? (
                    <div className="flex items-center gap-2">
                      <LoadingIcon className="h-3 w-3" />
                      Signing Out...
                    </div>
                  ) : (
                    "Sign Out"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Link href={routes.login}>
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href={routes.signup}>
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
