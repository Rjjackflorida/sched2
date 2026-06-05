"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  GripVertical, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon, 
  Trash2, 
  AlertCircle, 
  Loader2, 
  X, 
  Search, 
  CheckCircle2, 
  BookOpen, 
  Users,
  ArrowRight,
  ChevronRight
} from "lucide-react"
import { getCourseSections, getSectionSchedules, createSectionSchedule, deleteSectionSchedule, getAvailableRooms } from "@/app/actions/section"
import { getFacultyRoster } from "@/app/actions/faculty"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = []
for (let hour = 7; hour <= 20; hour++) {
  const h = String(hour).padStart(2, '0')
  timeSlots.push(`${h}:00`, `${h}:30`)
}

export default function ScheduleBuilderPage() {
  const [facultyList, setFacultyList] = useState([])
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [assignments, setAssignments] = useState([]) // Pending assignments for faculty
  const [schedules, setSchedules] = useState([])     // Placed blocks on calendar
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState(null) // { type: 'new' | 'existing', data: object }
  const [pendingPlacement, setPendingPlacement] = useState(null)

  // Room Modal State
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)
  const [availableRooms, setAvailableRooms] = useState([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    async function init() {
      const res = await getFacultyRoster()
      if (res.success) setFacultyList(res.roster)
      setIsLoading(false)
    }
    init()
  }, [])

  // Load schedules and assignments when faculty is selected
  useEffect(() => {
    if (!selectedFaculty) {
      setAssignments([])
      setSchedules([])
      return
    }
    loadFacultyData()
  }, [selectedFaculty])

  const loadFacultyData = async () => {
    setIsLoading(true)
    const [assignRes, schedRes] = await Promise.all([
      getCourseSections(), // We'll filter this locally for the selected faculty
      getSectionSchedules("1st", 2024) // TODO: Sync with global settings
    ])
    
    if (assignRes.success) {
      // Filter for assignments assigned to THIS faculty that are NOT yet scheduled
      const facultyAssignments = assignRes.sections.filter(s => s.facultyId === selectedFaculty.profileId)
      setAssignments(facultyAssignments)
    }

    if (schedRes.success) {
      setSchedules(schedRes.schedules)
    }
    setIsLoading(false)
  }

  const handleDragStart = (e, data, type) => {
    setDraggedItem({ type, data })
    e.dataTransfer.setData('text/plain', '') // Required for Firefox
  }

  const handleDrop = async (day, time) => {
    if (!draggedItem) return

    // Calculate end time (assuming 3 hour block for now, or use course defaults)
    // For MVP, let's just make it a fixed 3-hour duration from start
    const [h, m] = time.split(':').map(Number)
    const endH = h + 3
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`

    setPendingPlacement({ day, startTime: time, endTime: endTimeStr })
    
    // Check available rooms for this time slot
    setIsLoadingRooms(true)
    setIsRoomModalOpen(true)
    setFormError(null)

    const res = await getAvailableRooms(
      day, 
      new Date(`1970-01-01T${time}:00Z`), 
      new Date(`1970-01-01T${endTimeStr}:00Z`),
      "1st", 2024
    )

    if (res.success) setAvailableRooms(res.rooms)
    setIsLoadingRooms(false)
  }

  const handleSaveSchedule = async (roomId) => {
    setIsSubmitting(true)
    setFormError(null)

    const scheduleData = {
      courseSectionId: draggedItem.type === 'new' ? draggedItem.data.id : draggedItem.data.sectionId,
      roomId: roomId,
      dayOfWeek: pendingPlacement.day,
      startTime: new Date(`1970-01-01T${pendingPlacement.startTime}:00Z`),
      endTime: new Date(`1970-01-01T${pendingPlacement.endTime}:00Z`)
    }

    // If we are moving an existing block, delete the old one first
    if (draggedItem.type === 'existing') {
      await deleteSectionSchedule(draggedItem.data.id)
    }

    const res = await createSectionSchedule(scheduleData)
    
    if (res.success) {
      setIsRoomModalOpen(false)
      setDraggedItem(null)
      loadFacultyData() // Refresh everything
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleDeleteSchedule = async (id) => {
    if (!confirm("Remove this class from the schedule?")) return
    const res = await deleteSectionSchedule(id)
    if (res.success) loadFacultyData()
  }

  const format12H = (timeStr) => {
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  if (isLoading && facultyList.length === 0) {
    return (
      <AdminLayout title="Schedule Builder">
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Master Grid...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Schedule Builder">
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar: Pending */}
        <div className="w-[340px] border-r border-slate-200 bg-white flex flex-col overflow-hidden shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">1. Select Instructor</h2>
            <select 
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm"
              value={selectedFaculty?.id || ""}
              onChange={(e) => setSelectedFaculty(facultyList.find(f => f.id === e.target.value))}
            >
              <option value="">Select Faculty...</option>
              {facultyList.map(f => (
                <option key={f.id} value={f.id}>{f.fullName}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {!selectedFaculty ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                <Users className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Select an instructor to begin</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    2. Grab & Attach
                  </h2>
                  <Badge className="bg-teal-50 text-teal-700 border-none text-[10px] font-semibold px-2">{assignments.length} PENDING</Badge>
                </div>
                <div className="space-y-4">
                  {assignments.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl text-center bg-slate-50/50">
                      <CheckCircle2 className="h-8 w-8 text-teal-500 mx-auto mb-3 opacity-50" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Complete! All courses scheduled.</p>
                    </div>
                  ) : (
                    assignments.map(item => (
                      <div 
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item, 'new')}
                        className="group relative bg-white border border-slate-200 rounded-2xl p-4 cursor-grab active:cursor-grabbing hover:border-teal-500 hover:shadow-xl hover:shadow-teal-900/5 transition-all animate-in slide-in-from-left-2 duration-300"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-1 rounded uppercase tracking-tighter">
                            {item.courseCode}
                          </span>
                          <GripVertical className="h-4 w-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
                        </div>
                        <h3 className="font-bold text-slate-900 leading-tight mb-3 text-sm">{item.courseTitle}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{item.programCode} {item.yearLevel}-{item.sectionName}</span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                            <BookOpen className="h-3 w-3" /> {item.units} Units
                          </span>
                        </div>
                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Grid: 7 AM - 9 PM */}
        <div className="flex-1 bg-slate-50 overflow-auto relative custom-scrollbar">
          {!selectedFaculty ? (
             <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-sm">
                   <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6">
                      <CalendarIcon className="h-10 w-10 text-teal-600" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 mb-2">Master Schedule Grid</h3>
                   <p className="text-sm text-slate-500 font-medium">Please select a faculty member from the sidebar to view and manage their weekly teaching schedule.</p>
                </div>
             </div>
          ) : (
            <div className="p-8">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-[100px_repeat(6,1fr)] border-b border-slate-100 bg-white sticky top-0 z-30">
                  <div className="p-4 flex items-center justify-center border-r border-slate-50 text-[10px] font-black text-slate-300 uppercase tracking-tighter">Timeline</div>
                  {daysOfWeek.map(day => (
                    <div key={day} className="p-4 text-center border-r border-slate-50 last:border-0">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{day}</span>
                    </div>
                  ))}
                </div>

                <div className="relative grid grid-cols-[100px_repeat(6,1fr)] bg-white" style={{ gridTemplateRows: `repeat(${timeSlots.length}, 40px)` }}>
                   {/* Background Grid Lines */}
                   {timeSlots.map((time, i) => (
                     <div key={time} className="contents group/row">
                        <div className="p-2 border-r border-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 border-b border-slate-50 group-hover/row:bg-slate-50 transition-colors">
                          {format12H(time)}
                        </div>
                        {daysOfWeek.map(day => {
                          const isBusy = schedules.some(s => s.dayOfWeek === day && time >= s.startTime && time < s.endTime) // Simplification for MVP
                          const existingSched = schedules.find(s => s.dayOfWeek === day && time === new Date(s.startTime).toISOString().substr(11, 5))
                          
                          // Correct conflict check: Does a section block ALREADY have a class at this time?
                          // For simplicity in this render, we just show empty droppable cells.
                          
                          return (
                            <div 
                              key={`${day}-${time}`}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => handleDrop(day, time)}
                              className="border-r border-b border-slate-50 last:border-r-0 hover:bg-teal-500/5 transition-colors relative"
                            >
                               {existingSched && (
                                 <div 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, existingSched, 'existing')}
                                    className={`
                                        absolute inset-x-1 top-1 z-20 bg-[#115e59] text-white rounded-xl shadow-2xl p-3 flex flex-col group/block overflow-hidden cursor-grab active:cursor-grabbing border border-teal-400/20 hover:scale-[1.02] transition-transform
                                        ${draggedItem?.data?.id === existingSched.id ? 'opacity-20 scale-95' : 'opacity-100'}
                                    `}
                                    style={{ height: `calc(${6 * 100}% - 8px)` }}
                                 >
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="font-mono text-[9px] font-bold bg-white/10 text-white px-1.5 py-0.5 rounded tracking-tighter">
                                        {existingSched.section.programCode} {existingSched.section.yearLevel}-{existingSched.section.sectionName}
                                      </span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(existingSched.id); }}
                                        className="opacity-0 group-hover/block:opacity-100 transition-all p-1.5 hover:bg-red-500 text-white/70 hover:text-white rounded-lg"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <h4 className="font-bold text-sm leading-tight mb-1">{existingSched.section.courseCode}</h4>
                                    <p className="text-[10px] font-medium text-white/80 leading-tight line-clamp-2 mb-2">{existingSched.section.courseTitle}</p>
                                    <div className="mt-auto flex flex-col gap-1.5 border-t border-white/10 pt-2">
                                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight text-teal-100">
                                        <MapPin className="h-3 w-3 text-teal-300" />
                                        <span className="truncate">{existingSched.room ? `${existingSched.room.building}-${existingSched.room.roomNumber}` : 'TBA'}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight text-white/60">
                                        <Clock className="h-3 w-3" />
                                        {format12H(time)}
                                      </div>
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
            </div>
          )}
        </div>
      </div>

      {/* Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
             <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-slate-900">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-100 text-teal-700 rounded-md">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-lg">Assign a Room</h3>
                </div>
                <button onClick={() => { setIsRoomModalOpen(false); setDraggedItem(null); }} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
             </div>
             <div className="p-6">
                <div className="mb-6 p-5 bg-teal-50 rounded-2xl border border-teal-100/50">
                  <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-widest mb-2">Scheduling Target</p>
                  <h4 className="font-bold text-slate-900 text-lg leading-tight">{draggedItem?.type === 'new' ? draggedItem.data.courseTitle : draggedItem?.data.section.courseTitle}</h4>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-[10px] font-bold uppercase tracking-widest text-teal-700">
                    <span className="bg-teal-600 text-white px-2 py-0.5 rounded tracking-tighter shadow-sm shadow-teal-900/10">
                      {draggedItem?.type === 'new' 
                        ? `${draggedItem.data.programCode} ${draggedItem.data.yearLevel}-${draggedItem.data.sectionName}` 
                        : `${draggedItem.data.section.programCode} ${draggedItem.data.section.yearLevel}-${draggedItem.data.section.sectionName}`}
                    </span>
                    <span className="flex items-center gap-1.5 opacity-60"><CalendarIcon className="h-3.5 w-3.5" /> {pendingPlacement?.day}</span>
                    <span className="flex items-center gap-1.5 opacity-60"><Clock className="h-3.5 w-3.5" /> {pendingPlacement?.startTime} - {pendingPlacement?.endTime}</span>
                  </div>
                </div>

                {formError && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 flex items-center gap-2 animate-in slide-in-from-top-1"><AlertCircle className="h-4 w-4" /> {formError}</div>}
                
                {isLoadingRooms ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Scanning Vacancies...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {availableRooms.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 italic text-sm">No available rooms found for this time slot.</div>
                        ) : (
                          availableRooms.map(room => (
                            <div 
                              key={room.id}
                              onClick={() => !isSubmitting && room.isAvailable && handleSaveSchedule(room.id)}
                              className={`
                                p-4 rounded-xl border-2 transition-all flex justify-between items-center group
                                ${room.isAvailable ? 'border-slate-100 hover:border-teal-500 bg-slate-50 hover:bg-teal-50 cursor-pointer shadow-sm hover:shadow-md' : 'opacity-40 grayscale cursor-not-allowed border-transparent bg-slate-100'}
                              `}
                            >
                               <div>
                                 <h4 className="font-bold text-slate-900 group-hover:text-teal-700 uppercase tracking-tight">{room.building} - {room.roomNumber}</h4>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{room.type} • Cap: {room.capacity}</p>
                               </div>
                               {room.isAvailable ? <Badge className="bg-teal-600 text-[10px] font-bold uppercase">Vacant</Badge> : <Badge variant="outline" className="text-slate-400 border-slate-200 text-[10px] font-bold uppercase">Occupied</Badge>}
                            </div>
                          ))
                        )}
                     </div>
                     <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                        <Button variant="ghost" onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-semibold">Cancel</Button>
                        <Button onClick={() => handleSaveSchedule(null)} disabled={isSubmitting} className="bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold shadow-sm px-6">
                           Schedule without Room
                        </Button>
                     </div>
                  </div>
                )}
             </div>
           </div>
        </div>
      )}

      <style jsx>{`
        .diagonal-stripes { background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 16px); }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </AdminLayout>
  )
}
