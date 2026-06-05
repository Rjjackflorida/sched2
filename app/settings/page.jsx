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
            <h2 className="text-2xl font-bold text-slate-900">System Configuration</h2>
            <p className="text-slate-500 text-sm">Manage global variables and system-wide defaults.</p>
          </div>

          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg">Academic Period Source of Truth</CardTitle>
              <CardDescription>
                This controls the active semester and year across the entire platform. 
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-md flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-semibold">Warning</p>
                  <p className="mt-1">
                    Changing this will update the workload calculations and dashboards for all faculty members immediately. 
                    Ensure you are ready to transition to a new term before saving.
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Active Academic Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value={2024}>A.Y. 2024-2025</option>
                      <option value={2025}>A.Y. 2025-2026</option>
                      <option value={2026}>A.Y. 2026-2027</option>
                      <option value={2027}>A.Y. 2027-2028</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Active Semester</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="1st">1st Semester</option>
                      <option value="2nd">2nd Semester</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>
                </div>
              )}

              {message && (
                <div className={`p-3 rounded-md flex items-center gap-2 ${message.type === 'success' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              )}

              <div className="pt-2">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || isLoading}
                  className="bg-[#115E59] hover:bg-teal-900 text-white"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save / Update Global Term
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
