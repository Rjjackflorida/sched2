import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  CalendarIcon,
  TrendingUp,
  Clock,
  BookOpen,
  CheckCircle2
} from "lucide-react"
import { AdminLayout } from "@/components/admin-layout"
import { getDashboardStats } from "@/app/actions/dashboard"
import Link from "next/link"

export default async function DashboardPage() {
  const data = await getDashboardStats()
  const stats = data.success ? data.stats : { unscheduledCount: 0, totalFaculty: 0, readyFacultyCount: 0, totalScheduled: 0 }
  const activeTerm = data.success ? data.activeTerm : "Unknown Term"
  const unscheduledList = data.success ? data.unscheduledList : []
  const recentSchedules = data.success ? data.recentSchedules : []

  const readinessPercentage = stats.totalFaculty > 0 ? Math.round((stats.readyFacultyCount / stats.totalFaculty) * 100) : 0

  return (
    <AdminLayout title="System Overview">
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold text-slate-900">System Overview</h2>
              <p className="text-slate-500 mt-1">{activeTerm} Scheduling Cycle Health</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1 */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-slate-500">Faculty Readiness</h3>
                    <span className="text-2xl font-bold text-slate-900">{readinessPercentage}%</span>
                  </div>
                  <Progress value={readinessPercentage} className="h-2 mb-2" />
                  <p className="text-sm text-slate-500">{stats.readyFacultyCount} / {stats.totalFaculty} Availability Submitted</p>
                </CardContent>
              </Card>

              {/* Card 2 */}
              <Card className={`${stats.unscheduledCount > 0 ? 'bg-red-50 border-red-100' : 'bg-teal-50 border-teal-100'} relative overflow-hidden`}>
                <div className={`absolute -right-4 -bottom-4 opacity-5 ${stats.unscheduledCount > 0 ? 'text-red-900' : 'text-teal-900'}`}>
                  {stats.unscheduledCount > 0 ? <AlertTriangle className="h-32 w-32" /> : <CheckCircle2 className="h-32 w-32" />}
                </div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col gap-1">
                    <h3 className={`text-sm font-medium ${stats.unscheduledCount > 0 ? 'text-red-800' : 'text-teal-800'}`}>
                      {stats.unscheduledCount > 0 ? 'Action Required' : 'All Clear'}
                    </h3>
                    <div className="flex items-end gap-2">
                      <span className={`text-4xl font-bold ${stats.unscheduledCount > 0 ? 'text-red-600' : 'text-teal-600'}`}>{stats.unscheduledCount}</span>
                      <span className={`${stats.unscheduledCount > 0 ? 'text-red-700' : 'text-teal-700'} font-medium mb-1`}>Unassigned Classes</span>
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
                      <span className="text-4xl font-bold text-slate-900">{stats.totalScheduled}</span>
                      <div className="flex items-center text-teal-600 bg-teal-50 px-2 py-1 rounded text-sm font-medium">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Active Term
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Blocks placed</p>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Unassigned Sections List */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Pending Course Sections</CardTitle>
                  {stats.unscheduledCount > 5 && (
                    <Badge variant="outline" className="text-slate-500">+{stats.unscheduledCount - 5} more</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {unscheduledList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                      <CheckCircle2 className="h-8 w-8 text-teal-500 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">All course sections have been scheduled.</p>
                    </div>
                  ) : (
                    unscheduledList.map(section => (
                      <div key={section.id} className="flex items-start justify-between p-4 border border-slate-100 rounded-lg bg-white shadow-sm hover:border-teal-100 transition-colors">
                        <div className="flex gap-4">
                          <div className="mt-1 flex-shrink-0 text-orange-500 bg-orange-50 p-2 rounded-full">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-900">{section.courseCode}: {section.courseTitle}</h4>
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">Needs Schedule</Badge>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">{section.programCode} {section.yearLevel}-{section.sectionName}</p>
                          </div>
                        </div>
                        <Link href={`/schedule-builder`}>
                          <Button variant="outline" size="sm" className="text-teal-700 border-teal-200 hover:bg-teal-50 shrink-0">Schedule</Button>
                        </Link>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-slate-400" /> Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentSchedules.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
                    ) : (
                      recentSchedules.map(schedule => (
                        <div key={schedule.id} className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                          <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                            <CalendarIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{schedule.courseCode} scheduled</p>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{schedule.roomName} • {schedule.dayOfWeek}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <Link href="/schedule-builder" className="block w-full mt-6">
                      <Button className="w-full bg-[#115e59] hover:bg-teal-900 text-white">
                        Open Schedule Builder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </div>
    </AdminLayout>
  )
}
