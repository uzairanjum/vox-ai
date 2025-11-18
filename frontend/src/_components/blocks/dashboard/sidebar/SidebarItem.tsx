"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import ExpandableMenuItem from "./ExpandableMenuItem"
import { 
  LayoutDashboard, 
  MessageSquare,
  Building2,
  Settings,
  Bot,
  Mail,
  Phone,
  Users,
  BrainCircuit,
  Crown,
  BookOpen,
  BarChart,
  Globe,
  Settings2,
  ChevronRight
} from "lucide-react"

// Map icon names to their corresponding Lucide React components
export const iconMap = {
  LayoutDashboard,
  MessageSquare,
  Building2,
  Settings,
  Bot,
  Mail,
  Phone,
  Users,
  BrainCircuit,
  Crown,
  BookOpen,
  BarChart,
  Globe,
  Settings2
}

export interface SidebarItem {
  title: string
  href?: string
  icon: keyof typeof iconMap
  protected?: boolean
  adminOnly?: boolean
  subItems?: SidebarItem[]
  badge?: string
  isNew?: boolean
}

interface SidebarItemProps {
  item: SidebarItem
  pathname: string
  onCloseMobileMenu: () => void
}

export default function SidebarItem({ item, pathname, onCloseMobileMenu }: SidebarItemProps) {
  const Icon = iconMap[item.icon]
  const isActive = pathname === item.href

  if (item.subItems) {
    return (
      <ExpandableMenuItem
        item={item}
        pathname={pathname}
        onCloseMobileMenu={onCloseMobileMenu}
      />
    )
  }

  return (
    <Link
      href={item.href || "#"}
      onClick={onCloseMobileMenu}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
      )}
    >
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
      )}
      
      <Icon className={cn(
        "h-4 w-4 transition-colors",
        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
      )} />
      
      <span className="flex-1">{item.title}</span>
      
      {/* Badge */}
      {item.badge && (
        <span className={cn(
          "px-2 py-0.5 text-xs rounded-full",
          isActive 
            ? "bg-primary-foreground/20 text-primary-foreground" 
            : "bg-primary/10 text-primary"
        )}>
          {item.badge}
        </span>
      )}

      {/* New Indicator */}
      {item.isNew && (
        <div className="h-2 w-2 rounded-full bg-green-500" />
      )}

      {/* Hover Arrow */}
      {!isActive && (
        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
      )}
    </Link>
  )
}