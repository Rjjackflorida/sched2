"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar as CalendarIcon, MapPin, Loader2, BookOpen } from "lucide-react"
import { getUserId } from "@/app/actions/auth"
import { getFacultyProfileData } from "@/app/actions/faculty"

export default function FacultySchedule() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const userId = await getUserId();
      if (userId) {
        const res = await getFacultyProfileData(userId, "1st", "2024");
        if (res.success) setData(res.data);
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
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">My Schedule</h2>
          <p className="text-slate-500 mt-1">Official assigned teaching schedule for 1st Semester 2024.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="text-slate-700 bg-white shadow-sm border-slate-200">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          <Button variant="outline" className="text-slate-700 bg-white shadow-sm border-slate-200">
            <CalendarIcon className="w-4 h-4 mr-2" /> Sync to ICS
          </Button>
        </div>
      </div>

      {(!data?.sections || data.sections.length === 0) ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No Assignments Yet</h3>
            <p className="text-slate-500 max-w-xs mt-2">You haven't been assigned to any course sections for this semester.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data.sections.map(section => (
            <Card key={section.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded text-xs">{section.courseCode}</span>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{section.sectionCode}</span>
                    </div>
                    <h3 className="font-bold text-xl text-slate-900">{section.courseTitle}</h3>
                    <p className="text-sm text-slate-500 mt-1">{section.units} Units</p>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[250px]">
                    {section.schedules.length > 0 ? (
                      section.schedules.map((sch, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1">
                            <CalendarIcon className="w-4 h-4 text-teal-600" />
                            {sch.day}
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {sch.time}</span>
                            <span className="flex items-center gap-1 font-medium text-slate-700"><MapPin className="w-3.5 h-3.5 text-orange-500" /> {sch.room}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg text-center">
                        <p className="text-xs font-bold text-orange-700 italic">Schedule Pending</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function Clock({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  )
}
