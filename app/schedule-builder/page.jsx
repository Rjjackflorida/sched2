"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, LayoutDashboard, Layers, FileText, HelpCircle, Bell, Settings } from "lucide-react"
import { AdminLayout } from "@/components/admin-layout"

// Mock Data
const faculties = [
  { 
    id: "f1", 
    name: "Dr. Alice Smith", 
    department: "Computer Science",
    availabilities: [
      { day: "Monday", start: 9, end: 12 },
      { day: "Wednesday", start: 9, end: 12 },
      { day: "Friday", start: 9, end: 12 }
    ]
  },
  { 
    id: "f2", 
    name: "Prof. John Doe", 
    department: "Mathematics",
    availabilities: [
      { day: "Tuesday", start: 13, end: 17 },
      { day: "Thursday", start: 13, end: 17 }
    ]
  },
  {
    id: "f3",
    name: "Dr. Sarah Johnson",
    department: "Physics",
    availabilities: [
      { day: "Monday", start: 14, end: 18 },
      { day: "Wednesday", start: 14, end: 18 },
      { day: "Friday", start: 14, end: 18 }
    ]
  }
]

const unassignedCourses = [
  { id: "c1", code: "CS-101", title: "Intro to Programming", units: 3, duration: 2 },
  { id: "c2", code: "MATH-201", title: "Calculus II", units: 4, duration: 2 },
  { id: "c3", code: "PHYS-301", title: "Quantum Mechanics", units: 3, duration: 3 }
]

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const timeSlots = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

export default function ScheduleBuilderPage() {
  const [selectedFacultyId, setSelectedFacultyId] = useState("f1")
  const [draggedCourse, setDraggedCourse] = useState(null)
  const [scheduledCourses, setScheduledCourses] = useState([])

  const selectedFaculty = faculties.find(f => f.id === selectedFacultyId)

  const isSlotAvailable = (day, time) => {
    if (!selectedFaculty) return true // If no faculty selected, everything is "available"
    return selectedFaculty.availabilities.some(
      avail => avail.day === day && time >= avail.start && time < avail.end
    )
  }

  const handleDragStart = (e, course) => {
    setDraggedCourse(course)
    // We can only schedule if a faculty is selected
    if (!selectedFaculty) {
        e.preventDefault()
        alert("Please select a faculty member first.")
    }
  }

  const handleDrop = (e, day, time) => {
    e.preventDefault()
    if (!draggedCourse || !selectedFaculty) return

    // Check if slot is available
    if (!isSlotAvailable(day, time)) {
      alert(`${selectedFaculty.name} is not available at this time.`)
      return
    }

    // Add to schedule
    const newScheduledCourse = {
      ...draggedCourse,
      facultyId: selectedFaculty.id,
      facultyName: selectedFaculty.name,
      day,
      startTime: time,
      endTime: time + draggedCourse.duration
    }

    setScheduledCourses([...scheduledCourses, newScheduledCourse])
    setDraggedCourse(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  // Find what is scheduled at a specific slot
  const getScheduledCourseAtSlot = (day, time) => {
    return scheduledCourses.find(
      c => c.day === day && time >= c.startTime && time < c.endTime
    )
  }

  return (
    <AdminLayout title="Schedule Builder">
        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Assignment Tools */}
          <div className="w-[300px] border-r border-slate-200 bg-white flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">1. Select Faculty</h2>
              <select 
                className="w-full border-slate-200 rounded-md shadow-sm text-sm p-2 bg-white"
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
              >
                <option value="">-- Select Faculty --</option>
                {faculties.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                ))}
              </select>
              {selectedFaculty && (
                <div className="mt-3 p-3 bg-teal-50 border border-teal-100 rounded-md">
                  <p className="text-xs text-teal-800 font-medium">Currently viewing availability for:</p>
                  <p className="text-sm font-bold text-teal-900">{selectedFaculty.name}</p>
                </div>
              )}
            </div>

            <div className="p-4 flex-1">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">2. Drag to Assign</h2>
              <div className="space-y-3">
                {unassignedCourses.map(course => {
                  // Hide if already scheduled
                  if (scheduledCourses.some(c => c.id === course.id)) return null;

                  return (
                    <div 
                      key={course.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, course)}
                      className="border border-slate-200 rounded-md p-3 bg-white shadow-sm cursor-grab active:cursor-grabbing hover:border-teal-500 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline" className="text-teal-700 border-teal-200 bg-teal-50">{course.code}</Badge>
                        <span className="text-xs font-medium text-slate-500">{course.units} Units</span>
                      </div>
                      <h3 className="font-medium text-slate-900 text-sm mb-2">{course.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>{course.duration} hours required</span>
                      </div>
                    </div>
                  )
                })}
                {unassignedCourses.every(c => scheduledCourses.some(sc => sc.id === c.id)) && (
                    <div className="text-center p-4 border border-dashed border-slate-300 rounded-md text-slate-500 text-sm">
                        All courses assigned!
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Master Grid */}
          <div className="flex-1 bg-slate-50 overflow-auto p-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-w-[800px]">
              
              {/* Grid Header */}
              <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50">
                <div className="p-3 border-r border-slate-200 flex items-center justify-center font-semibold text-slate-500 text-sm">
                  Time
                </div>
                {daysOfWeek.map(day => (
                  <div key={day} className="p-3 border-r border-slate-200 text-center font-semibold text-slate-900 text-sm">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div className="divide-y divide-slate-100">
                {timeSlots.map(time => (
                  <div key={time} className="grid grid-cols-6 h-20">
                    {/* Time Label */}
                    <div className="border-r border-slate-200 p-2 flex items-center justify-center text-xs font-medium text-slate-500 bg-slate-50">
                      {time}:00 {time < 12 ? 'AM' : 'PM'}
                    </div>

                    {/* Day Slots */}
                    {daysOfWeek.map(day => {
                      const available = isSlotAvailable(day, time)
                      const scheduledCourse = getScheduledCourseAtSlot(day, time)
                      
                      // If it's a continuation of a multi-hour course, we don't render a new dropzone
                      const isContinuation = scheduledCourse && scheduledCourse.startTime < time;

                      return (
                        <div 
                          key={`${day}-${time}`} 
                          className={`
                            border-r border-slate-200 relative
                            ${!available && !scheduledCourse ? 'bg-slate-200/60 cursor-not-allowed repeating-lines' : ''}
                            ${available && !scheduledCourse ? 'hover:bg-teal-50 transition-colors' : ''}
                          `}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, day, time)}
                        >
                          {/* Blocked Overlay */}
                          {!available && !scheduledCourse && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-xs font-medium text-slate-500 bg-white/80 px-2 py-1 rounded">Unavailable</span>
                            </div>
                          )}

                          {/* Scheduled Course Card */}
                          {scheduledCourse && !isContinuation && (
                            <div 
                              className="absolute inset-x-1 top-1 bottom-1 bg-teal-600 rounded-md shadow-md p-2 flex flex-col z-10 overflow-hidden"
                              style={{ height: `calc(${scheduledCourse.duration * 100}% - 8px)` }}
                            >
                              <span className="text-white font-bold text-xs">{scheduledCourse.code}</span>
                              <span className="text-teal-100 text-[10px] truncate">{scheduledCourse.title}</span>
                              <div className="mt-auto flex items-center gap-1 text-teal-100 text-[10px]">
                                <Users className="h-3 w-3" />
                                <span className="truncate">{scheduledCourse.facultyName}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            <style jsx>{`
              .repeating-lines {
                background-image: repeating-linear-gradient(
                  45deg,
                  #f1f5f9,
                  #f1f5f9 10px,
                  #e2e8f0 10px,
                  #e2e8f0 20px
                );
              }
            `}</style>
          </div>

        </div>
    </AdminLayout>
  )
}
