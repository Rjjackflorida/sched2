import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Layers,
  FileText,
  HelpCircle,
  Bell,
  Settings,
  AlertCircle,
  AlertTriangle,
  UserX,
  CalendarIcon,
  TrendingUp,
} from "lucide-react"
import { AdminLayout } from "@/components/admin-layout"

export default function DashboardPage() {
  return (
    <AdminLayout title="System Overview">
      {/* Scrollable Main Area */}
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold text-slate-900">System Overview</h2>
              <p className="text-slate-500 mt-1">Fall 2024 Scheduling Cycle Health</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1 */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-slate-500">Faculty Readiness</h3>
                    <span className="text-2xl font-bold text-slate-900">80%</span>
                  </div>
                  <Progress value={80} className="h-2 mb-2" />
                  <p className="text-sm text-slate-500">340 / 425 Availability Submitted</p>
                </CardContent>
              </Card>

              {/* Card 2 */}
              <Card className="bg-red-50 border-red-100 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 text-red-900">
                  <AlertTriangle className="h-32 w-32" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium text-red-800">Action Required</h3>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-red-600">14</span>
                      <span className="text-red-700 font-medium mb-1">Unassigned Classes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3 */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium text-slate-500">Total Scheduled</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold text-slate-900">1,248</span>
                      <div className="flex items-center text-teal-600 bg-teal-50 px-2 py-1 rounded text-sm font-medium">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        +12%
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">from last term</p>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Active System Conflicts */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Active System Conflicts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Item 1 */}
                  <div className="flex items-start justify-between p-4 border border-slate-100 rounded-lg bg-white shadow-sm">
                    <div className="flex gap-4">
                      <div className="mt-1 flex-shrink-0 text-red-500 bg-red-50 p-2 rounded-full">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">Double-booked Room: SCI-101</h4>
                          <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">Critical</Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">CHEM-201 and BIO-305 are both scheduled for MWF 10:00 AM.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-slate-700 shrink-0">Resolve</Button>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start justify-between p-4 border border-slate-100 rounded-lg bg-white shadow-sm">
                    <div className="flex gap-4">
                      <div className="mt-1 flex-shrink-0 text-orange-500 bg-orange-50 p-2 rounded-full">
                        <UserX className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">Instructor Overload: Dr. A. Smith</h4>
                          <Badge className="bg-orange-500 hover:bg-orange-600">Warning</Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">Assigned 18 credit hours across 6 sections.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-slate-700 shrink-0">Review</Button>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start justify-between p-4 border border-slate-100 rounded-lg bg-white shadow-sm">
                    <div className="flex gap-4">
                      <div className="mt-1 flex-shrink-0 text-slate-400 bg-slate-100 p-2 rounded-full">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">Missing Capacity Constraints</h4>
                          <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-300">Notice</Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">3 sections in the Humanities department have max enrollment set to 0.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-slate-700 shrink-0">Edit</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Automated Optimizer */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Automated Optimizer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        The scheduling algorithm is currently paused due to critical room conflicts.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Button className="w-full bg-[#115e59] hover:bg-teal-900 text-white">
                        Resume Optimizer
                      </Button>
                      <Button variant="outline" className="w-full text-slate-700 border-slate-300 hover:bg-slate-50">
                        View Auto-Resolutions
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Next Deadline</h3>
                    <div className="flex items-center gap-4">
                      <div className="bg-teal-50 p-3 rounded-lg text-teal-600">
                        <CalendarIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Oct 15</p>
                        <p className="text-sm text-slate-500">Finalize Room Assignments</p>
                        <p className="text-xs font-medium text-red-600 mt-1">3 days remaining</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </div>
    </AdminLayout>
  )
}
