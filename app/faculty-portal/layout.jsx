"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  MessageSquare,
  HelpCircle,
  User,
  Mail,
  Shield,
  Key,
  X,
  Loader2,
  Lock,
  Calendar as CalendarIcon,
  Fingerprint,
  Settings
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
import { getCurrentUser, updateProfile, updateAccountSettings } from "@/app/actions/user"

export default function FacultyLayout({ children }) {
  const pathname = usePathname()

  // --- USER PROFILE & SETTINGS STATE ---
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form States
  const [profileData, setProfileData] = useState({ firstName: "", lastName: "" })
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [formError, setFormError] = useState(null)
  const [formSuccess, setFormSuccess] = useState(null)

  useEffect(() => {
    async function fetchUser() {
      const res = await getCurrentUser()
      if (res.success) {
        setUser(res.user)
        setProfileData({ firstName: res.user.firstName, lastName: res.user.lastName })
      }
    }
    fetchUser()
  }, [])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)
    const res = await updateProfile(profileData)
    if (res.success) {
      setUser({ ...user, ...res.user })
      setFormSuccess("Profile updated successfully!")
      setTimeout(() => setFormSuccess(null), 3000)
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setFormError("New passwords do not match.")
      return
    }
    setIsSubmitting(true)
    setFormError(null)
    const res = await updateAccountSettings({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    })
    if (res.success) {
      setFormSuccess("Password updated successfully!")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setTimeout(() => setFormSuccess(null), 3000)
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const navItems = [
    { name: "Dashboard", href: "/faculty-portal", icon: LayoutDashboard },
    { name: "My Availability", href: "/faculty-portal/availability", icon: CalendarRange },
    { name: "My Schedule", href: "/faculty-portal/schedule", icon: CalendarDays },
    // FUTURE FEATURE { name: "Requests / Messages", href: "/faculty-portal/requests", icon: MessageSquare },
  ]

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "FM"

  return (
    <div className="flex h-screen bg-slate-50 w-full overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-[250px] bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{user ? user.fullName : "Loading..."}</p>
              <p className="text-xs text-slate-500">Faculty Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
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

        <div className="p-4 border-t border-slate-200 space-y-4">
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
          <h1 className="text-xl font-bold text-teal-700">Faculty Portal</h1>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none rounded-full ring-offset-2 focus:ring-2 focus:ring-teal-600 transition-shadow">
                <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarFallback className="bg-teal-100 text-teal-700 font-black">{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => { setIsProfileOpen(true); setFormError(null); setFormSuccess(null); }}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => { setIsSettingsOpen(true); setFormError(null); setFormSuccess(null); }}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
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
        <div className="flex-1 overflow-auto bg-slate-50">
          {children}
        </div>
      </main>

      {/* --- PROFILE MODAL --- */}
      {isProfileOpen && user && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight">Identity Profile</h3>
              </div>
              <button onClick={() => setIsProfileOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-6 w-6" /></button>
            </div>

            <form onSubmit={handleProfileUpdate} className="p-8 space-y-6">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 ring-8 ring-teal-500/5 shadow-xl mb-4">
                  <AvatarFallback className="bg-teal-600 text-white font-black text-3xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Badge className="bg-teal-50 text-teal-700 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                  {user.role} Account
                </Badge>
              </div>

              {formError && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-black uppercase tracking-tight animate-in slide-in-from-top-2">{formError}</div>}
              {formSuccess && <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl text-teal-700 text-xs font-black uppercase tracking-tight animate-in slide-in-from-top-2">{formSuccess}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">First Name</label>
                  <input
                    required
                    value={profileData.firstName}
                    onChange={e => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Last Name</label>
                  <input
                    required
                    value={profileData.lastName}
                    onChange={e => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 shadow-inner">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-8 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SETTINGS MODAL --- */}
      {isSettingsOpen && user && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight">Security & Settings</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-6 w-6" /></button>
            </div>

            <div className="p-8 space-y-8">
              {/* Account Metadata */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Metadata</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2"><Lock className="h-3 w-3" /> Account ID</span>
                    <span className="font-mono text-[10px] font-black text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm">{user.id.substring(0, 13)}...</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2"><CalendarIcon className="h-3 w-3" /> Member Since</span>
                    <span className="font-mono text-[10px] font-black text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Password Form */}
              <form onSubmit={handlePasswordUpdate} className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Change Password</h4>

                {formError && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-black uppercase tracking-tight animate-in slide-in-from-top-2">{formError}</div>}
                {formSuccess && <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl text-teal-700 text-xs font-black uppercase tracking-tight animate-in slide-in-from-top-2">{formSuccess}</div>}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordData.newPassword}
                      onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confirm New</label>
                    <input
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-900/10 px-8 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Security Settings"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
