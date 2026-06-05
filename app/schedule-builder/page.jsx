"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  X, Loader2, Calendar as CalendarIcon, 
  Clock, MapPin, Users, AlertCircle, CheckCircle2,
  Trash2, GripVertical, BookOpen
} from "lucide-react"
import { getFacultyRoster } from "@/app/actions/faculty"
import { getCourseSections, getSectionSchedules, createSectionSchedule, deleteSectionSchedule, getAvailableRooms } from "@/app/actions/section"
import { getSystemSettings } from "@/app/actions/settings"
import { getFacultyAvailability } from "@/app/actions/faculty"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// Generate 30-minute intervals from 7:00 AM to 9:00 PM
const TIME_SLOTS = (() => {
  const slots = []
  for (let hour = 7; hour <= 21; hour++) {
    const paddedHour = String(hour).padStart(2, '0')
    slots.push(`${paddedHour}:00`)
    if (hour < 21) slots.push(`${paddedHour}:30`)
  }
  return slots
})()

const format12H = (time) => {
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayH = hour % 12 || 12
  return `${displayH}:${m} ${ampm}`
}

export default function ScheduleBuilderPage() {
  // --- SETTINGS & FILTERS ---
  const [activeTerm, setActiveTerm] = useState({ semester: "1st", year: 2024 })
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  // --- DATA STATES ---
  const [facultyList, setFacultyList] = useState([])
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [assignments, setAssignments] = useState([]) 
  const [allSchedules, setAllSchedules] = useState([]) 
  const [facultyAvailability, setFacultyAvailability] = useState(new Set())
  
  // --- UI STATES ---
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState(null) // { type: 'new' | 'existing', data: Object }
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)
  const [pendingPlacement, setPendingPlacement] = useState(null) 
  const [availableRooms, setAvailableRooms] = useState([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  // 1. Load System Settings
  useEffect(() => {
    async function loadSettings() {
      const res = await getSystemSettings()
      if (res.success && res.settings) {
        setActiveTerm({ semester: res.settings.activeSemester, year: res.settings.activeAcademicYear })
      }
      setIsLoadingSettings(false)
    }
    loadSettings()
  }, [])

  // 2. Load Core Data
  const loadCoreData = useCallback(async () => {
    if (isLoadingSettings) return
    setIsInitialLoading(true)
    
    const [rosterRes, schedulesRes] = await Promise.all([
      getFacultyRoster(activeTerm.semester, activeTerm.year.toString()),
      getSectionSchedules(activeTerm.semester, activeTerm.year.toString())
    ])

    if (rosterRes.success) setFacultyList(rosterRes.roster)
    if (schedulesRes.success) setAllSchedules(schedulesRes.schedules)
    
    setIsInitialLoading(false)
  }, [activeTerm, isLoadingSettings])

  useEffect(() => {
    loadCoreData()
  }, [loadCoreData])

  // 3. Load Faculty Specific Data
  const loadFacultyAssignments = useCallback(async () => {
    if (!selectedFaculty) {
        setAssignments([])
        setFacultyAvailability(new Set())
        return
      }
  
      const [res, availRes] = await Promise.all([
        getCourseSections(),
        getFacultyAvailability(selectedFaculty.id, activeTerm.semester, activeTerm.year)
      ]);

      if (res.success) {
        // Filter: Assigned to this faculty, correct term, and NOT scheduled
        const unplaced = res.sections.filter(s => 
          s.facultyId === selectedFaculty.profileId && 
          s.semester === activeTerm.semester && 
          s.academicYear === activeTerm.year &&
          s.scheduleCount === 0
        )
        setAssignments(unplaced)
      }

      if (availRes.success) {
        setFacultyAvailability(new Set(availRes.blocks))
      }
  }, [selectedFaculty, activeTerm]);

  useEffect(() => {
    loadFacultyAssignments();
  }, [loadFacultyAssignments])

  // --- CONFLICT CHECKING HELPERS ---

  const isFacultyBusy = (day, time, excludeScheduleId = null) => {
    return allSchedules.some(s => 
      s.id !== excludeScheduleId &&
      s.section.facultyId === selectedFaculty?.profileId &&
      s.dayOfWeek === day &&
      isTimeInside(time, s.startTime, s.endTime)
    )
  }

  const isSectionBusy = (day, time, sectionId, excludeScheduleId = null) => {
    return allSchedules.some(s => 
      s.id !== excludeScheduleId &&
      s.section.sectionId === sectionId &&
      s.dayOfWeek === day &&
      isTimeInside(time, s.startTime, s.endTime)
    )
  }

  const isTimeInside = (timeStr, start, end) => {
    const time = new Date(`1970-01-01T${timeStr}:00Z`).getTime()
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    return time >= s && time < e
  }

  // --- DRAG AND DROP HANDLERS ---

  const handleDragStart = (e, data, type = 'new') => {
    setDraggedItem({ type, data })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e, day, time) => {
    e.preventDefault()
    if (!draggedItem) return

    const assignment = draggedItem.type === 'new' ? draggedItem.data : draggedItem.data.section;
    const excludeId = draggedItem.type === 'existing' ? draggedItem.data.id : null;

    // 1. Availability Check
    if (facultyAvailability.has(`${day}-${time}`)) return;

    // 2. Conflict Checks
    if (isFacultyBusy(day, time, excludeId)) return;
    if (isSectionBusy(day, time, assignment.sectionId, excludeId)) return;

    // Default 3 hours (could be dynamic based on units later)
    const durationHours = 3 
    const [h, m] = time.split(':').map(Number)
    const endH = h + durationHours
    
    // --- QA FIX: 9:00 PM BOUNDARY GUARD ---
    if (endH > 21 || (endH === 21 && m > 0)) {
        alert("Cannot schedule this course here. It would end after 9:00 PM.")
        return
    }

    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`

    setPendingPlacement({ day, startTime: time, endTime: endTimeStr })
    
    // --- MANDATORY ROOM FLOW ---
    // We ALWAYS open the modal now to ensure a room is picked and conflict-checked
    setIsLoadingRooms(true)
    setIsRoomModalOpen(true)
    
    const res = await getAvailableRooms(
        day, 
        new Date(`1970-01-01T${time}:00Z`), 
        new Date(`1970-01-01T${endTimeStr}:00Z`),
        activeTerm.semester,
        activeTerm.year
    )
    
    if (res.success) setAvailableRooms(res.rooms)
    setIsLoadingRooms(false)
  }

  const handleSaveSchedule = async (roomId) => {
    setIsSubmitting(true)
    setFormError(null)

    const assignment = draggedItem.type === 'new' ? draggedItem.data : draggedItem.data.section;

    const res = await createSectionSchedule({
      courseSectionId: assignment.id,
      roomId: roomId,
      dayOfWeek: pendingPlacement.day,
      startTime: new Date(`1970-01-01T${pendingPlacement.startTime}:00Z`),
      endTime: new Date(`1970-01-01T${pendingPlacement.endTime}:00Z`)
    })

    if (res.success) {
      if (draggedItem.type === 'existing') {
          await deleteSectionSchedule(draggedItem.data.id)
      }
      setIsRoomModalOpen(false)
      setDraggedItem(null)
      loadCoreData() 
      loadFacultyAssignments() 
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleDeleteSchedule = async (id) => {
    const res = await deleteSectionSchedule(id)
    if (res.success) {
        loadCoreData()
        loadFacultyAssignments()
    }
  }

  if (isLoadingSettings || isInitialLoading) {
    return (
      <AdminLayout title="Schedule Builder">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Schedule Builder">
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar: Pending */}
        <div className="w-[320px] border-r border-slate-200 bg-white flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">1. Select Instructor</h2>
            <select 
              className="w-full border-slate-200 rounded-md shadow-sm text-sm p-2.5 bg-white focus:ring-2 focus:ring-teal-500"
              value={selectedFaculty?.id || ""}
              onChange={(e) => setSelectedFaculty(facultyList.find(f => f.id === e.target.value))}
            >
              <option value="">Select Faculty...</option>
              {facultyList.map(f => (
                <option key={f.id} value={f.id}>{f.fullName}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedFaculty ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Users className="h-10 w-10 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400 italic">Please select an instructor to begin scheduling.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   2. Grab & Attach
                   <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px]">{assignments.length}</Badge>
                </h2>
                <div className="space-y-3">
                  {assignments.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50/50">
                      <CheckCircle2 className="h-6 w-6 text-teal-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 italic">Complete! All assigned courses are scheduled.</p>
                    </div>
                  ) : (
                    assignments.map(item => (
                      <div 
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item, 'new')}
                        className={`
                          p-4 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing group
                          ${draggedItem?.data?.id === item.id ? 'opacity-50 border-teal-300' : 'border-slate-100 bg-white hover:border-teal-200 hover:shadow-md'}
                        `}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="bg-teal-600 text-[10px]">{item.courseCode}</Badge>
                          <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-teal-400 transition-colors" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight mb-2">{item.courseTitle}</h3>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                          <span>{item.sectionCode}</span>
                          <span className="flex items-center gap-1 text-teal-700"><BookOpen className="h-3 w-3" /> {item.units} Units</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 bg-slate-50 overflow-auto p-6">
          {!selectedFaculty ? (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border-2 border-dashed border-slate-200">
               <CalendarIcon className="h-16 w-16 text-slate-100 mb-4" />
               <p className="text-slate-400 font-medium">Choose a faculty member from the sidebar to load the workspace.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <Avatar className="h-10 w-10 ring-2 ring-teal-500/20"><AvatarFallback className="bg-teal-100 text-teal-700 font-bold">{selectedFaculty.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                   <div>
                      <h2 className="text-lg font-bold text-slate-900 leading-tight">{selectedFaculty.fullName}</h2>
                      <p className="text-xs text-slate-500 font-medium">{activeTerm.semester} Semester {activeTerm.year}</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-slate-200 rounded-sm"></div> <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Available</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-200 diagonal-stripes rounded-sm"></div> <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Unavailable</span></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-[1000px]">
                <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-slate-50 border-b border-slate-200">
                   <div className="p-3 border-r border-slate-200 text-center font-bold text-slate-400 text-[10px] uppercase">Time</div>
                   {DAYS.map(day => (
                     <div key={day} className="p-3 border-r border-slate-200 text-center font-bold text-slate-900 text-sm">{day}</div>
                   ))}
                </div>

                <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto relative">
                   {TIME_SLOTS.map(time => (
                     <div key={time} className="grid grid-cols-[80px_repeat(6,1fr)] h-12 group">
                        <div className="p-2 border-r border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 bg-slate-50 group-hover:bg-slate-100 transition-colors">
                          {format12H(time)}
                        </div>
                        {DAYS.map(day => {
                          const isUnavailable = facultyAvailability.has(`${day}-${time}`)
                          const isBusy = isFacultyBusy(day, time, draggedItem?.type === 'existing' ? draggedItem.data.id : null)
                          const assignmentForConflict = draggedItem ? (draggedItem.type === 'new' ? draggedItem.data : draggedItem.data.section) : null;
                          const isSectionConflict = assignmentForConflict && isSectionBusy(day, time, assignmentForConflict.sectionId, draggedItem?.type === 'existing' ? draggedItem.data.id : null)
                          
                          const existingSched = allSchedules.find(s => 
                            s.section.facultyId === selectedFaculty.profileId &&
                            s.dayOfWeek === day &&
                            new Date(s.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) === time
                          )

                          return (
                            <div 
                              key={`${day}-${time}`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, day, time)}
                              className={`
                                border-r border-slate-100 relative transition-all duration-75
                                ${isUnavailable ? 'bg-slate-200 diagonal-stripes cursor-not-allowed' : 'bg-white'}
                                ${isSectionConflict && !isBusy ? 'bg-red-50 border-red-100' : ''}
                                ${!isUnavailable && !isBusy && !isSectionConflict && draggedItem ? 'hover:bg-teal-50 cursor-pointer border-teal-200 ring-inset hover:ring-2 hover:ring-teal-400' : ''}
                              `}
                            >
                               {existingSched && (
                                 <div 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, existingSched, 'existing')}
                                    className={`
                                        absolute inset-x-1 top-1 z-20 bg-[#115e59] text-white rounded-md shadow-lg p-2 flex flex-col group/block overflow-hidden cursor-grab active:cursor-grabbing
                                        ${draggedItem?.data?.id === existingSched.id ? 'opacity-20' : 'opacity-100'}
                                    `}
                                    style={{ height: `calc(${6 * 100}% - 8px)` }}
                                 >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-[9px] font-black uppercase opacity-70 tracking-widest">{existingSched.section.program}-{existingSched.section.sectionCode}</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(existingSched.id); }}
                                        className="opacity-0 group-hover/block:opacity-100 transition-opacity p-1 hover:bg-red-500 rounded"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <h4 className="font-bold text-xs leading-none mb-1">{existingSched.section.courseCode}</h4>
                                    <p className="text-[9px] opacity-80 leading-tight truncate mb-1">{existingSched.section.courseTitle}</p>
                                    <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-1">
                                      <div className="flex items-center gap-1 text-[8px] font-bold opacity-90">
                                        <MapPin className="h-2 w-2 text-teal-300" />
                                        {existingSched.room ? `${existingSched.room.building}-${existingSched.room.roomNumber}` : 'TBA'}
                                      </div>
                                      <div className="flex items-center gap-1 text-[8px] font-bold opacity-70">
                                        <Clock className="h-2 w-2" />
                                        {format12H(time)} - {format12H(new Date(existingSched.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }))}
                                      </div>
                                    </div>
                                 </div>
                               )}

                               {isSectionConflict && !isBusy && !isUnavailable && (
                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Badge variant="destructive" className="text-[8px] px-1 h-3.5 bg-red-500/80 border-none shadow-none uppercase font-black">Section Busy</Badge>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
           <Card className="w-full max-w-lg shadow-2xl border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <CardHeader className="bg-slate-50 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-black text-[#115e59]">Assign a Room</CardTitle>
                  <button onClick={() => { setIsRoomModalOpen(false); setDraggedItem(null); }} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-6 w-6" /></button>
                </div>
                <CardDescription>
                  Choose a location for <span className="font-bold text-slate-900">{draggedItem?.type === 'new' ? draggedItem.data.courseTitle : draggedItem?.data.section.courseTitle}</span>
                  <div className="flex items-center gap-4 mt-2 font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-md w-fit">
                    <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> {pendingPlacement?.day}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {pendingPlacement?.startTime} - {pendingPlacement?.endTime}</span>
                  </div>
                </CardDescription>
             </CardHeader>
             <CardContent className="p-6">
                {formError && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md text-xs font-bold text-red-600 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {formError}</div>}
                {isLoadingRooms ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Scanning Vacancies...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {availableRooms.map(room => (
                          <div 
                            key={room.id}
                            onClick={() => !isSubmitting && room.isAvailable && handleSaveSchedule(room.id)}
                            className={`
                              p-4 rounded-xl border-2 transition-all flex justify-between items-center group
                              ${room.isAvailable ? 'border-slate-100 hover:border-teal-500 bg-slate-50 hover:bg-teal-50 cursor-pointer' : 'opacity-40 grayscale cursor-not-allowed border-transparent bg-slate-100'}
                            `}
                          >
                             <div>
                               <h4 className="font-bold text-slate-900 group-hover:text-teal-700">{room.building} - {room.roomNumber}</h4>
                               <p className="text-xs text-slate-500 font-medium">{room.type} • Capacity: {room.capacity}</p>
                             </div>
                             {room.isAvailable ? <Badge className="bg-green-500 text-[10px] font-black uppercase">Vacant</Badge> : <Badge variant="outline" className="text-slate-400 border-slate-200 text-[10px] font-black uppercase">Occupied</Badge>}
                          </div>
                        ))}
                     </div>
                     <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <Button variant="ghost" onClick={() => handleSaveSchedule(null)} disabled={isSubmitting} className="text-xs font-bold text-slate-500 hover:text-teal-600">Schedule without Room</Button>
                     </div>
                  </div>
                )}
             </CardContent>
           </Card>
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
