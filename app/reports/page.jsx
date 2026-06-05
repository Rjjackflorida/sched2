"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Printer, Mail, PieChart, BarChart3, FileSpreadsheet } from "lucide-react"

export default function ReportsPage() {
  return (
    <AdminLayout title="Reports & Exports">
      <div className="flex-1 overflow-auto p-6 lg:p-8 relative">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h2>
            <p className="text-slate-500 mt-1">Generate master schedules and export system-wide analytical data.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Schedule Generation */}
            <Card className="border-slate-200 shadow-2xl overflow-hidden bg-white/50 backdrop-blur-sm rounded-[2rem]">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Schedule Outputs</CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-1">Generate master or individual schedules for the current academic cycle.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between p-6 border border-slate-100 bg-white rounded-2xl shadow-sm group hover:border-teal-500 transition-all">
                  <div>
                    <h4 className="font-black text-slate-900 leading-tight">Master Campus Schedule</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Full university schedule by college</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-200 text-slate-500 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200 transition-all" title="Print">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-200 text-slate-500 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200 transition-all" title="Download PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 border border-slate-100 bg-white rounded-2xl shadow-sm group hover:border-teal-500 transition-all">
                  <div>
                    <h4 className="font-black text-slate-900 leading-tight">Faculty Individual Schedules</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Batch export for all faculty members</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-200 text-slate-500 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200 transition-all" title="Email to Faculty">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-200 text-slate-500 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200 transition-all" title="Download ZIP">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Exports */}
            <Card className="border-slate-200 shadow-2xl overflow-hidden bg-white/50 backdrop-blur-sm rounded-[2rem]">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Data Intelligence</CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-1">Export structured datasets for deep architectural analysis.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between p-6 border border-slate-100 bg-white rounded-2xl shadow-sm group hover:border-teal-500 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-xl ring-4 ring-teal-500/5">
                      <PieChart className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 leading-tight">Room Utilization Rates</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Capacity vs assigned metrics</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl border-slate-200 text-teal-700 hover:bg-teal-50 hover:border-teal-200 font-black text-[10px] uppercase tracking-widest h-11 px-6 shadow-sm">
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                </div>

                <div className="flex items-center justify-between p-6 border border-slate-100 bg-white rounded-2xl shadow-sm group hover:border-teal-500 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl ring-4 ring-indigo-500/5">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 leading-tight">Faculty Workload</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Credit hours and overload tracking</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl border-slate-200 text-teal-700 hover:bg-teal-50 hover:border-teal-200 font-black text-[10px] uppercase tracking-widest h-11 px-6 shadow-sm">
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
