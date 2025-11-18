"use client";

import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import SidebarItem, { SidebarItem as SidebarItemType } from "./SidebarItem";
import { logout } from "@/app/auth/actions/auth";
import { useConversations as conversationContext } from "../../../../../context/ConversationProvider";

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { conversationsUnreadCount } = conversationContext();

  const toggleSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const sidebarItems: SidebarItemType[] = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: "LayoutDashboard",
      protected: true,
    },
    {
      title: "Communication",
      icon: "Building2",
      protected: true,
      subItems: [
        {
          title: "LeadConnector",
          href: "/dashboard/app/leadconnector",
          icon: "MessageSquare",
          subItems: [
            {
              title: "Dashboard",
              href: "/dashboard/app/leadconnector",
              icon: "Users",
            },
            {
              title: "Conversations",
              href: "/dashboard/app/leadconnector/conversations",
              icon: "MessageSquare",
              badge: `${
                conversationsUnreadCount > 9
                  ? "9+"
                  : conversationsUnreadCount > 0
                  ? conversationsUnreadCount
                  : 0
              }`,
            },
          ],
        },
      ],
    },
    {
      title: "AI & Automation",
      icon: "BrainCircuit",
      protected: true,
      subItems: [
        {
          title: "AI Agent Wizard",
          href: "/dashboard/app/ai/agents/new",
          icon: "Bot",
          protected: true,
          badge: "Create",
        },
        {
          title: "AI Agents",
          href: "/dashboard/app/ai/agents",
          icon: "Settings",
          protected: true,
        },
        // {
        //   title: "Autopilot Dashboard",
        //   href: "/dashboard/app/ai/autopilot",
        //   icon: "Bot",
        //   protected: true,
        //   badge: "Auto"
        // },
        {
          title: "Knowledge Bases",
          href: "/dashboard/app/ai/knowledgebase",
          icon: "BookOpen",
          protected: true,
        },
      ],
    },
    {
      title: "Settings",
      href: "/dashboard/profile",
      icon: "Settings",
      protected: true,
    },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden hover:bg-primary/10 bg-background/90 backdrop-blur-sm"
        onClick={toggleSidebar}
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="border-b bg-muted/40 px-4 py-3">
            <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Manage your AI workspace
            </p>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <SidebarItem
                  key={item.title}
                  item={item}
                  pathname={pathname}
                  onCloseMobileMenu={() => setIsMobileOpen(false)}
                />
              ))}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t bg-muted/40 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">AI</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  AI Workspace
                </p>
                <p className="text-xs text-muted-foreground">Version 1.0</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Pro
              </Badge>
            </div>

            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
