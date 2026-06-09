"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Calendar as CalendarIcon, MapPin, Loader2, BookOpen, Clock, Printer } from "lucide-react"
import { getUserId } from "@/app/actions/auth"
import { getFacultyProfileData } from "@/app/actions/faculty"
import { getSystemSettings } from "@/app/actions/settings"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const startHour = 7
const endHour = 21

/**
 * Generates 1-hour time labels for the left axis.
 */
const generateTimeLabels = () => {
  const labels = []
  for (let hour = startHour; hour <= endHour; hour++) {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    labels.push(`${displayHour}:00 ${period}`)
  }
  return labels
}

/**
 * Calculates the grid row index for a given time.
 * Each row represents 30 minutes.
 */
const getRowIndex = (date) => {
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const totalMinutesFromStart = (hours - startHour) * 60 + minutes
  return Math.floor(totalMinutesFromStart / 30) + 1
}

/**
 * Calculates how many 30-min rows a class spans.
 */
const getRowSpan = (start, end) => {
  const diffMs = end.getTime() - start.getTime()
  const diffMins = diffMs / (1000 * 60)
  return Math.floor(diffMins / 30)
}

const colorSchemes = [
  "bg-teal-50 border-teal-200 text-teal-900 shadow-teal-100/50",
  "bg-blue-50 border-blue-200 text-blue-900 shadow-blue-100/50",
  "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-indigo-100/50",
  "bg-slate-50 border-slate-200 text-slate-900 shadow-slate-100/50",
  "bg-cyan-50 border-cyan-200 text-cyan-900 shadow-cyan-100/50",
  "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-100/50",
]

export default function FacultySchedule() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

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

    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  const timeLabels = generateTimeLabels()
  
  // Flatten all schedules into a positionable array
  const scheduleItems = []
  data?.sections?.forEach((section, sIdx) => {
    section.schedules.forEach((sch, schIdx) => {
      const sTime = new Date(sch.startTime)
      const eTime = new Date(sch.endTime)
      
      scheduleItems.push({
        id: `${section.id}-${schIdx}`,
        courseCode: section.courseCode,
        courseTitle: section.courseTitle,
        sectionCode: section.sectionCode,
        programCode: section.programCode,
        yearLevel: section.yearLevel,
        sectionName: section.sectionName,
        day: sch.day,
        room: sch.room,
        time: sch.time,
        rowStart: getRowIndex(sTime),
        rowSpan: getRowSpan(sTime, eTime),
        colorClass: colorSchemes[sIdx % colorSchemes.length]
      })
    })
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 print:p-8">
      {/* Header - Hidden on Print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">My Teaching Schedule</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-100 font-semibold">
              {data?.activeSemester} Semester {data?.activeAcademicYear}-{data?.activeAcademicYear + 1}
            </Badge>
            <p className="text-slate-500 text-sm font-medium">Official Load for <span className="font-bold text-slate-700">{data?.fullName}</span></p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handlePrint} variant="outline" className="text-slate-700 bg-white shadow-sm border-slate-200 font-semibold">
            <Printer className="w-4 h-4 mr-2" /> Print Schedule
          </Button>
          <Button className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 font-semibold">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Official Header - Visible ONLY on Print */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-6 mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tighter">University Faculty Schedule</h1>
        <div className="flex justify-center gap-8 mt-4 text-sm font-bold">
          <p>FACULTY: {data?.fullName?.toUpperCase()}</p>
          <p>TERM: {data?.activeSemester?.toUpperCase()} SEMESTER {data?.activeAcademicYear}</p>
        </div>
      </div>

      {(!data?.sections || data.sections.length === 0) ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No Assignments Found</h3>
            <p className="text-slate-500 max-w-xs mt-2">Your schedule hasn't been finalized in the system yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 shadow-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardContent className="p-0 overflow-x-auto print:overflow-visible">
            <div className="min-w-[1000px] relative">
              {/* Grid Header (Days) */}
              <div className="grid grid-cols-[100px_repeat(6,1fr)] bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
                <div className="p-4 border-r border-slate-200"></div>
                {daysOfWeek.map(day => (
                  <div key={day} className="p-4 text-center border-r border-slate-200 last:border-0">
                    <span className="text-sm font-semibold uppercase tracking-widest text-slate-900">{day}</span>
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div className="relative grid grid-cols-[100px_repeat(6,1fr)]" style={{ gridTemplateRows: `repeat(${(endHour - startHour + 1) * 2}, 30px)` }}>
                
                {/* Time Labels & Horizontal Lines */}
                {timeLabels.map((label, i) => (
                  <div key={i} className="contents">
                    <div 
                      className="flex items-start justify-center pr-3 pt-1 text-[10px] font-semibold text-slate-400 uppercase bg-slate-50 border-r border-slate-200 sticky left-0 z-10"
                      style={{ gridRow: `${i * 2 + 1} / span 2` }}
                    >
                      {label}
                    </div>
                    {/* Horizontal Line - Full width */}
                    <div 
                      className="col-start-2 col-span-6 border-b border-slate-100 pointer-events-none"
                      style={{ gridRow: `${i * 2 + 1} / span 1` }}
                    />
                    <div 
                      className="col-start-2 col-span-6 border-b border-slate-200/50 border-dashed pointer-events-none"
                      style={{ gridRow: `${i * 2 + 2} / span 1` }}
                    />
                  </div>
                ))}

                {/* Vertical Day Lines */}
                {daysOfWeek.map((_, i) => (
                  <div 
                    key={i} 
                    className="row-start-1 row-span-full border-r border-slate-200/50 pointer-events-none"
                    style={{ gridColumnStart: i + 2 }}
                  />
                ))}

                {/* Schedule Blocks */}
                {scheduleItems.map((item) => {
                  const dayIdx = daysOfWeek.indexOf(item.day)
                  if (dayIdx === -1) return null
                  
                  return (
                    <div
                      key={item.id}
                      className={`
                        mx-1.5 my-1 p-3 rounded-lg border-l-4 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md hover:z-30 cursor-default
                        flex flex-col gap-1 overflow-hidden group
                        ${item.colorClass}
                      `}
                      style={{
                        gridRow: `${item.rowStart} / span ${item.rowSpan}`,
                        gridColumnStart: dayIdx + 2
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-tighter opacity-70">
                          {item.programCode} {item.yearLevel}-{item.sectionName}
                        </span>
                        <Clock className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <h4 className="font-bold text-xs leading-tight tracking-tight uppercase line-clamp-2 text-slate-900">
                        {item.courseCode}: {item.courseTitle}
                      </h4>
                      
                      <div className="mt-auto space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-semibold">
                          <MapPin className="w-2.5 h-2.5 text-teal-600" />
                          <span className="text-slate-700">{item.room || "TBA"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-semibold opacity-60 text-slate-600">
                          <CalendarIcon className="w-2.5 h-2.5" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend / Info Footer */}
      {data?.sections?.length > 0 && (
        <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl print:p-2 print:gap-4 print:border-none">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#115e59] rounded-full"></div>
            <span className="text-xs font-semibold text-slate-600">Total Units: {data.sections.reduce((acc, s) => acc + s.units, 0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
            <span className="text-xs font-semibold text-slate-600">Assignments: {data.sections.length} Course Sections</span>
          </div>
          <p className="text-[10px] text-slate-400 italic ml-auto uppercase tracking-widest font-semibold print:hidden">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
      )}

      <style jsx>{`
        @media print {
          .print\:p-0 { padding: 0 !important; }
          .print\:hidden { display: none !important; }
          .print\:block { display: block !important; }
          body { background: white !important; }
          .shadow-2xl { box-shadow: none !important; }
          .border-slate-200 { border-color: #000 !important; }
          @page { margin: 0; size: landscape; }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
