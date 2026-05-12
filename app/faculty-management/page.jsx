"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, Edit2, Clock } from "lucide-react"

const facultyData = [
  {
    id: "F1",
    name: "Dr. Alice Smith",
    department: "Computer Science",
    role: "Professor",
    assignedHours: 12,
    maxHours: 15,
    availabilityStatus: "Submitted",
  },
  {
    id: "F2",
    name: "Prof. John Doe",
    department: "Mathematics",
    role: "Associate Prof",
    assignedHours: 15,
    maxHours: 15,
    availabilityStatus: "Submitted",
  },
  {
    id: "F3",
    name: "Dr. Sarah Johnson",
    department: "Physics",
    role: "Assistant Prof",
    assignedHours: 4,
    maxHours: 12,
    availabilityStatus: "Missing",
  },
  {
    id: "F4",
    name: "Prof. Michael Brown",
    department: "Humanities",
    role: "Adjunct",
    assignedHours: 18,
    maxHours: 15,
    availabilityStatus: "Submitted",
  }
]

export default function FacultyManagementPage() {
  return (
    <AdminLayout title="Faculty Management">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Faculty Roster</h2>
              <p className="text-slate-500 text-sm">Manage professor profiles, workloads, and overrides.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search faculty..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <Button className="bg-[#115e59] hover:bg-teal-900 shrink-0">
                <Plus className="h-4 w-4 mr-2" /> Add Faculty
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Faculty Member</th>
                      <th className="px-6 py-4 font-medium">Department</th>
                      <th className="px-6 py-4 font-medium">Workload</th>
                      <th className="px-6 py-4 font-medium">Availability</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {facultyData.map((faculty) => {
                      const loadPercentage = (faculty.assignedHours / faculty.maxHours) * 100;
                      const isOverload = faculty.assignedHours > faculty.maxHours;

                      return (
                        <tr key={faculty.id} className="hover:bg-slate-50 transition-colors bg-white">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-teal-100 text-teal-700">
                                  {faculty.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-slate-900">{faculty.name}</p>
                                <p className="text-xs text-slate-500">{faculty.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700">{faculty.department}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className={isOverload ? "text-red-600 font-bold" : "text-slate-600"}>
                                  {faculty.assignedHours} / {faculty.maxHours} hrs
                                </span>
                              </div>
                              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${isOverload ? 'bg-red-500' : 'bg-teal-500'}`}
                                  style={{ width: `${Math.min(loadPercentage, 100)}%` }}
                                />
                              </div>
                              {isOverload && <span className="text-[10px] text-red-500 font-medium">Overload</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={faculty.availabilityStatus === "Submitted" ? "outline" : "secondary"} 
                                   className={faculty.availabilityStatus === "Submitted" ? "border-teal-200 bg-teal-50 text-teal-700" : "bg-orange-50 text-orange-700 hover:bg-orange-100"}>
                              {faculty.availabilityStatus}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-teal-700" title="Override Availability">
                                <Clock className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-teal-700" title="Edit Profile">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
