"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

// Generate 30-minute intervals from 7:00 AM to 9:00 PM
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 7; hour <= 21; hour++) {
    slots.push(`${hour}:00`)
    if (hour < 21) slots.push(`${hour}:30`)
  }
  return slots
}

const timeSlots = generateTimeSlots()

/**
 * Formats a 24h string (e.g. "13:30") into a 12h string (e.g. "1:30 PM")
 */
const format12Hour = (timeStr) => {
  const [hourStr, minute] = timeStr.split(':')
  const hour = parseInt(hourStr, 10)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minute} ${period}`
}

export default function FacultyAvailability() {
  const [isRecurring, setIsRecurring] = useState(true)
  // Store unavailable slots: "Monday-9:00"
  const [unavailableBlocks, setUnavailableBlocks] = useState(new Set(["Tuesday-9:00", "Tuesday-10:00", "Thursday-14:30"]))

  const toggleBlock = (day, time) => {
    const key = `${day}-${time}`
    const newBlocks = new Set(unavailableBlocks)
    if (newBlocks.has(key)) {
      newBlocks.delete(key)
    } else {
      newBlocks.add(key)
    }
    setUnavailableBlocks(newBlocks)
  }

  /**
   * Toggles an entire day between fully blocked and fully available.
   */
  const toggleDay = (day) => {
    const daySlots = timeSlots.map(time => `${day}-${time}`)
    const allBlocked = daySlots.every(slot => unavailableBlocks.has(slot))
    
    const newBlocks = new Set(unavailableBlocks)
    if (allBlocked) {
      // If everything is already blocked, clear the day
      daySlots.forEach(slot => newBlocks.delete(slot))
    } else {
      // Otherwise, block the entire day
      daySlots.forEach(slot => newBlocks.add(slot))
    }
    setUnavailableBlocks(newBlocks)
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">My Availability</h2>
          <p className="text-slate-500 mt-1">Block out times when you are strictly unavailable to teach.</p>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setIsRecurring(true)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isRecurring ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Recurring (Weekly)
          </button>
          <button 
            onClick={() => setIsRecurring(false)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!isRecurring ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Specific Date
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 bg-white">
          <div className="flex justify-between items-center">
            <CardTitle>Interactive Calendar</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-teal-50 border border-teal-200 rounded"></div> Available</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-200 border border-slate-300 rounded diagonal-stripes"></div> Unavailable</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
              <div className="p-3 border-r border-slate-200 text-center font-semibold text-slate-500 text-sm">Time</div>
              {daysOfWeek.map(day => (
                <div 
                  key={day} 
                  onClick={() => toggleDay(day)}
                  className="p-3 border-r border-slate-200 text-center font-semibold text-slate-900 text-sm cursor-pointer hover:bg-slate-200 transition-colors group relative"
                  title={`Click to toggle all ${day} slots`}
                >
                  {day}
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-teal-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></div>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="divide-y divide-slate-100 bg-white max-h-[600px] overflow-y-auto">
              {timeSlots.map(time => (
                <div key={time} className="grid grid-cols-6 h-12">
                  <div className="border-r border-slate-200 p-2 flex items-center justify-center text-[10px] font-bold uppercase text-slate-500 bg-slate-50">
                    {format12Hour(time)}
                  </div>
                  {daysOfWeek.map(day => {
                    const isBlocked = unavailableBlocks.has(`${day}-${time}`)
                    return (
                      <div 
                        key={`${day}-${time}`} 
                        onClick={() => toggleBlock(day, time)}
                        className={`
                          border-r border-slate-200 cursor-pointer transition-all duration-200
                          ${isBlocked ? 'bg-slate-200/80 diagonal-stripes border-slate-300' : 'bg-teal-50/10 hover:bg-teal-100/50'}
                        `}
                      >
                        {isBlocked && (
                          <div className="h-full w-full flex items-center justify-center">
                            <Badge variant="secondary" className="bg-white/90 text-slate-600 border border-slate-200 pointer-events-none scale-75">Blocked</Badge>
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
      
      <div className="flex justify-end gap-4">
        <Button variant="outline">Reset Changes</Button>
        <Button className="bg-[#115e59] hover:bg-teal-900 text-white">Save Availability</Button>
      </div>

      <style jsx>{`
        .diagonal-stripes {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px);
        }
      `}</style>
    </div>
  )
}
