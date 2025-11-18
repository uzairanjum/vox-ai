"use client"

import Link from "next/link"
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { iconMap } from "./SidebarItem"

interface ExpandableMenuItemProps {
  item: SidebarItem
  pathname: string
  onCloseMobileMenu: () => void
  level?: number
}

interface SidebarItem {
  title: string
  href?: string
  icon: keyof typeof iconMap
  protected?: boolean
  adminOnly?: boolean
  subItems?: SidebarItem[]
  badge?: string
  isNew?: boolean
}

export default function ExpandableMenuItem({ 
  item, 
  pathname, 
  onCloseMobileMenu,
  level = 0
}: ExpandableMenuItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const Icon = iconMap[item.icon]

  // Auto-expand if the current path is within this menu's tree
  useEffect(() => {
    const shouldExpand = item.subItems?.some(subItem => {
      if (pathname === subItem.href) return true;
      return subItem.subItems?.some(deepSubItem => pathname === deepSubItem.href);
    });
    if (shouldExpand) {
      setIsExpanded(true);
    }
  }, [pathname, item.subItems]);

  const hasActiveChild = item.subItems?.some(subItem => {
    if (pathname === subItem.href) return true;
    return subItem.subItems?.some(deepSubItem => pathname === deepSubItem.href);
  });

  const renderMenuItem = (menuItem: SidebarItem, isSubmenu: boolean = false) => {
    if (menuItem.subItems) {
      return (
        <ExpandableMenuItem
          key={menuItem.title}
          item={menuItem}
          pathname={pathname}
          onCloseMobileMenu={onCloseMobileMenu}
          level={level + 1}
        />
      );
    }

    const isActive = pathname === menuItem.href;
    const MenuIcon = iconMap[menuItem.icon];

    return (
      <Link
        key={menuItem.href}
        href={menuItem.href || "#"}
        onClick={onCloseMobileMenu}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
          isSubmenu && "ml-6",
          level === 2 && "ml-12"
        )}
      >
        {/* Active Indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-foreground rounded-r-full" />
        )}
        
        {MenuIcon && <MenuIcon className={cn(
          "h-4 w-4 transition-colors",
          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
        )} />}
        
        <span className="flex-1">{menuItem.title}</span>
        
        {/* Badge */}
        {menuItem.badge && (
          <span className={cn(
            "px-2 py-0.5 text-xs rounded-full",
            isActive 
              ? "bg-primary-foreground/20 text-primary-foreground" 
              : "bg-primary/10 text-primary"
          )}>
            {menuItem.badge}
          </span>
        )}

        {/* New Indicator */}
        {menuItem.isNew && (
          <div className="h-2 w-2 rounded-full bg-green-500" />
        )}

        {/* Hover Arrow */}
        {!isActive && (
          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
        )}
      </Link>
    );
  };

  return (
    <div className="space-y-1">
      {/* Parent Menu Item */}
      <button
        className={cn(
          "group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          hasActiveChild
            ? "bg-primary/5 text-foreground"
            : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
          level === 1 && "ml-6",
          level === 2 && "ml-12"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="flex items-center gap-3">
          <Icon className={cn(
            "h-4 w-4 transition-colors",
            hasActiveChild ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          )} />
          <span>{item.title}</span>
          
          {/* Badge */}
          {item.badge && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
              {item.badge}
            </span>
          )}
        </span>
        
        <div className="flex items-center gap-1">
          {/* New Indicator */}
          {item.isNew && (
            <div className="h-2 w-2 rounded-full bg-green-500" />
          )}
          
          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 transition-transform" />
          ) : (
            <ChevronDown className="h-4 w-4 transition-transform" />
          )}
        </div>
      </button>

      {/* Submenu Items */}
      {isExpanded && (
        <div className={cn(
          "space-y-1 overflow-hidden transition-all duration-200",
          level === 0 && "ml-3",
          level === 1 && "ml-9"
        )}>
          {item.subItems?.map((subItem) => renderMenuItem(subItem, true))}
        </div>
      )}
    </div>
  )
}