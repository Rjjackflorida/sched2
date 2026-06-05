"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Save, CheckCircle2 } from "lucide-react"
import { getSystemSettings, updateSystemSettings } from "@/app/actions/settings"

export default function SettingsPage() {
  const [semester, setSemester] = useState("1st")
  const [year, setYear] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    async function loadSettings() {
      const res = await getSystemSettings()
      if (res.success && res.settings) {
        setSemester(res.settings.activeSemester)
        setYear(res.settings.activeAcademicYear)
      }
      setIsLoading(false)
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    const res = await updateSystemSettings({
      activeSemester: semester,
      activeAcademicYear: year
    })
    
    if (res.success) {
      setMessage({ type: 'success', text: "Global settings updated successfully!" })
    } else {
      setMessage({ type: 'error', text: res.error || "Failed to update settings." })
    }
    setIsSaving(false)
  }

  return (
    <AdminLayout title="Global Settings">
      <div className="flex-1 overflow-auto p-6 lg:p-8 relative">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Configuration</h2>
            <p className="text-slate-500 mt-1">Manage global variables and system-wide architectural defaults.</p>
          </div>

          <Card className="border-slate-200 shadow-2xl overflow-hidden bg-white/50 backdrop-blur-sm rounded-[2rem]">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
              <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Academic Period Source of Truth</CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                This controls the active semester and year across the entire platform, affecting all dashboards and workload calculations.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              
              <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl flex items-start gap-4 shadow-sm shadow-orange-900/5">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                </div>
                <div className="text-sm">
                  <p className="font-black text-orange-900 uppercase tracking-tight mb-1">Critical Transition Warning</p>
                  <p className="text-orange-800/80 font-medium leading-relaxed">
                    Changing this will update the workload calculations and dashboards for all faculty members immediately. 
                    Ensure you are ready to transition to a new term before saving.
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching System State...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                      Academic Year
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm"
                    >
                      <option value={2024}>A.Y. 2024-2025</option>
                      <option value={2025}>A.Y. 2025-2026</option>
                      <option value={2026}>A.Y. 2026-2027</option>
                      <option value={2027}>A.Y. 2027-2028</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                      Active Semester
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm"
                    >
                      <option value="1st">1st Semester</option>
                      <option value="2nd">2nd Semester</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>
                </div>
              )}

              {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 border ${
                  message.type === 'success' 
                    ? 'bg-teal-50 text-teal-700 border-teal-100 shadow-sm shadow-teal-900/5' 
                    : 'bg-red-50 text-red-700 border-red-100 shadow-sm shadow-red-900/5'
                }`}>
                  {message.type === 'success' 
                    ? <CheckCircle2 className="h-5 w-5 text-teal-600" /> 
                    : <AlertCircle className="h-5 w-5 text-red-600" />}
                  <span className="text-sm font-bold uppercase tracking-tight">{message.text}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || isLoading}
                  className="bg-[#115E59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-8 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Commit System Changes
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
