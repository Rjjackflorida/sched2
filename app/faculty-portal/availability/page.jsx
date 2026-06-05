"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, RotateCcw, AlertCircle, CheckCircle2, Calendar } from "lucide-react"
import { saveFacultyAvailability, getFacultyAvailability } from "@/app/actions/faculty"
import { getUserId } from "@/app/actions/auth"
import { getSystemSettings } from "@/app/actions/settings"

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
  const [academicYear, setAcademicYear] = useState(2024)
  const [semester, setSemester] = useState("1st")
  const [userId, setUserId] = useState(null)

  // Availability States
  const [isRecurring, setIsRecurring] = useState(true)
  const [unavailableBlocks, setUnavailableBlocks] = useState(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Drag-and-Drop Selection States
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState(null) // 'add' | 'remove'

  // UI States
  const [isLoading, setIsLoading] = useState(true)
  const [isSettingsLoading, setIsSettingsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text: string }

  // 1. Initial Load: Get User ID and Global Settings
  useEffect(() => {
    const init = async () => {
      const [userRes, settingsRes] = await Promise.all([
        getUserId(),
        getSystemSettings()
      ])
      
      setUserId(userRes)
      
      if (settingsRes.success && settingsRes.settings) {
        setAcademicYear(settingsRes.settings.activeAcademicYear)
        setSemester(settingsRes.settings.activeSemester)
      }
      setIsSettingsLoading(false)
    }
    init()
  }, [])

  // 2. Unsaved Changes Warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // 3. Data Load: Fetch existing availability when userId, year, or sem changes
  useEffect(() => {
    if (!userId || isSettingsLoading) return

    const loadData = async () => {
      setIsLoading(true)
      const res = await getFacultyAvailability(userId, semester, academicYear)
      if (res.success) {
        setUnavailableBlocks(new Set(res.blocks))
      } else {
        setUnavailableBlocks(new Set())
      }
      setHasUnsavedChanges(false)
      setIsLoading(false)
    }
    loadData()
  }, [userId, semester, academicYear, isSettingsLoading])

  // --- Interaction Handlers ---

  const startDragging = (day, time) => {
    const key = `${day}-${time}`
    const mode = unavailableBlocks.has(key) ? 'remove' : 'add'
    setDragMode(mode)
    setIsDragging(true)
    handleBlockAction(key, mode)
  }

  const handleMouseEnter = (day, time) => {
    if (!isDragging) return
    handleBlockAction(`${day}-${time}`, dragMode)
  }

  const stopDragging = () => {
    setIsDragging(false)
    setDragMode(null)
  }

  const handleBlockAction = (key, mode) => {
    const newBlocks = new Set(unavailableBlocks)
    if (mode === 'add') newBlocks.add(key)
    else newBlocks.delete(key)
    
    setUnavailableBlocks(newBlocks)
    setHasUnsavedChanges(true)
    setMessage(null)
  }

  const toggleDay = (day) => {
    const daySlots = timeSlots.map(time => `${day}-${time}`)
    const allBlocked = daySlots.every(slot => unavailableBlocks.has(slot))
    const newBlocks = new Set(unavailableBlocks)
    if (allBlocked) daySlots.forEach(slot => newBlocks.delete(slot))
    else daySlots.forEach(slot => newBlocks.add(slot))
    setUnavailableBlocks(newBlocks)
    setHasUnsavedChanges(true)
    setMessage(null)
  }

  const quickToggleRange = (type) => {
    const newBlocks = new Set(unavailableBlocks)
    daysOfWeek.forEach(day => {
      timeSlots.forEach(time => {
        const hour = parseInt(time.split(':')[0], 10)
        const isMorning = hour < 12
        const key = `${day}-${time}`
        
        if (type === 'morning' && isMorning) newBlocks.add(key)
        if (type === 'afternoon' && !isMorning) newBlocks.add(key)
      })
    })
    setUnavailableBlocks(newBlocks)
    setHasUnsavedChanges(true)
  }

  const handleCopyPrevious = async () => {
    if (!userId) return
    setIsLoading(true)
    // Find what the "previous" semester would be
    const prevSem = semester === "2nd" ? "1st" : semester === "Summer" ? "2nd" : null
    if (!prevSem) {
      setMessage({ type: 'error', text: "No previous semester data found for 1st Semester." })
      setIsLoading(false)
      return
    }

    const res = await getFacultyAvailability(userId, prevSem, academicYear)
    if (res.success && res.blocks.length > 0) {
      setUnavailableBlocks(new Set(res.blocks))
      setHasUnsavedChanges(true)
      setMessage({ type: 'success', text: `Copied data from ${prevSem} Semester!` })
    } else {
      setMessage({ type: 'error', text: `No saved data found for ${prevSem} Semester.` })
    }
    setIsLoading(false)
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
      setHasUnsavedChanges(false)
    } else {
      setMessage({ type: 'error', text: res.error || "Failed to save availability." })
    }
    setIsSubmitting(false)
  }

  const handleReset = () => {
    if (confirm("Are you sure you want to clear the entire grid?")) {
      setUnavailableBlocks(new Set())
      setHasUnsavedChanges(true)
      setMessage(null)
    }
  }

  return (
    <div 
      className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 select-none"
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Availability</h2>
          <p className="text-slate-500 mt-1">Select the time blocks when you are <span className="font-bold text-red-600">unavailable</span> to teach.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyPrevious}
              className="text-xs h-9 border-teal-200 text-teal-700 hover:bg-teal-50"
              disabled={isLoading || semester === "1st"}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Copy Previous Term
            </Button>
          </div>

          {/* Period Selectors */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 border-r border-slate-100">
              <Calendar className="h-4 w-4 text-teal-600" />
              <select 
                value={academicYear} 
                onChange={(e) => setAcademicYear(parseInt(e.target.value))}
                disabled={isSettingsLoading}
                className="text-sm font-bold text-slate-700 focus:outline-none bg-transparent disabled:opacity-50"
              >
                <option value={academicYear}>{`A.Y. ${academicYear}-${academicYear + 1}`}</option>
                <option value={academicYear - 1}>{`A.Y. ${academicYear - 1}-${academicYear}`}</option>
                <option value={academicYear + 1}>{`A.Y. ${academicYear + 1}-${academicYear + 2}`}</option>
              </select>
            </div>
            <select 
              value={semester} 
              onChange={(e) => setSemester(e.target.value)}
              disabled={isSettingsLoading}
              className="text-sm font-bold text-slate-700 px-3 focus:outline-none bg-transparent disabled:opacity-50"
            >
              <option value="1st">1st Semester</option>
              <option value="2nd">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Weekly Schedule Grid</CardTitle>
              <CardDescription>Click and Drag to "paint" your schedule. Click Day Name to toggle whole day.</CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2 mr-4 border-r pr-4 border-slate-200">
                <Button variant="ghost" size="sm" onClick={() => quickToggleRange('morning')} className="text-[10px] font-bold uppercase h-7 px-2 hover:bg-teal-50 hover:text-teal-700">Block Mornings</Button>
                <Button variant="ghost" size="sm" onClick={() => quickToggleRange('afternoon')} className="text-[10px] font-bold uppercase h-7 px-2 hover:bg-teal-50 hover:text-teal-700">Block Afternoons</Button>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-teal-50 border border-teal-200 rounded-sm"></div> Available</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-200 border border-slate-300 rounded-sm diagonal-stripes"></div> Unavailable</div>
              </div>
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
                        onMouseDown={() => startDragging(day, time)}
                        onMouseEnter={() => handleMouseEnter(day, time)}
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
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-400 font-medium italic">
            Selected: <span className="text-slate-900 font-bold">{unavailableBlocks.size}</span> half-hour blocks.
          </p>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 animate-pulse">
              Unsaved Changes
            </Badge>
          )}
        </div>
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
            disabled={isSubmitting || isLoading || !hasUnsavedChanges}
            className={`flex-1 sm:flex-none text-white shadow-lg ${hasUnsavedChanges ? 'bg-[#115e59] hover:bg-teal-900 shadow-teal-900/10' : 'bg-slate-400 cursor-not-allowed'}`}
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
