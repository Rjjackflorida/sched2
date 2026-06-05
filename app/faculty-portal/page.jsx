"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Clock, CheckCircle2, BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUserId } from "@/app/actions/auth"
import { getFacultyProfileData } from "@/app/actions/faculty"
import { getSystemSettings } from "@/app/actions/settings"
import Link from "next/link"

export default function FacultyDashboard() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const userId = await getUserId();
      if (userId) {
        const settingsRes = await getSystemSettings();
        if (settingsRes.success && settingsRes.settings) {
          const { activeSemester, activeAcademicYear } = settingsRes.settings;
          const res = await getFacultyProfileData(userId, activeSemester, activeAcademicYear.toString());
          if (res.success) {
            setData({ ...res.data, activeSemester, activeAcademicYear });
          }
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Welcome Back, {data?.fullName || "Faculty"}</h2>
        <p className="text-slate-500 mt-1">
          Here is your current academic overview for {data?.activeSemester || "1st"} Semester {data?.activeAcademicYear || 2024}.
        </p>
      </div>

      {!data?.maxUnits && (
        <Alert className="bg-orange-50 border-orange-200 text-orange-800">
          <AlertCircle className="h-5 w-5 !text-orange-600" />
          <AlertTitle className="text-orange-900 font-semibold">Action Required</AlertTitle>
          <AlertDescription className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>Your profile is incomplete. Please contact the administrator to set your employment type and workload limits.</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Teaching Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-teal-600" />
              <div>
                <span className="text-3xl font-bold text-slate-900">{data?.currentWorkload || 0}</span>
                <span className="text-slate-500 ml-2 font-medium">Units</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">Maximum allowed is {data?.maxUnits || "unassigned"} units.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <span className="text-3xl font-bold text-slate-900">{data?.sections?.length || 0}</span>
                <span className="text-slate-500 ml-2 font-medium">Sections</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">Currently assigned for this semester.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Portal Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <span className="text-2xl font-bold text-slate-900">Verified</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">Faculty account is active.</p>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <Link href="/faculty-portal/schedule">
          <Button className="bg-[#115e59] hover:bg-teal-900 text-white shadow-sm transition-all">
            View My Detailed Schedule
          </Button>
        </Link>
      </div>
    </div>
  )
}
