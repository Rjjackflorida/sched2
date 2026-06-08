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
  Trash2, GripVertical, BookOpen, Settings, Info, Save,
  PanelLeftClose, PanelLeftOpen
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
  if (!time) return "TBA"
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayH = hour % 12 || 12
  return `${displayH}:${m} ${ampm}`
}

const formatPrismaTime = (date) => {
  if (!date) return "TBA"
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [draggedItem, setDraggedItem] = useState(null) // { type: 'new' | 'existing', data: Object }
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedScheduleForEdit, setSelectedScheduleForEdit] = useState(null)
  const [pendingPlacement, setPendingPlacement] = useState(null) 
  const [availableRooms, setAvailableRooms] = useState([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [scheduleToDelete, setScheduleToDelete] = useState(null)
  const [errorModalMessage, setErrorModalMessage] = useState(null)

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
    setFormError(null)

    const assignment = draggedItem.type === 'new' ? draggedItem.data : draggedItem.data.section;
    const excludeId = draggedItem.type === 'existing' ? draggedItem.data.id : null;

    // 1. Boundary Check: Institutional hours (Closing at 9:00 PM)
    const [h, m] = time.split(':').map(Number)
    const durationHours = draggedItem.type === 'new' ? assignment.units : draggedItem.data.section.course.units;
    const endH = h + durationHours
    
    if (endH > 21 || (endH === 21 && m > 0)) {
        setErrorModalMessage(`Cannot schedule this course here. A ${durationHours}-unit course starting at ${format12H(time)} would end after 9:00 PM.`)
        return
    }

    // 2. Availability Check (Flipped Logic)
    if (facultyAvailability.has(`${day}-${time}`)) {
        setErrorModalMessage(`${selectedFaculty.fullName} is marked as Unavailable at this time.`);
        return
    }

    // 3. Conflict Checks
    if (isFacultyBusy(day, time, excludeId)) {
        setErrorModalMessage(`${selectedFaculty.fullName} is already teaching another class at this time.`);
        return
    }
    if (isSectionBusy(day, time, assignment.sectionId, excludeId)) {
        setErrorModalMessage(`Student section is busy at this time.`);
        return
    }

    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    setPendingPlacement({ day, startTime: time, endTime: endTimeStr })
    
    // 4. Mandatory Room Flow: Always scan vacancies
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

    const assignmentId = draggedItem.type === 'new' ? draggedItem.data.id : draggedItem.data.sectionId;

    const res = await createSectionSchedule({
      courseSectionId: assignmentId,
      roomId: roomId,
      dayOfWeek: pendingPlacement.day,
      startTime: new Date(`1970-01-01T${pendingPlacement.startTime}:00Z`),
      endTime: new Date(`1970-01-01T${pendingPlacement.endTime}:00Z`)
    })

    if (res.success) {
      if (draggedItem.type === 'existing') await deleteSectionSchedule(draggedItem.data.id);
      setIsRoomModalOpen(false)
      setDraggedItem(null)
      loadCoreData() 
      loadFacultyAssignments() 
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleDeleteSchedule = (id) => {
    setScheduleToDelete(id)
  }

  const executeDeleteSchedule = async () => {
    setIsSubmitting(true)
    const res = await deleteSectionSchedule(scheduleToDelete)
    if (res.success) {
        setScheduleToDelete(null)
        if (isEditModalOpen) {
            setIsEditModalOpen(false)
            setSelectedScheduleForEdit(null)
        }
        loadCoreData()
        loadFacultyAssignments()
    } else {
        setErrorModalMessage(res.error || "Failed to delete schedule.")
    }
    setIsSubmitting(false)
  }

  const handleEditRoomSubmit = async (roomId) => {
    setIsSubmitting(true)
    const res = await createSectionSchedule({
        courseSectionId: selectedScheduleForEdit.sectionId,
        roomId: roomId,
        dayOfWeek: selectedScheduleForEdit.dayOfWeek,
        startTime: new Date(selectedScheduleForEdit.startTime),
        endTime: new Date(selectedScheduleForEdit.endTime)
    })
    if (res.success) {
        await deleteSectionSchedule(selectedScheduleForEdit.id)
        setIsEditModalOpen(false)
        setSelectedScheduleForEdit(null)
        loadCoreData()
    } else {
        setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  if (isLoadingSettings || isInitialLoading) {
    return (
      <AdminLayout title="Schedule Builder">
        <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 text-teal-600 animate-spin" /></div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Schedule Builder">
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-[320px]' : 'w-0 opacity-0 border-0'} border-r border-slate-200 bg-white flex flex-col overflow-hidden shrink-0 transition-all duration-300 ease-in-out`}>
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">1. Select Instructor</h2>
            <select className="w-full border-slate-200 rounded-md shadow-sm text-sm p-2.5 bg-white focus:ring-2 focus:ring-teal-500 font-bold" value={selectedFaculty?.id || ""} onChange={(e) => setSelectedFaculty(facultyList.find(f => f.id === e.target.value))}>
              <option value="">Select Faculty Member...</option>
              {facultyList.map(f => (<option key={f.id} value={f.id}>{f.fullName}</option>))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {!selectedFaculty ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 grayscale opacity-40"><Users className="h-12 w-12 text-slate-300 mb-2" /><p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Choose a faculty member</p></div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">2. Pending Assignments</h2>
                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-none font-black text-[10px]">{assignments.length}</Badge>
                </div>
                <div className="space-y-3">
                  {assignments.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl text-center bg-slate-50/30"><CheckCircle2 className="h-8 w-8 text-teal-500 mx-auto mb-3" /><p className="text-xs font-black text-slate-400 uppercase">All courses scheduled</p></div>
                  ) : (
                    assignments.map(item => (
                      <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, 'new')} className="p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-teal-500 hover:shadow-xl transition-all cursor-grab active:cursor-grabbing group">
                        <div className="flex justify-between items-start mb-2"><Badge className="bg-[#115e59] text-white text-[10px] px-2 py-0.5 shadow-sm font-black">{item.courseCode}</Badge><GripVertical className="h-4 w-4 text-slate-200 group-hover:text-teal-400" /></div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight mb-2">{item.courseTitle}</h3>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
                            <span className="text-slate-400">{item.programCode} {item.yearLevel}-{item.sectionName}</span>
                            <span className="flex items-center gap-1 text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100"><BookOpen className="h-3 w-3" /> {item.units} Units</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="flex-1 bg-slate-50 overflow-auto p-4 lg:p-6 custom-scrollbar relative flex flex-col">
          
          {/* Header Controls */}
          <div className="mb-4 flex items-center justify-between">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 text-slate-600 transition-all text-sm font-bold"
            >
              {isSidebarOpen ? <><PanelLeftClose className="h-4 w-4" /> Hide Assignments</> : <><PanelLeftOpen className="h-4 w-4" /> Show Assignments</>}
            </button>
          </div>

          {!selectedFaculty ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200"><CalendarIcon className="h-24 w-24 text-slate-50 mb-4" /><p className="text-slate-300 font-black uppercase tracking-widest text-lg">Load Faculty Workspace</p></div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="flex justify-between items-end bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 shrink-0">
                <div className="flex items-center gap-4"><Avatar className="h-14 w-14 ring-4 ring-teal-500/10 shadow-lg"><AvatarFallback className="bg-[#115e59] text-white font-black text-xl">{selectedFaculty.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar><div><p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] mb-1">Active Instructor</p><h2 className="text-2xl font-black text-slate-900 leading-none">{selectedFaculty.fullName}</h2></div></div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-4"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border-2 border-slate-200 rounded-full shadow-sm"></div> <span className="text-[10px] font-black text-slate-400 uppercase">Available</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 diagonal-stripes rounded-full shadow-sm"></div> <span className="text-[10px] font-black text-slate-400 uppercase">Unavailable</span></div></div>
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">{activeTerm.semester} Semester {activeTerm.year}</Badge>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0 min-w-[800px]">
                <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 shrink-0">
                   <div className="p-3 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest border-r border-slate-200">Timeline</div>
                   {DAYS.map(day => (<div key={day} className="p-3 text-center font-black text-slate-900 text-xs md:text-sm uppercase tracking-tighter border-r border-slate-200 last:border-0">{day}</div>))}
                </div>

                <div className="divide-y divide-slate-100 overflow-y-auto relative custom-scrollbar flex-1">
                   {TIME_SLOTS.map(time => (
                     <div key={time} className="grid grid-cols-[80px_repeat(6,1fr)] h-12 group">
                        <div className="p-2 border-r border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 bg-slate-50/50 group-hover:bg-slate-100 transition-colors uppercase">{format12H(time)}</div>
                        {DAYS.map(day => {
                          const isUnavailable = facultyAvailability.has(`${day}-${time}`)
                          const isBusy = isFacultyBusy(day, time, draggedItem?.type === 'existing' ? draggedItem.data.id : null)
                          const assignRef = draggedItem ? (draggedItem.type === 'new' ? draggedItem.data : draggedItem.data.section) : null;
                          const isSectionConflict = assignRef && isSectionBusy(day, time, assignRef.sectionId, draggedItem?.type === 'existing' ? draggedItem.data.id : null)
                          
                          const existingSched = allSchedules.find(s => 
                            s.section.facultyId === selectedFaculty.profileId &&
                            s.dayOfWeek === day &&
                            formatPrismaTime(s.startTime) === time
                          )

                          // --- DYNAMIC HEIGHT LOGIC ---
                          // 1 Unit = 1 Hour = 2 Slots (rows).
                          const units = existingSched?.section?.course?.units || 3;
                          const blockHeight = units * 2;

                          return (
                            <div key={`${day}-${time}`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, day, time)} className={`border-r border-slate-100 relative transition-all duration-150 ${isUnavailable ? 'bg-slate-200 diagonal-stripes cursor-not-allowed' : 'bg-white'} ${isSectionConflict && !isBusy ? 'bg-red-50 border-red-200' : ''} ${!isUnavailable && !isBusy && !isSectionConflict && draggedItem ? 'hover:bg-teal-50 cursor-pointer ring-inset hover:ring-2 hover:ring-teal-400 shadow-inner' : ''}`}>
                               {existingSched && (
                                 <div draggable onDragStart={(e) => handleDragStart(e, existingSched, 'existing')} className={`absolute inset-x-2 top-2 z-20 bg-[#115e59] text-white rounded-3xl shadow-2xl p-4 flex flex-col group/block overflow-hidden cursor-grab active:cursor-grabbing border border-teal-900/50 ring-4 ring-white/10 ${draggedItem?.data?.id === existingSched.id ? 'opacity-10 scale-95' : 'opacity-100'}`} style={{ height: `calc(${blockHeight * 100}% - 16px)` }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge className="bg-teal-900/50 text-teal-200 text-[10px] border-none font-black tracking-widest">{existingSched.section.course.code}</Badge>
                                        <div className="flex gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); setFormError(null); setSelectedScheduleForEdit(existingSched); setIsEditModalOpen(true); }} className="p-1.5 bg-teal-800/50 hover:bg-teal-700 rounded-xl transition-colors shadow-sm"><Settings className="h-3.5 w-3.5" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(existingSched.id); }} className="p-1.5 bg-red-900/40 hover:bg-red-600 rounded-xl transition-colors shadow-sm"><Trash2 className="h-3.5 w-3.5" /></button>
                                        </div>
                                    </div>
                                    <h4 className="font-black text-sm leading-tight mb-1 drop-shadow-sm">{existingSched.section.course.title}</h4>
                                    <p className="text-[10px] font-bold text-teal-200 opacity-80 uppercase tracking-widest mb-2">{existingSched.section.section.program.code} {existingSched.section.section.yearLevel}-{existingSched.section.section.name}</p>
                                    
                                    <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-white/10">
                                      <div className="flex items-center gap-2 text-[9px] font-black uppercase"><div className="bg-teal-400/20 p-1 rounded-lg"><MapPin className="h-3 w-3 text-teal-300" /></div>{existingSched.room ? (existingSched.room.building ? `${existingSched.room.building} - ${existingSched.room.roomNumber || existingSched.room.name}` : (existingSched.room.roomNumber || existingSched.room.name)) : 'Room Pending'}</div>
                                      <div className="flex items-center gap-2 text-[9px] font-bold opacity-60"><div className="bg-white/5 p-1 rounded-lg"><Clock className="h-3 w-3" /></div>{format12H(time)} - {formatPrismaTime(existingSched.endTime)}</div>
                                    </div>
                                 </div>
                               )}
                               {isSectionConflict && !isBusy && !isUnavailable && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-pulse"><Badge variant="destructive" className="text-[10px] px-2 h-5 bg-red-600 border-none shadow-xl uppercase font-black tracking-widest">Section Busy</Badge></div>)}
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

      {/* Unified Action Modal (Room & Edit) */}
      {(isRoomModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
           <Card className="w-full max-w-lg shadow-2xl border-0 overflow-hidden animate-in zoom-in-95 duration-200 rounded-3xl">
             <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3"><div className="bg-[#115e59] p-2.5 rounded-xl shadow-md"><Info className="h-5 w-5 text-white" /></div><h3 className="font-bold text-xl text-slate-900">{isEditModalOpen ? "Manage Schedule" : "Finalize Assignment"}</h3></div>
                <button onClick={() => { setIsRoomModalOpen(false); setIsEditModalOpen(false); setDraggedItem(null); setSelectedScheduleForEdit(null); setFormError(null); }} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X className="h-5 w-5 text-slate-400" /></button>
             </div>
             <div className="p-6">
                <div className="mb-6 p-6 bg-teal-50 rounded-2xl border border-teal-100 relative overflow-hidden group/target">
                  <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-5"><BookOpen className="h-24 w-24" /></div>
                  <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-widest mb-2">Target Schedule Details</p>
                  <h4 className="font-bold text-slate-900 text-lg leading-tight mb-3">{isEditModalOpen ? selectedScheduleForEdit?.section.courseTitle : (draggedItem?.type === 'new' ? draggedItem.data.courseTitle : draggedItem?.data.section.course.title)}</h4>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
                    <span className="bg-[#115e59] text-white px-3 py-1 rounded-lg shadow-sm">{isEditModalOpen ? `${selectedScheduleForEdit?.section.section.program.code} ${selectedScheduleForEdit?.section.section.yearLevel}-${selectedScheduleForEdit?.section.section.name}` : (draggedItem?.type === 'new' ? `${draggedItem.data.programCode} ${draggedItem.data.sectionCode}` : `${draggedItem.data.section.section.program.code} ${draggedItem.data.section.section.yearLevel}-${draggedItem.data.section.section.name}`)}</span>
                    <span className="flex items-center gap-1.5 text-slate-600 bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100"><CalendarIcon className="h-3 w-3 text-teal-600" /> {isEditModalOpen ? selectedScheduleForEdit?.dayOfWeek : pendingPlacement?.day}</span>
                    <span className="flex items-center gap-1.5 text-slate-600 bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100"><Clock className="h-3 w-3 text-teal-600" /> {isEditModalOpen ? `${formatPrismaTime(selectedScheduleForEdit?.startTime)} - ${formatPrismaTime(selectedScheduleForEdit?.endTime)}` : `${pendingPlacement?.startTime} - ${pendingPlacement?.endTime}`}</span>
                  </div>
                </div>

                {formError && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {formError}</div>}
                
                {isLoadingRooms ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3"><Loader2 className="h-8 w-8 text-teal-600 animate-spin" /><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Scanning Building Vacancies...</p></div>
                ) : (
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Available Learning Spaces</p>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-semibold text-[10px] uppercase">{availableRooms.length} Found</Badge>
                     </div>
                     <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {availableRooms.map(room => (
                          <div key={room.id} onClick={() => !isSubmitting && room.isAvailable && (isEditModalOpen ? handleEditRoomSubmit(room.id) : handleSaveSchedule(room.id))} className={`p-4 rounded-xl border-2 transition-all flex justify-between items-center group ${room.isAvailable ? 'border-slate-100 hover:border-teal-500 bg-white hover:bg-teal-50/50 cursor-pointer shadow-sm hover:shadow-md' : 'opacity-50 cursor-not-allowed border-transparent bg-slate-50'}`}>
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${room.isAvailable ? 'bg-teal-50 text-teal-600 group-hover:bg-[#115e59] group-hover:text-white' : 'bg-slate-200 text-slate-400'} transition-colors`}><MapPin className="h-5 w-5" /></div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm uppercase group-hover:text-[#115e59]">{room.building ? `${room.building} - ${room.roomNumber || room.name}` : (room.roomNumber || room.name)}</h4>
                                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{room.type} • Capacity: {room.capacity}</p>
                                </div>
                             </div>
                             {room.isAvailable ? <Badge className="bg-teal-600 text-[10px] font-semibold uppercase rounded-md px-2 py-0.5">Select</Badge> : <Badge variant="outline" className="text-slate-400 border-slate-200 text-[10px] font-semibold uppercase rounded-md px-2 py-0.5">Occupied</Badge>}
                          </div>
                        ))}
                     </div>
                     <div className="pt-6 mt-4 border-t border-slate-100 flex justify-between items-center">
                        <Button variant="ghost" onClick={() => isEditModalOpen ? handleDeleteSchedule(selectedScheduleForEdit.id) : handleSaveSchedule(null)} className="text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl px-4 flex gap-2"><Trash2 className="h-4 w-4" /> {isEditModalOpen ? "Delete Schedule" : "Skip Location"}</Button>
                        <Button disabled={isSubmitting} className="bg-[#115e59] text-white hover:bg-teal-900 px-6 rounded-xl font-semibold text-xs transition-colors">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Finalize</Button>
                     </div>
                  </div>
                )}
             </div>
           </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {scheduleToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[200] p-4 animate-in fade-in-50 duration-200">
          <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden animate-in zoom-in-95 duration-200 rounded-3xl">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="bg-red-50 text-red-600 p-4 rounded-full mb-6">
                <Trash2 className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-2xl text-slate-900 mb-2">Delete Assignment</h3>
              <p className="text-slate-500 mb-8 text-sm">
                Are you sure you want to remove this block? It will return to the 'Pending' list.
              </p>
              <div className="flex w-full gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setScheduleToDelete(null)}
                  className="flex-1 rounded-xl h-12 font-bold text-slate-600"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={executeDeleteSchedule}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-bold shadow-md shadow-red-600/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Delete"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Error/Conflict Modal */}
      {errorModalMessage && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[300] p-4 animate-in fade-in-50 duration-200">
          <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden animate-in zoom-in-95 duration-200 rounded-3xl">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="bg-orange-50 text-orange-600 p-4 rounded-full mb-6">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-2xl text-slate-900 mb-2">Scheduling Conflict</h3>
              <p className="text-slate-600 mb-8 text-sm font-medium">
                {errorModalMessage}
              </p>
              <div className="flex w-full gap-3">
                <Button 
                  onClick={() => setErrorModalMessage(null)}
                  className="w-full bg-[#115e59] hover:bg-teal-900 text-white rounded-xl h-12 font-bold shadow-md shadow-teal-900/20"
                >
                  Okay, got it
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <style jsx>{`
        .diagonal-stripes { background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; border: 2px solid white; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </AdminLayout>
  )
}
