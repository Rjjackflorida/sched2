"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, Monitor, Library, Search, Plus, X, Loader2, Building2, 
  Users, BookOpen, Edit2, Trash2, AlertCircle, Briefcase, 
  BarChart3, Clock, UserCheck, Building, Calendar as CalendarIcon, Save 
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getRooms, createRoom, updateRoom, deleteRoom } from "@/app/actions/room"
import { getCourses, createCourse, updateCourse, deleteCourse } from "@/app/actions/course"
import { getCourseSections, createCourseSection, updateCourseSection, deleteCourseSection } from "@/app/actions/section"
import { getFacultyRoster, updateFacultyProfile, deleteFacultyProfile } from "@/app/actions/faculty"
import { getPrograms, createProgram, createSection, deleteProgram, deleteSection } from "@/app/actions/program"
import { getSystemSettings } from "@/app/actions/settings"

/**
 * Shared Constant Data
 */
const ROOM_TYPES = [
  { label: "Computer Laboratory", capacity: 40 },
  { label: "Research Laboratory", capacity: 40 },
  { label: "AVR (Audio-Visual Room)", capacity: 60 },
  { label: "MPH (Multi-Purpose Hall)", capacity: 100 },
  { label: "Normal Room", capacity: 50 },
]

const BUILDINGS = [
  "Main Building",
  "BS Hospitality Management Building"
]

export default function ResourceManagementPage() {
  const [activeTab, setActiveTab] = useState("rooms")
  const [rooms, setRooms] = useState([])
  const [courses, setCourses] = useState([])
  const [roster, setRoster] = useState([])
  const [assignments, setAssignments] = useState([])
  const [programs, setPrograms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [facultySemester, setFacultySemester] = useState("1st")
  const [facultyAcademicYear, setFacultyAcademicYear] = useState("2024")

  // --- MODAL VISIBILITY STATES ---
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false)
  const [isEditFacultyModalOpen, setIsEditFacultyModalOpen] = useState(false)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [isEditAssignmentModalOpen, setIsEditAssignmentModalOpen] = useState(false)
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false)
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)

  // --- Global Delete Confirmation Modal State ---
  const [deleteTarget, setDeleteTarget] = useState(null) // { type: string, id: string, name: string, subId?: string }

  // --- FORM DATA STATES ---
  const [roomFormData, setRoomFormData] = useState({ name: "", type: "", building: "", roomNumber: "", capacity: "" })
  const [editRoomFormData, setEditRoomFormData] = useState({ id: "", name: "", type: "", building: "", roomNumber: "", capacity: "" })
  const [courseFormData, setCourseFormData] = useState({ title: "", description: "", units: 3 })
  const [editCourseFormData, setEditCourseFormData] = useState({ id: "", title: "", description: "", units: 3 })
  const [facultyFormData, setFacultyFormData] = useState({ employmentType: "full_time", maxUnitsPerSem: 18 })
  const [assignmentFormData, setAssignmentFormData] = useState({ courseId: "", sectionId: "", facultyId: "", semester: "1st", academicYear: "2024", maxStudents: 40 })
  const [editAssignmentFormData, setEditAssignmentFormData] = useState({ id: "", courseId: "", sectionId: "", facultyId: "", semester: "1st", academicYear: "2024", maxStudents: 40 })
  const [programFormData, setProgramFormData] = useState({ code: "", name: "" })
  const [sectionFormData, setSectionFormData] = useState({ yearLevel: "1", name: "", programId: "" })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      const settingsRes = await getSystemSettings()
      if (settingsRes.success && settingsRes.settings) {
        setFacultySemester(settingsRes.settings.activeSemester)
        setFacultyAcademicYear(settingsRes.settings.activeAcademicYear.toString())
        
        // Initialize form data with global settings
        setAssignmentFormData(prev => ({
          ...prev,
          semester: settingsRes.settings.activeSemester,
          academicYear: settingsRes.settings.activeAcademicYear.toString()
        }))
        setEditAssignmentFormData(prev => ({
          ...prev,
          semester: settingsRes.settings.activeSemester,
          academicYear: settingsRes.settings.activeAcademicYear.toString()
        }))

        // Load data with the active settings
        const [roomsRes, coursesRes, assignRes, rosterRes, programsRes] = await Promise.all([
          getRooms(),
          getCourses(),
          getCourseSections(),
          getFacultyRoster(settingsRes.settings.activeSemester, settingsRes.settings.activeAcademicYear.toString()),
          getPrograms()
        ])
        
        if (roomsRes.success) setRooms(roomsRes.rooms)
        if (coursesRes.success) setCourses(coursesRes.courses)
        if (assignRes.success) setAssignments(assignRes.sections)
        if (rosterRes.success) setRoster(rosterRes.roster)
        if (programsRes.success) setPrograms(programsRes.programs)
      } else {
        await loadAllData()
      }
      setIsLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (activeTab === "faculty") refreshFaculty()
  }, [facultySemester, facultyAcademicYear, activeTab])

  const loadAllData = async () => {
    setIsLoading(true)
    const [roomsRes, coursesRes, assignRes, rosterRes, programsRes] = await Promise.all([
      getRooms(),
      getCourses(),
      getCourseSections(),
      getFacultyRoster(facultySemester, facultyAcademicYear),
      getPrograms()
    ])
    
    if (roomsRes.success) setRooms(roomsRes.rooms)
    if (coursesRes.success) setCourses(coursesRes.courses)
    if (assignRes.success) setAssignments(assignRes.sections)
    if (rosterRes.success) setRoster(rosterRes.roster)
    if (programsRes.success) setPrograms(programsRes.programs)
    setIsLoading(false)
  }

  const refreshFaculty = async () => {
    const res = await getFacultyRoster(facultySemester, facultyAcademicYear)
    if (res.success) setRoster(res.roster)
  }

  const refreshAssignments = async () => {
    const res = await getCourseSections()
    if (res.success) setAssignments(res.sections)
  }

  const refreshPrograms = async () => {
    const res = await getPrograms()
    if (res.success) setPrograms(res.programs)
  }

  // --- HANDLERS ---
  const handleRoomTypeChange = (e, isEdit = false) => {
    const type = ROOM_TYPES.find(t => t.label === e.target.value)
    if (isEdit) {
      setEditRoomFormData({ ...editRoomFormData, type: e.target.value, capacity: type?.capacity || "" })
    } else {
      setRoomFormData({ ...roomFormData, type: e.target.value, capacity: type?.capacity || "" })
    }
  }

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await createRoom(roomFormData)
    if (res.success) {
      setRooms([...rooms, res.room])
      setIsRoomModalOpen(false)
      setRoomFormData({ name: "", type: "", building: "", roomNumber: "", capacity: "" })
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleEditRoomClick = (room) => {
    setSelectedRoom(room)
    setEditRoomFormData({
      id: room.id,
      type: room.type,
      building: room.building,
      roomNumber: room.roomNumber || "",
      capacity: room.capacity
    })
    setIsEditRoomModalOpen(true)
  }

  const handleUpdateRoomSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await updateRoom(editRoomFormData.id, editRoomFormData)
    if (res.success) {
      setRooms(rooms.map(r => r.id === res.room.id ? res.room : r))
      setIsEditRoomModalOpen(false)
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleAddCourseSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await createCourse(courseFormData)
    if (res.success) {
      setCourses([...courses, res.course])
      setIsCourseModalOpen(false)
      setCourseFormData({ title: "", description: "", units: 3 })
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleEditCourseClick = (course) => {
    setSelectedCourse(course)
    setEditCourseFormData({
      id: course.id,
      title: course.title,
      description: course.description || "",
      units: course.units
    })
    setIsEditCourseModalOpen(true)
  }

  const handleUpdateCourseSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await updateCourse(editCourseFormData.id, editCourseFormData)
    if (res.success) {
      setCourses(courses.map(c => c.id === res.course.id ? res.course : c))
      setIsEditCourseModalOpen(false)
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleEditFacultyClick = (faculty) => {
    setEditingFaculty(faculty)
    setFacultyFormData({
      employmentType: faculty.employmentType === "not assigned yet" ? "full_time" : faculty.employmentType,
      maxUnitsPerSem: faculty.workload.max || 18
    })
    setIsEditFacultyModalOpen(true)
  }

  const handleFacultyEmploymentChange = (e) => {
    const type = e.target.value
    const maxUnits = type === "full_time" ? 18 : 12
    setFacultyFormData({ employmentType: type, maxUnitsPerSem: maxUnits })
  }

  const handleFacultyFormSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await updateFacultyProfile(editingFaculty.id, facultyFormData)
    if (res.success) {
      refreshFaculty()
      setIsEditFacultyModalOpen(false)
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleAddAssignmentSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await createCourseSection(assignmentFormData)
    if (res.success) {
      await refreshAssignments()
      setIsAssignmentModalOpen(false)
      refreshFaculty()
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleEditAssignmentClick = (section) => {
    setSelectedAssignment(section)
    setEditAssignmentFormData({
      id: section.id,
      courseId: section.courseId,
      sectionId: section.sectionId,
      facultyId: section.facultyId || "",
      semester: section.semester,
      academicYear: section.academicYear.toString(),
      maxStudents: section.maxStudents
    })
    setIsEditAssignmentModalOpen(true)
  }

  const handleUpdateAssignmentSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await updateCourseSection(editAssignmentFormData.id, editAssignmentFormData)
    if (res.success) {
      await refreshAssignments()
      setIsEditAssignmentModalOpen(false)
      refreshFaculty()
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleAddProgramSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await createProgram(programFormData)
    if (res.success) {
      await refreshPrograms()
      setIsProgramModalOpen(false)
      setProgramFormData({ code: "", name: "" })
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleAddSectionClick = (programId) => {
    setSectionFormData({ ...sectionFormData, programId })
    setIsSectionModalOpen(true)
  }

  const handleAddSectionSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await createSection(sectionFormData)
    if (res.success) {
      await refreshPrograms()
      setIsSectionModalOpen(false)
      setSectionFormData({ yearLevel: "1", name: "", programId: "" })
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const executeDeletion = async () => {
    if (!deleteTarget) return
    setIsSubmitting(true)
    setFormError(null)

    let res
    const { type, id, subId } = deleteTarget

    if (type === "room") res = await deleteRoom(id)
    if (type === "course") res = await deleteCourse(id)
    if (type === "faculty") res = await deleteFacultyProfile(id)
    if (type === "assignment") res = await deleteCourseSection(id)
    if (type === "program") res = await deleteProgram(id)
    if (type === "section") res = await deleteSection(id)

    if (res.success) {
      if (type === "room") setRooms(rooms.filter(r => r.id !== id))
      if (type === "course") setCourses(courses.filter(c => c.id !== id))
      if (type === "faculty") refreshFaculty()
      if (type === "assignment") {
        setAssignments(assignments.filter(a => a.id !== id))
        refreshFaculty()
      }
      if (type === "program") setPrograms(programs.filter(p => p.id !== id))
      if (type === "section") {
        setPrograms(programs.map(p => p.id === subId ? { ...p, sections: p.sections.filter(s => s.id !== id) } : p))
      }
      setDeleteTarget(null)
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  return (
    <AdminLayout title="Resource Management">
      <div className="flex-1 overflow-auto p-6 lg:p-8 relative">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Resource Management</h2>
              <p className="text-slate-500 mt-1">Manage the core building blocks of your university schedule.</p>
            </div>
            
            <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
              <button 
                onClick={() => setActiveTab("rooms")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'rooms' ? 'bg-[#115e59] text-white shadow-lg shadow-teal-900/20' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <MapPin className="h-4 w-4" /> Rooms
              </button>
              <button 
                onClick={() => setActiveTab("courses")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'courses' ? 'bg-[#115e59] text-white shadow-lg shadow-teal-900/20' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <BookOpen className="h-4 w-4" /> Courses
              </button>
              <button 
                onClick={() => setActiveTab("faculty")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'faculty' ? 'bg-[#115e59] text-white shadow-lg shadow-teal-900/20' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Users className="h-4 w-4" /> Faculty
              </button>
              <button 
                onClick={() => setActiveTab("assignments")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'assignments' ? 'bg-[#115e59] text-white shadow-lg shadow-teal-900/20' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Briefcase className="h-4 w-4" /> Assignments
              </button>
              <button 
                onClick={() => setActiveTab("programs")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'programs' ? 'bg-[#115e59] text-white shadow-lg shadow-teal-900/20' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Library className="h-4 w-4" /> Programs
              </button>
            </div>
          </div>

          {/* Sub-Header with Search & Add Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab}...`} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm"
                />
             </div>

             <div className="flex items-center gap-3 w-full sm:w-auto">
                {activeTab === "faculty" && (
                   <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                      <select 
                        value={facultySemester} 
                        onChange={(e) => setFacultySemester(e.target.value)}
                        className="text-xs font-semibold text-slate-600 focus:outline-none bg-transparent"
                      >
                         <option value="1st">1st Sem</option>
                         <option value="2nd">2nd Sem</option>
                         <option value="Summer">Summer</option>
                      </select>
                      <div className="h-4 w-px bg-slate-200"></div>
                      <select 
                        value={facultyAcademicYear} 
                        onChange={(e) => setFacultyAcademicYear(e.target.value)}
                        className="text-xs font-semibold text-slate-600 focus:outline-none bg-transparent"
                      >
                         <option value="2024">2024-2025</option>
                         <option value="2025">2025-2026</option>
                      </select>
                   </div>
                )}
                <Button 
                  onClick={() => {
                    if (activeTab === "rooms") setIsRoomModalOpen(true)
                    if (activeTab === "courses") setIsCourseModalOpen(true)
                    if (activeTab === "assignments") setIsAssignmentModalOpen(true)
                    if (activeTab === "programs") setIsProgramModalOpen(true)
                    setFormError(null)
                  }}
                  className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 w-full sm:w-auto px-6 h-11 rounded-xl font-semibold"
                  disabled={activeTab === "faculty"}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add {activeTab.slice(0, -1)}
                </Button>
             </div>
          </div>

          {/* Main Content Area */}
          <Card className="border-slate-200 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardContent className="p-0">
               {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-3">
                     <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
                     <p className="text-slate-400 font-semibold uppercase tracking-widest text-xs">Synchronizing Data...</p>
                  </div>
               ) : (
                 <div className="overflow-x-auto">
                    {activeTab === "rooms" && (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-widest">
                          <tr>
                            <th className="px-6 py-4">Room Name</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Building</th>
                            <th className="px-6 py-4">Capacity</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map(room => (
                            <tr key={room.id} className="hover:bg-slate-50/80 transition-colors bg-white/40">
                              <td className="px-6 py-4 font-bold text-slate-900 font-mono">{room.name}</td>
                              <td className="px-6 py-4 text-slate-600 font-medium">{room.type}</td>
                              <td className="px-6 py-4 text-slate-500 text-sm font-medium"><Building2 className="h-3.5 w-3.5 inline mr-1.5 opacity-50" /> {room.building}</td>
                              <td className="px-6 py-4">
                                <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-100 font-semibold">{room.capacity} Pax</Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => handleEditRoomClick(room)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"><Edit2 className="h-4 w-4" /></button>
                                  <button onClick={() => setDeleteTarget({ type: 'room', id: room.id, name: room.name })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {activeTab === "courses" && (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-widest">
                          <tr>
                            <th className="px-6 py-4">Code</th>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Units</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {courses.filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase()) || c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(course => (
                            <tr key={course.id} className="hover:bg-slate-50/80 transition-colors bg-white/40">
                              <td className="px-6 py-4 font-bold text-teal-700 font-mono">{course.code}</td>
                              <td className="px-6 py-4 font-semibold text-slate-900">{course.title}</td>
                              <td className="px-6 py-4">
                                 <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-semibold">{course.units} UNITS</Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => handleEditCourseClick(course)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"><Edit2 className="h-4 w-4" /></button>
                                  <button onClick={() => setDeleteTarget({ type: 'course', id: course.id, name: course.title })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {activeTab === "faculty" && (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-widest">
                          <tr>
                            <th className="px-6 py-4">Faculty Member</th>
                            <th className="px-6 py-4">Employment</th>
                            <th className="px-6 py-4">Workload ({facultySemester})</th>
                            <th className="px-6 py-4">Availability</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {roster.filter(f => f.fullName.toLowerCase().includes(searchQuery.toLowerCase())).map(f => (
                            <tr key={f.id} className="hover:bg-slate-50/80 transition-colors bg-white/40">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                    <AvatarFallback className="bg-teal-100 text-teal-700 font-semibold text-xs">{f.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold text-slate-900 text-sm">{f.fullName}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter">{f.employeeId}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                 <Badge variant="outline" className="capitalize text-[10px] font-semibold tracking-tight">{f.employmentType.replace('_', ' ')}</Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1.5 w-32">
                                  <div className="flex justify-between text-[10px] font-semibold uppercase tracking-tighter">
                                    <span className={f.workload.current > (f.workload.max || 0) ? "text-red-600" : "text-slate-400"}>{f.workload.current} Units</span>
                                    <span className="text-slate-300">/ {f.workload.max || '??'}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                     <div 
                                      className={`h-full transition-all duration-500 ${f.workload.current > (f.workload.max || 0) ? 'bg-red-500' : 'bg-teal-500'}`} 
                                      style={{ width: `${Math.min((f.workload.current / (f.workload.max || 1)) * 100, 100)}%` }}
                                     />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                 <Badge className={`text-[10px] font-semibold uppercase border-none ${f.availabilityStatus === 'Submitted' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                    {f.availabilityStatus}
                                 </Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => handleEditFacultyClick(f)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"><Edit2 className="h-4 w-4" /></button>
                                  <button onClick={() => setDeleteTarget({ type: 'faculty', id: f.id, name: f.fullName })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {activeTab === "assignments" && (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-widest">
                          <tr>
                            <th className="px-6 py-4">Course</th>
                            <th className="px-6 py-4">Program & Section</th>
                            <th className="px-6 py-4">Assigned Instructor</th>
                            <th className="px-6 py-4">Term</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {assignments.filter(a => 
                            (a.courseCode?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
                            (a.courseTitle?.toLowerCase() || "").includes(searchQuery.toLowerCase())
                          ).map(section => (
                            <tr key={section.id} className="hover:bg-slate-50/80 transition-colors bg-white/40">
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900 text-sm leading-tight">{section.courseCode}</p>
                                <p className="text-[10px] text-slate-500 font-semibold uppercase truncate max-w-[200px]">{section.courseTitle}</p>
                              </td>
                              <td className="px-6 py-4 font-bold text-teal-700 font-mono tracking-tighter">
                                {section.programCode} {section.yearLevel}-{section.sectionName}
                              </td>
                              <td className="px-6 py-4">
                                {section.facultyName ? (
                                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                                    {section.facultyName}
                                  </div>
                                ) : (
                                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest italic">Unassigned</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                 <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 text-slate-500">{section.semester} Sem {section.academicYear}</Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => handleEditAssignmentClick(section)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"><Edit2 className="h-4 w-4" /></button>
                                  <button onClick={() => setDeleteTarget({ type: 'assignment', id: section.id, name: `${section.courseCode} for ${section.programCode} ${section.yearLevel}-{section.sectionName}` })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {activeTab === "programs" && (
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {programs.map(program => (
                          <div key={program.id} className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-teal-500 hover:shadow-2xl hover:shadow-teal-900/5 transition-all">
                             <div className="flex justify-between items-start mb-4">
                                <Badge className="bg-[#115e59] text-white font-semibold px-3 py-1">{program.code}</Badge>
                                <button onClick={() => setDeleteTarget({ type: 'program', id: program.id, name: program.code })} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-600 transition-all"><Trash2 className="h-4 w-4" /></button>
                             </div>
                             <h3 className="font-bold text-slate-900 leading-tight mb-4">{program.name}</h3>
                             <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">Sections <Badge variant="secondary" className="h-4 px-1 text-[9px]">{program.sections.length}</Badge></p>
                                <div className="flex flex-wrap gap-1.5">
                                   {program.sections.map(s => (
                                     <div key={s.id} className="group/sec flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white hover:border-teal-200 transition-all">
                                        {s.yearLevel}-{s.name}
                                        <button onClick={() => setDeleteTarget({ type: 'section', id: s.id, name: `${program.code} ${s.yearLevel}-${s.name}`, subId: program.id })} className="opacity-0 group-hover/sec:opacity-100 text-slate-300 hover:text-red-500 transition-all"><X className="h-3 w-3" /></button>
                                     </div>
                                   ))}
                                   <button 
                                    onClick={() => handleAddSectionClick(program.id)}
                                    className="px-2 py-1 border border-dashed border-slate-300 rounded-lg text-[10px] font-semibold text-slate-400 hover:border-teal-500 hover:text-teal-600 transition-all"
                                   >+ NEW</button>
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add Program Modal */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 text-teal-700 rounded-md">
                  <Library className="h-4 w-4" />
                </div>
                <h3 className="font-bold">Add New Program</h3>
              </div>
              <button onClick={() => setIsProgramModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddProgramSubmit} className="p-6 space-y-5">
              {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-in slide-in-from-top-1">{formError}</div>}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5" /> Program Code *
                </label>
                <input required value={programFormData.code} onChange={e => setProgramFormData({...programFormData, code: e.target.value})} placeholder="e.g. BSIT" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 uppercase transition-all shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5" /> Program Name *
                </label>
                <input required value={programFormData.name} onChange={e => setProgramFormData({...programFormData, name: e.target.value})} placeholder="e.g. Bachelor of Science in Information Technology" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm" />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsProgramModalOpen(false)} disabled={isSubmitting} className="text-slate-500 hover:bg-slate-50">Cancel</Button>
                <Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-6 font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Program"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 text-teal-700 rounded-md">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="font-bold">Add New Section</h3>
              </div>
              <button onClick={() => setIsSectionModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddSectionSubmit} className="p-6 space-y-5">
              {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-in slide-in-from-top-1">{formError}</div>}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" /> Year Level *
                </label>
                <input type="number" min="1" max="5" required value={sectionFormData.yearLevel} onChange={e => setSectionFormData({...sectionFormData, yearLevel: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Section Block *
                </label>
                <input required value={sectionFormData.name} onChange={e => setSectionFormData({...sectionFormData, name: e.target.value})} placeholder="e.g. A" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 uppercase transition-all shadow-sm" />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsSectionModalOpen(false)} disabled={isSubmitting} className="text-slate-500 hover:bg-slate-50">Cancel</Button>
                <Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-6 font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Section"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 text-teal-700 rounded-md">
                  <MapPin className="h-4 w-4" />
                </div>
                <h3 className="font-bold">Add New Room</h3>
              </div>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddRoomSubmit} className="p-6 space-y-5">
              {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-in slide-in-from-top-1">{formError}</div>}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5" /> Room Type *
                </label>
                <select required value={roomFormData.type} onChange={(e) => handleRoomTypeChange(e)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm bg-white">
                  <option value="">Select Room Type</option>
                  {ROOM_TYPES.map(t => <option key={t.label} value={t.label}>{t.label} ({t.capacity} cap.)</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Capacity
                </label>
                <input type="text" readOnly value={roomFormData.capacity} placeholder="Auto-calculated" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-bold shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Building className="h-3.5 w-3.5" /> Building *
                </label>
                <select required value={roomFormData.building} onChange={(e) => setRoomFormData({...roomFormData, building: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm bg-white">
                  <option value="">Select Building</option>
                  {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Room Number *
                </label>
                <input type="number" required max="99999" value={roomFormData.roomNumber} onChange={(e) => setRoomFormData({...roomFormData, roomNumber: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm" />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsRoomModalOpen(false)} disabled={isSubmitting} className="text-slate-500 hover:bg-slate-50">Cancel</Button>
                <Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-6 font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Room"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {isEditRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 text-teal-700 rounded-md">
                  <Edit2 className="h-4 w-4" />
                </div>
                <h3 className="font-bold">Edit Room</h3>
              </div>
              <button onClick={() => setIsEditRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleUpdateRoomSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-in slide-in-from-top-1">
                  {formError}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Room Name (Preview)
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-teal-700 font-bold font-mono shadow-inner">
                  {selectedRoom?.name}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5" /> Room Type *
                </label>
                <select 
                  required 
                  value={editRoomFormData.type} 
                  onChange={(e) => handleRoomTypeChange(e, true)} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white shadow-sm"
                >
                  {ROOM_TYPES.map(t => (
                    <option key={t.label} value={t.label}>{t.label} ({t.capacity} cap.)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Building className="h-3.5 w-3.5" /> Building *
                </label>
                <select 
                  required 
                  value={editRoomFormData.building} 
                  onChange={(e) => setEditRoomFormData({...editRoomFormData, building: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white shadow-sm"
                >
                  <option value="">Select Building</option>
                  {BUILDINGS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Room Number *
                </label>
                <input 
                  type="number" 
                  required 
                  max="99999" 
                  value={editRoomFormData.roomNumber} 
                  onChange={(e) => setEditRoomFormData({...editRoomFormData, roomNumber: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm" 
                />
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsEditRoomModalOpen(false)} 
                  disabled={isSubmitting} 
                  className="text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-6 font-semibold" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 text-teal-700 rounded-md">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h3 className="font-bold">Add New Course</h3>
              </div>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddCourseSubmit} className="p-6 space-y-5">
              {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-in slide-in-from-top-1">{formError}</div>}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Library className="h-3.5 w-3.5" /> Course Title *
                </label>
                <input type="text" required value={courseFormData.title} onChange={(e) => setCourseFormData({...courseFormData, title: e.target.value})} placeholder="e.g. Computer Programming 1" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Edit2 className="h-3.5 w-3.5" /> Description
                </label>
                <textarea value={courseFormData.description} onChange={(e) => setCourseFormData({...courseFormData, description: e.target.value})} placeholder="Optional description..." rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" /> Units *
                </label>
                <input type="number" required min="1" max="6" value={courseFormData.units} onChange={(e) => setCourseFormData({...courseFormData, units: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm" />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsCourseModalOpen(false)} disabled={isSubmitting} className="text-slate-500 hover:bg-slate-50">Cancel</Button>
                <Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-6 font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Course"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {isEditCourseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 text-teal-700 rounded-md">
                  <Edit2 className="h-4 w-4" />
                </div>
                <h3 className="font-bold">Edit Course</h3>
              </div>
              <button onClick={() => setIsEditCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleUpdateCourseSubmit} className="p-6 space-y-5">
              {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-in slide-in-from-top-1">{formError}</div>}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Course Code
                </label>
                <input type="text" readOnly value={selectedCourse?.code} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-mono font-bold shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5" /> Course Title *
                </label>
                <input type="text" required value={editCourseFormData.title} onChange={(e) => setEditCourseFormData({...editCourseFormData, title: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" /> Units *
                </label>
                <input type="number" required min="1" max="6" value={editCourseFormData.units} onChange={(e) => setEditCourseFormData({...editCourseFormData, units: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm" />
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsEditCourseModalOpen(false)} disabled={isSubmitting} className="text-slate-500 hover:bg-slate-50">Cancel</Button>
                <Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-6 font-semibold" disabled={isSubmitting}>Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Faculty Profile Modal */}
      {isEditFacultyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 text-teal-700 rounded-md">
                  <Edit2 className="h-4 w-4" />
                </div>
                <h3 className="font-bold">Edit Faculty Profile</h3>
              </div>
              <button onClick={() => setIsEditFacultyModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleFacultyFormSubmit} className="p-6 space-y-5">
              {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-in slide-in-from-top-1">{formError}</div>}
              <div className="flex flex-col items-center justify-center py-2 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                <Avatar className="h-12 w-12 mb-2 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-teal-600 text-white font-bold">
                    {editingFaculty?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold text-slate-800">{editingFaculty?.fullName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold mt-0.5">{editingFaculty?.employeeId}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5" /> Employment Type
                </label>
                <select required value={facultyFormData.employmentType} onChange={handleFacultyEmploymentChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm bg-white">
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" /> Workload Limit (Units)
                </label>
                <div className="relative">
                  <input type="number" readOnly value={facultyFormData.maxUnitsPerSem} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none shadow-inner" />
                  <div className="absolute right-3 top-2.5 text-[9px] font-black text-teal-600 uppercase tracking-tighter">Auto-Limit</div>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsEditFacultyModalOpen(false)} disabled={isSubmitting} className="text-slate-500 hover:bg-slate-50">Cancel</Button>
                <Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-6 font-semibold" disabled={isSubmitting}>Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 text-teal-700 rounded-md">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="font-bold">Add New Assignment</h3>
              </div>
              <button onClick={() => setIsAssignmentModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddAssignmentSubmit} className="p-6 space-y-5">
              {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-in slide-in-from-top-1">{formError}</div>}
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5" /> Course *
                </label>
                <select required value={assignmentFormData.courseId} onChange={(e) => setAssignmentFormData({...assignmentFormData, courseId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm bg-white">
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Program & Section *
                </label>
                <select required value={assignmentFormData.sectionId} onChange={(e) => setAssignmentFormData({...assignmentFormData, sectionId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm bg-white">
                  <option value="">Select Section</option>
                  {programs.map(p => <optgroup key={p.id} label={p.code}>{p.sections.map(s => <option key={s.id} value={s.id}>{p.code} - {s.yearLevel}{s.name}</option>)}</optgroup>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5" /> Faculty
                </label>
                <select value={assignmentFormData.facultyId} onChange={(e) => setAssignmentFormData({...assignmentFormData, facultyId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm bg-white">
                  <option value="">Unassigned</option>
                  {roster.filter(f => f.profileId && f.employmentType !== "not assigned yet" && f.workload.max !== null).map(f => <option key={f.profileId} value={f.profileId}>{f.fullName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5" /> Semester *
                  </label>
                  <select required value={assignmentFormData.semester} onChange={(e) => setAssignmentFormData({...assignmentFormData, semester: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm bg-white">
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Year *
                  </label>
                  <input type="number" required value={assignmentFormData.academicYear} onChange={(e) => setAssignmentFormData({...assignmentFormData, academicYear: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Max Students
                </label>
                <input type="number" value={assignmentFormData.maxStudents} onChange={(e) => setAssignmentFormData({...assignmentFormData, maxStudents: e.target.value})} placeholder="Optional" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsAssignmentModalOpen(false)} disabled={isSubmitting} className="text-slate-500 hover:bg-slate-50">Cancel</Button>
                <Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-6 font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Assignment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {isEditAssignmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 text-teal-700 rounded-md">
                  <Edit2 className="h-4 w-4" />
                </div>
                <h3 className="font-bold">Edit Assignment</h3>
              </div>
              <button onClick={() => setIsEditAssignmentModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleUpdateAssignmentSubmit} className="p-6 space-y-5">
              {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-in slide-in-from-top-1">{formError}</div>}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5" /> Course *
                </label>
                <select required value={editAssignmentFormData.courseId} onChange={(e) => setEditAssignmentFormData({...editAssignmentFormData, courseId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm bg-white">
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Program & Section *
                </label>
                <select required value={editAssignmentFormData.sectionId} onChange={(e) => setEditAssignmentFormData({...editAssignmentFormData, sectionId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm bg-white">
                  <option value="">Select Section</option>
                  {programs.map(p => <optgroup key={p.id} label={p.code}>{p.sections.map(s => <option key={s.id} value={s.id}>{p.code} - {s.yearLevel}{s.name}</option>)}</optgroup>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5" /> Faculty
                </label>
                <select value={editAssignmentFormData.facultyId} onChange={(e) => setEditAssignmentFormData({...editAssignmentFormData, facultyId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm bg-white">
                  <option value="">Unassigned</option>
                  {roster.filter(f => f.profileId && f.employmentType !== "not assigned yet" && f.workload.max !== null).map(f => <option key={f.profileId} value={f.profileId}>{f.fullName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5" /> Semester *
                  </label>
                  <select required value={editAssignmentFormData.semester} onChange={(e) => setEditAssignmentFormData({...editAssignmentFormData, semester: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm bg-white">
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Year *
                  </label>
                  <input type="number" required value={editAssignmentFormData.academicYear} onChange={(e) => setEditAssignmentFormData({...editAssignmentFormData, academicYear: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Max Students
                </label>
                <input type="number" value={editAssignmentFormData.maxStudents} onChange={(e) => setEditAssignmentFormData({...editAssignmentFormData, maxStudents: e.target.value})} placeholder="Optional" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm" />
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsEditAssignmentModalOpen(false)} disabled={isSubmitting} className="text-slate-500 hover:bg-slate-50">Cancel</Button>
                <Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-6 font-semibold" disabled={isSubmitting}>Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-6 shadow-sm">
                <Trash2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Delete {deleteTarget.type}?</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteTarget.name}"</span>? This action is permanent and cannot be undone.
              </p>
              
              <div className="flex gap-3 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isSubmitting}
                  className="px-6 text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeDeletion}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 shadow-lg shadow-red-600/10 font-semibold"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                </Button>
              </div>
              {formError && <p className="mt-4 text-xs font-bold text-red-600 animate-pulse">{formError}</p>}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .diagonal-stripes { background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.04) 10px, rgba(0,0,0,0.04) 20px); }
      `}</style>
    </AdminLayout>
  )
}
