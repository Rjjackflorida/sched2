"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const timeSlots = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

export default function FacultyAvailability() {
  const [isRecurring, setIsRecurring] = useState(true)
  // Store unavailable slots: "Monday-9"
  const [unavailableBlocks, setUnavailableBlocks] = useState(new Set(["Tuesday-9", "Tuesday-10", "Thursday-14"]))

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
            <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50">
              <div className="p-3 border-r border-slate-200 text-center font-semibold text-slate-500 text-sm">Time</div>
              {daysOfWeek.map(day => (
                <div key={day} className="p-3 border-r border-slate-200 text-center font-semibold text-slate-900 text-sm">{day}</div>
              ))}
            </div>

            {/* Body */}
            <div className="divide-y divide-slate-100 bg-white">
              {timeSlots.map(time => (
                <div key={time} className="grid grid-cols-6 h-16">
                  <div className="border-r border-slate-200 p-2 flex items-center justify-center text-xs font-medium text-slate-500 bg-slate-50">
                    {time}:00 {time < 12 ? 'AM' : 'PM'}
                  </div>
                  {daysOfWeek.map(day => {
                    const isBlocked = unavailableBlocks.has(`${day}-${time}`)
                    return (
                      <div 
                        key={`${day}-${time}`} 
                        onClick={() => toggleBlock(day, time)}
                        className={`
                          border-r border-slate-200 cursor-pointer transition-all duration-200
                          ${isBlocked ? 'bg-slate-200/80 diagonal-stripes border-slate-300' : 'bg-teal-50/30 hover:bg-teal-100'}
                        `}
                      >
                        {isBlocked && (
                          <div className="h-full w-full flex items-center justify-center">
                            <Badge variant="secondary" className="bg-white/90 text-slate-600 border border-slate-200 pointer-events-none">Blocked</Badge>
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
