"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, RotateCcw, AlertCircle, CheckCircle2, Calendar } from "lucide-react"
import { saveFacultyAvailability, getFacultyAvailability } from "@/app/actions/faculty"
import { getUserId } from "@/app/actions/auth"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

// Generate 30-minute intervals from 7:00 AM to 9:00 PM
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 7; hour <= 21; hour++) {
    const paddedHour = String(hour).padStart(2, '0')
    slots.push(`${paddedHour}:00`)
    if (hour < 21) slots.push(`${paddedHour}:30`)
  }
  return slots
}

const timeSlots = generateTimeSlots()

const format12Hour = (timeStr) => {
  const [hourStr, minute] = timeStr.split(':')
  const hour = parseInt(hourStr, 10)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minute} ${period}`
}

export default function FacultyAvailability() {
  // Metadata States
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear())
  const [semester, setSemester] = useState("1st Semester")
  const [userId, setUserId] = useState(null)

  // Availability States
  const [isRecurring, setIsRecurring] = useState(true)
  const [unavailableBlocks, setUnavailableBlocks] = useState(new Set())
  
  // UI States
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text: string }

  // 1. Initial Load: Get User ID
  useEffect(() => {
    const init = async () => {
      const id = await getUserId()
      setUserId(id)
    }
    init()
  }, [])

  // 2. Data Load: Fetch existing availability when userId, year, or sem changes
  useEffect(() => {
    if (!userId) return

    const loadData = async () => {
      setIsLoading(true)
      const res = await getFacultyAvailability(userId, semester, academicYear)
      if (res.success) {
        setUnavailableBlocks(new Set(res.blocks))
      }
      setIsLoading(false)
    }
    loadData()
  }, [userId, semester, academicYear])

  const toggleBlock = (day, time) => {
    const key = `${day}-${time}`
    const newBlocks = new Set(unavailableBlocks)
    if (newBlocks.has(key)) newBlocks.delete(key)
    else newBlocks.add(key)
    setUnavailableBlocks(newBlocks)
    setMessage(null) // Clear messages when user interacts
  }

  const toggleDay = (day) => {
    const daySlots = timeSlots.map(time => `${day}-${time}`)
    const allBlocked = daySlots.every(slot => unavailableBlocks.has(slot))
    const newBlocks = new Set(unavailableBlocks)
    if (allBlocked) daySlots.forEach(slot => newBlocks.delete(slot))
    else daySlots.forEach(slot => newBlocks.add(slot))
    setUnavailableBlocks(newBlocks)
    setMessage(null)
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    setMessage(null)

    const res = await saveFacultyAvailability(userId, {
      semester,
      academicYear,
      blocks: Array.from(unavailableBlocks)
    })

    if (res.success) {
      setMessage({ type: 'success', text: "Your availability has been saved successfully!" })
    } else {
      setMessage({ type: 'error', text: res.error || "Failed to save availability." })
    }
    setIsSubmitting(false)
  }

  const handleReset = () => {
    setUnavailableBlocks(new Set())
    setMessage(null)
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Availability</h2>
          <p className="text-slate-500 mt-1">Select the time blocks when you are <span className="font-bold text-red-600">unavailable</span> to teach.</p>
        </div>

        {/* Period Selectors */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-slate-100">
            <Calendar className="h-4 w-4 text-teal-600" />
            <select 
              value={academicYear} 
              onChange={(e) => setAcademicYear(parseInt(e.target.value))}
              className="text-sm font-bold text-slate-700 focus:outline-none bg-transparent"
            >
              <option value={2025}>A.Y. 2025-2026</option>
              <option value={2026}>A.Y. 2026-2027</option>
            </select>
          </div>
          <select 
            value={semester} 
            onChange={(e) => setSemester(e.target.value)}
            className="text-sm font-bold text-slate-700 px-3 focus:outline-none bg-transparent"
          >
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
            <option value="Summer">Summer</option>
          </select>
        </div>
      </div>

      {/* Success/Error Feedback */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-teal-50 text-teal-800 border border-teal-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Interactive Calendar Card */}
      <Card className="border-slate-200 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-white pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Weekly Schedule Grid</CardTitle>
              <CardDescription>Click slots to block, or click Day Name to toggle whole day.</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-teal-50 border border-teal-200 rounded-sm"></div> Available</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-200 border border-slate-300 rounded-sm diagonal-stripes"></div> Unavailable</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          )}
          
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
              <div className="p-4 border-r border-slate-200 text-center font-bold text-slate-400 text-[10px] uppercase tracking-tighter">Time Interval</div>
              {daysOfWeek.map(day => (
                <div 
                  key={day} 
                  onClick={() => toggleDay(day)}
                  className="p-4 border-r border-slate-200 text-center font-extrabold text-slate-900 text-sm cursor-pointer hover:bg-slate-200 transition-colors group relative"
                >
                  {day}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-teal-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></div>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="divide-y divide-slate-100 bg-white max-h-[550px] overflow-y-auto custom-scrollbar">
              {timeSlots.map(time => (
                <div key={time} className="grid grid-cols-6 h-10 group/row">
                  <div className="border-r border-slate-200 p-2 flex items-center justify-center text-[10px] font-bold uppercase text-slate-500 bg-slate-50 group-hover/row:bg-slate-100 transition-colors">
                    {format12Hour(time)}
                  </div>
                  {daysOfWeek.map(day => {
                    const isBlocked = unavailableBlocks.has(`${day}-${time}`)
                    return (
                      <div 
                        key={`${day}-${time}`} 
                        onClick={() => toggleBlock(day, time)}
                        className={`
                          border-r border-slate-200 cursor-pointer transition-all duration-75
                          ${isBlocked ? 'bg-slate-200/90 diagonal-stripes border-slate-300 shadow-inner' : 'bg-teal-50/5 hover:bg-teal-500/20'}
                        `}
                      >
                        {isBlocked && (
                          <div className="h-full w-full flex items-center justify-center">
                            <Badge className="bg-white/80 text-slate-800 border-none shadow-none text-[8px] font-bold px-1 h-4 pointer-events-none uppercase">Blocked</Badge>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 font-medium italic">
          Selected: <span className="text-slate-900 font-bold">{unavailableBlocks.size}</span> half-hour blocks.
        </p>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={isSubmitting || isLoading || unavailableBlocks.size === 0}
            className="flex-1 sm:flex-none border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Reset All
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSubmitting || isLoading}
            className="flex-1 sm:flex-none bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Availability
          </Button>
        </div>
      </div>

      <style jsx>{`
        .diagonal-stripes {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.04) 10px, rgba(0,0,0,0.04) 20px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}
