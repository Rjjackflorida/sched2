"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Download, 
  Printer, 
  Mail, 
  PieChart, 
  BarChart3, 
  FileSpreadsheet, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { 
  getRoomUtilizationData, 
  getFacultyWorkloadData, 
  getMasterScheduleData,
  getFacultyBatchScheduleData 
} from "@/app/actions/reports"
import { exportToCSV } from "@/lib/utils"

export default function ReportsPage() {
  const [loadingType, setLoadingType] = useState(null) // 'utilization' | 'workload' | 'master' | 'faculty-batch'
  const [message, setMessage] = useState(null)

  const handleExportUtilization = async () => {
    setLoadingType('utilization')
    setMessage(null)
    const res = await getRoomUtilizationData()
    if (res.success) {
      exportToCSV(res.data, `Room_Utilization_${new Date().toLocaleDateString()}`)
      setMessage({ type: 'success', text: "Room utilization report exported!" })
    } else {
      setMessage({ type: 'error', text: res.error })
    }
    setLoadingType(null)
  }

  const handleExportWorkload = async () => {
    setLoadingType('workload')
    setMessage(null)
    const res = await getFacultyWorkloadData()
    if (res.success) {
      exportToCSV(res.data, `Faculty_Workload_${new Date().toLocaleDateString()}`)
      setMessage({ type: 'success', text: "Faculty workload report exported!" })
    } else {
      setMessage({ type: 'error', text: res.error })
    }
    setLoadingType(null)
  }

  const handleMasterExport = async () => {
    setLoadingType('master')
    setMessage(null)
    const res = await getMasterScheduleData()
    if (res.success) {
      exportToCSV(res.data, `University_Master_Schedule_${new Date().toLocaleDateString()}`)
      setMessage({ type: 'success', text: "Master campus schedule exported successfully!" })
    } else {
      setMessage({ type: 'error', text: res.error })
    }
    setLoadingType(null)
  }

  const handleFacultyBatchExport = async () => {
    setLoadingType('faculty-batch')
    setMessage(null)
    const res = await getFacultyBatchScheduleData()
    if (res.success) {
      exportToCSV(res.data, `Faculty_Schedules_Batch_${new Date().toLocaleDateString()}`)
      setMessage({ type: 'success', text: "All individual faculty schedules exported!" })
    } else {
      setMessage({ type: 'error', text: res.error })
    }
    setLoadingType(null)
  }

  return (
    <AdminLayout title="Reports & Analytics">
      <div className="flex-1 overflow-auto p-6 lg:p-8 relative">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h2>
              <p className="text-slate-500 mt-1 font-medium">Generate campus schedules and export analytical workload data.</p>
            </div>
          </div>

          {/* Feedback Messages */}
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
              message.type === 'success' ? 'bg-teal-50 text-teal-800 border-teal-100' : 
              message.type === 'error' ? 'bg-red-50 text-red-800 border-red-100' : 
              'bg-blue-50 text-blue-800 border-blue-100'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-teal-600" /> : <AlertCircle className="h-5 w-5" />}
              <p className="text-sm font-semibold">{message.text}</p>
              <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100 transition-opacity"><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Schedule Generation Card */}
            <Card className="border-slate-200 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm rounded-3xl">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl">
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900 uppercase tracking-tight">Schedule Outputs</CardTitle>
                    <CardDescription className="text-slate-500 font-medium">Generate university-wide or individual layouts.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                
                {/* Master Campus Schedule */}
                <div className="flex items-center justify-between p-6 border border-slate-100 bg-white rounded-2xl shadow-sm group hover:border-teal-500 transition-all">
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">Master Campus Schedule</h4>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Full university dataset (Excel)</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleMasterExport}
                      disabled={loadingType !== null}
                      variant="outline" 
                      className="rounded-xl border-slate-200 text-teal-700 hover:bg-teal-50 hover:border-teal-200 font-bold text-[10px] uppercase tracking-widest h-11 px-6 shadow-sm transition-all"
                    >
                      {loadingType === 'master' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                      Export CSV
                    </Button>
                  </div>
                </div>

                {/* Faculty Schedules */}
                <div className="flex items-center justify-between p-6 border border-slate-100 bg-white rounded-2xl shadow-sm group hover:border-teal-500 transition-all">
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">Faculty Individual Schedules</h4>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Batch export by instructor (Excel)</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleFacultyBatchExport}
                      disabled={loadingType !== null}
                      variant="outline" 
                      className="h-11 px-6 rounded-xl border-slate-200 text-teal-700 hover:bg-teal-50 hover:border-teal-200 transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm"
                    >
                      {loadingType === 'faculty-batch' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Exports Card */}
            <Card className="border-slate-200 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm rounded-3xl">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900 uppercase tracking-tight">Data Intelligence</CardTitle>
                    <CardDescription className="text-slate-500 font-medium">Export raw data for deep strategic analysis.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                
                {/* Room Utilization */}
                <div className="flex items-center justify-between p-6 border border-slate-100 bg-white rounded-2xl shadow-sm group hover:border-teal-500 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                      <PieChart className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">Room Utilization</h4>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Efficiency metrics (Excel)</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleExportUtilization}
                    disabled={loadingType !== null}
                    variant="outline" 
                    className="rounded-xl border-slate-200 text-teal-700 hover:bg-teal-50 hover:border-teal-200 font-bold text-[10px] uppercase tracking-widest h-11 px-6 shadow-sm transition-all"
                  >
                    {loadingType === 'utilization' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                    Export CSV
                  </Button>
                </div>

                {/* Faculty Workload */}
                <div className="flex items-center justify-between p-6 border border-slate-100 bg-white rounded-2xl shadow-sm group hover:border-teal-500 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">Faculty Workload</h4>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Unit allocation metrics</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleExportWorkload}
                    disabled={loadingType !== null}
                    variant="outline" 
                    className="rounded-xl border-slate-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 font-bold text-[10px] uppercase tracking-widest h-11 px-6 shadow-sm transition-all"
                  >
                    {loadingType === 'workload' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      </div>

      <style jsx>{`
        @media print {
          .p-6, .p-8 { padding: 0 !important; }
          .shadow-xl, .shadow-2xl { box-shadow: none !important; }
          .bg-slate-50\/50 { background-color: transparent !important; }
          .AdminLayout_Sidebar, .header_buttons, .feedback_message { display: none !important; }
        }
      `}</style>
    </AdminLayout>
  )
}

function X({ className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
}
