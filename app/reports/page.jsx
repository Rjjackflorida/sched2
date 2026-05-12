"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Printer, Mail, PieChart, BarChart3, FileSpreadsheet } from "lucide-react"

export default function ReportsPage() {
  return (
    <AdminLayout title="Reports & Exports">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Data & Exports</h2>
            <p className="text-slate-500 text-sm mt-1">Generate schedules and export analytical data.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Schedule Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule Outputs</CardTitle>
                <CardDescription>Generate master or individual schedules for the current cycle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-100 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-slate-900">Master Campus Schedule</h4>
                    <p className="text-xs text-slate-500">Full university schedule by department.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Print">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Download PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-100 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-slate-900">Faculty Individual Schedules</h4>
                    <p className="text-xs text-slate-500">Batch export for all faculty members.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Email to Faculty">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Download ZIP">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Exports */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analytics Exports</CardTitle>
                <CardDescription>Export CSV/Excel data for external analysis.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-50 text-teal-600 rounded-md">
                      <PieChart className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Room Utilization Rates</h4>
                      <p className="text-xs text-slate-500">Capacity vs assigned metrics.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-teal-700 hover:bg-teal-50">
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Faculty Workload Distribution</h4>
                      <p className="text-xs text-slate-500">Credit hours and overload tracking.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-teal-700 hover:bg-teal-50">
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      </div>
    </AdminLayout>
  )
}
