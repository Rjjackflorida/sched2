"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdminLayout } from "@/components/admin-layout"
import {
  Edit,
  ToggleLeft,
  ToggleRight,
  Search,
  Plus,
} from "lucide-react"

export default function UserManagementPage() {
  const mockedUsers = [
    { id: "USR-001", fullName: "Jane Doe", role: "admin", email: "jane.doe@university.edu", isActive: true },
    { id: "USR-002", fullName: "John Smith", role: "faculty", email: "john.smith@university.edu", isActive: true },
    { id: "USR-003", fullName: "Emily Clark", role: "faculty", email: "emily.clark@university.edu", isActive: false },
  ]

  return (
    <AdminLayout title="User Management">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">User Management</h2>
            <p className="text-slate-500 mt-1">Manage system users, roles, and access.</p>
          </div>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg font-semibold">System Users</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search users..."
                    className="flex h-10 w-full sm:w-64 rounded-md border border-slate-200 bg-white px-3 py-2 pl-9 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <Button className="bg-[#115e59] hover:bg-teal-900 text-white gap-2 h-10 shrink-0">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 font-medium text-slate-500">ID</th>
                      <th className="py-3 px-4 font-medium text-slate-500">Full Name</th>
                      <th className="py-3 px-4 font-medium text-slate-500">Role</th>
                      <th className="py-3 px-4 font-medium text-slate-500">Email</th>
                      <th className="py-3 px-4 font-medium text-slate-500">Status</th>
                      <th className="py-3 px-4 font-medium text-slate-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-600 font-medium">{user.id}</td>
                        <td className="py-3 px-4 text-slate-900 font-semibold">{user.fullName}</td>
                        <td className="py-3 px-4">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}>
                            {user.role === 'admin' ? 'Admin' : 'Faculty'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={user.isActive ? "border-green-200 text-green-700 bg-green-50" : "border-slate-200 text-slate-500 bg-slate-50"}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-teal-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className={`h-8 w-8 ${user.isActive ? 'text-green-600 hover:text-green-700' : 'text-slate-400 hover:text-slate-500'}`}>
                              {user.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
