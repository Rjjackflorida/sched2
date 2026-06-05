"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Layers,
  FileText,
  HelpCircle,
  Bell,
  Settings,
  UserCog,
  Building2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/app/actions/auth"

/**
 * AdminLayout provides the persistent navigation sidebar and top header 
 * for all administrative pages.
 */
export function AdminLayout({ children, title }) {
  const pathname = usePathname()

  /**
   * Defines the primary navigation links for the Admin Portal.
   */
  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Resource Management", href: "/resource-management", icon: Layers },
    { name: "User Management", href: "/user-management", icon: UserCog },
    { name: "Schedule Builder", href: "/schedule-builder", icon: Calendar },
    { name: "Reports & Exports", href: "/reports", icon: FileText },
    { name: "Global Settings", href: "/settings", icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-slate-50 w-full overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-[250px] bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0">
        {/* Sidebar Header: Brand/User Info */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Academic Admin</p>
              <p className="text-xs text-slate-500">Scheduling Portal</p>
            </div>
          </div>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer: Quick Actions/Help */}
        <div className="p-4 border-t border-slate-200 space-y-4">
          <Button className="w-full bg-[#115e59] hover:bg-teal-900 text-white">
            Create New Schedule
          </Button>
          <a href="#" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 justify-center">
            <HelpCircle className="h-4 w-4" />
            Help & Resources
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-xl font-bold text-teal-700">{title || "Scheduling Portal"}</h1>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 relative">
              <Bell className="h-5 w-5" />
            </button>
            <button className="text-slate-400 hover:text-slate-600">
              <Settings className="h-5 w-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none rounded-full ring-offset-2 focus:ring-2 focus:ring-teal-600 transition-shadow">
                <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src="/avatar.jpg" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={logout}>
                  <button type="submit" className="w-full text-left">
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                      Log Out
                    </DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic Page Content */}
        {children}
      </main>
    </div>
  )
}
