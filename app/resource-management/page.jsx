"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Monitor, Library, Search, Plus, X, Loader2, Building2, Users, BookOpen, Edit2, Trash2, AlertCircle, Briefcase, BarChart3, Clock } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getRooms, createRoom, updateRoom, deleteRoom } from "@/app/actions/room"
import { getCourses, createCourse, updateCourse, deleteCourse } from "@/app/actions/course"
import { getDepartments } from "@/app/actions/department"
import { getFacultyRoster, updateFacultyProfile, deleteFacultyProfile } from "@/app/actions/faculty"

/**
 * Room types with their fixed capacities as requested.
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
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Modal & Form States - Rooms
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [roomFormData, setRoomFormData] = useState({
    type: "",
    capacity: "",
    building: "",
    roomNumber: ""
  })

  // Modal & Form States - Courses
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseFormData, setCourseFormData] = useState({
    title: "",
    description: "",
    departmentId: "",
    units: ""
  })
  const [editCourseFormData, setEditCourseFormData] = useState({
    title: "",
    description: "",
    departmentId: "",
    units: ""
  })

  // Modal & Form States - Faculty
  const [isEditFacultyModalOpen, setIsEditFacultyModalOpen] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [facultyFormData, setFacultyFormData] = useState({
    departmentId: "",
    employmentType: "full_time",
    maxUnitsPerSem: 21,
  })

  // Shared States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [deleteContext, setDeleteContext] = useState(null) // 'room', 'course', 'faculty'
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setIsLoading(true)
    const [roomsRes, coursesRes, deptsRes, rosterRes] = await Promise.all([
      getRooms(),
      getCourses(),
      getDepartments(),
      getFacultyRoster()
    ])
    
    if (roomsRes.success) setRooms(roomsRes.rooms)
    if (coursesRes.success) setCourses(coursesRes.courses)
    if (deptsRes.success) setDepartments(deptsRes.departments)
    if (rosterRes.success) setRoster(rosterRes.roster)
    setIsLoading(false)
  }

  // Refresh functions
  async function refreshRooms() {
    const res = await getRooms()
    if (res.success) setRooms(res.rooms)
  }

  async function refreshCourses() {
    const res = await getCourses()
    if (res.success) setCourses(res.courses)
  }

  async function refreshFaculty() {
    const res = await getFacultyRoster()
    if (res.success) setRoster(res.roster)
  }

  // Room Handlers
  const handleEditRoomClick = (room) => {
    setSelectedRoom(room)
    const roomNumber = room.name.split('-')[1] || ""
    setRoomFormData({
      type: room.type,
      capacity: room.capacity,
      building: room.building,
      roomNumber: roomNumber
    })
    setFormError(null)
    setIsConfirmingDelete(false)
    setIsEditRoomModalOpen(true)
  }

  const handleUpdateRoomSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)
    const res = await updateRoom(selectedRoom.id, roomFormData)
    if (res.success) {
      setIsEditRoomModalOpen(false)
      refreshRooms()
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleDeleteRoom = async () => {
    setIsSubmitting(true)
    setFormError(null)
    const res = await deleteRoom(selectedRoom.id)
    if (res.success) {
      setIsEditRoomModalOpen(false)
      setIsConfirmingDelete(false)
      refreshRooms()
    } else {
      setFormError(res.error)
      setIsConfirmingDelete(false)
    }
    setIsSubmitting(false)
  }

  const handleRoomTypeChange = (e) => {
    const selectedType = ROOM_TYPES.find(t => t.label === e.target.value)
    setRoomFormData({
      ...roomFormData,
      type: e.target.value,
      capacity: selectedType ? selectedType.capacity : ""
    })
  }

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)
    if (!roomFormData.type || !roomFormData.building || !roomFormData.roomNumber) {
      setFormError("All fields are required.")
      setIsSubmitting(false)
      return
    }
    const res = await createRoom(roomFormData)
    if (res.success) {
      setIsRoomModalOpen(false)
      setRoomFormData({ type: "", capacity: "", building: "", roomNumber: "" })
      refreshRooms()
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  // Course Handlers
  const handleEditCourseClick = (course) => {
    setSelectedCourse(course)
    setEditCourseFormData({
      title: course.title,
      description: course.description || "",
      departmentId: course.departmentId,
      units: course.units
    })
    setFormError(null)
    setIsConfirmingDelete(false)
    setIsEditCourseModalOpen(true)
  }

  const handleUpdateCourseSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)
    const res = await updateCourse(selectedCourse.id, editCourseFormData)
    if (res.success) {
      setIsEditCourseModalOpen(false)
      refreshCourses()
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleDeleteCourse = async () => {
    setIsSubmitting(true)
    setFormError(null)
    const res = await deleteCourse(selectedCourse.id)
    if (res.success) {
      setIsEditCourseModalOpen(false)
      setIsConfirmingDelete(false)
      refreshCourses()
    } else {
      setFormError(res.error)
      setIsConfirmingDelete(false)
    }
    setIsSubmitting(false)
  }

  const handleAddCourseSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)
    if (!courseFormData.title || !courseFormData.departmentId || !courseFormData.units) {
      setFormError("Title, Department, and Units are required.")
      setIsSubmitting(false)
      return
    }
    const res = await createCourse(courseFormData)
    if (res.success) {
      setIsCourseModalOpen(false)
      setCourseFormData({ title: "", description: "", departmentId: "", units: "" })
      refreshCourses()
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  // Faculty Handlers
  const handleEditFacultyClick = (member) => {
    setEditingFaculty(member)
    const dept = departments.find(d => d.name === member.departmentName)
    setFacultyFormData({
      departmentId: dept?.id || "",
      employmentType: member.employmentType === "not assigned yet" ? "full_time" : member.employmentType,
      maxUnitsPerSem: member.workload.max || 21,
    })
    setFormError(null)
    setIsConfirmingDelete(false)
    setIsEditFacultyModalOpen(true)
  }

  const handleFacultyEmploymentChange = (e) => {
    const type = e.target.value
    const units = type === "full_time" ? 21 : 12
    setFacultyFormData({
      ...facultyFormData,
      employmentType: type,
      maxUnitsPerSem: units
    })
  }

  const handleFacultyFormSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)
    const res = await updateFacultyProfile(editingFaculty.id, facultyFormData)
    if (res.success) {
      setIsEditFacultyModalOpen(false)
      refreshFaculty()
    } else {
      setFormError(res.error)
    }
    setIsSubmitting(false)
  }

  const handleDeleteFaculty = async () => {
    setIsSubmitting(true)
    setFormError(null)
    const res = await deleteFacultyProfile(editingFaculty.id)
    if (res.success) {
      setIsEditFacultyModalOpen(false)
      setIsConfirmingDelete(false)
      refreshFaculty()
    } else {
      setFormError(res.error)
      setIsConfirmingDelete(false)
    }
    setIsSubmitting(false)
  }

  // Filter Logic
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.building.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRoster = roster.filter(member => 
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AdminLayout title="Resource Management">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Campus Resources</h2>
              <p className="text-slate-500 text-sm">Manage physical locations, course catalogs, and faculty profiles.</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <button onClick={() => { setActiveTab("rooms"); setSearchQuery(""); }} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "rooms" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Rooms</button>
              <button onClick={() => { setActiveTab("courses"); setSearchQuery(""); }} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "courses" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Courses</button>
              <button onClick={() => { setActiveTab("faculty"); setSearchQuery(""); }} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "faculty" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Faculty</button>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            {activeTab !== "faculty" && (
              <Button onClick={() => { setFormError(null); if (activeTab === "rooms") setIsRoomModalOpen(true); else setIsCourseModalOpen(true); }} className="bg-[#115e59] hover:bg-teal-900 shrink-0 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add {activeTab === "rooms" ? "Room" : "Course"}
              </Button>
            )}
          </div>

          {/* Main Content Area */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-2" />
              <p>Loading {activeTab}...</p>
            </div>
          ) : activeTab === "rooms" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRooms.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-dashed border-slate-200 rounded-lg">No rooms found.</div>
              ) : (
                filteredRooms.map((room) => (
                  <Card key={room.id} className="hover:shadow-md transition-shadow bg-white border-slate-200 group">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-slate-50 rounded-md text-teal-600 border border-slate-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          {room.type.includes("Computer") ? <Monitor className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditRoomClick(room)} className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { setSelectedRoom(room); setIsConfirmingDelete(true); setDeleteContext('room'); setIsEditRoomModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900">{room.name}</h3>
                      <p className="text-xs text-slate-500 mb-4 h-8 line-clamp-2">{room.building}</p>
                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                        <span className="text-slate-400 truncate max-w-[120px]">{room.type}</span>
                        <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Cap: {room.capacity}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : activeTab === "courses" ? (
            <Card className="border-slate-200 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Code</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Course Title</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Department</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Units</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Description</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCourses.map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50 transition-colors bg-white">
                          <td className="px-6 py-4 font-bold font-mono text-teal-700 text-xs">{course.code}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900">{course.title}</td>
                          <td className="px-6 py-4 text-slate-600">{course.departmentName}</td>
                          <td className="px-6 py-4 font-bold text-slate-700">{course.units}</td>
                          <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{course.description || "-"}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => handleEditCourseClick(course)} className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                              <button onClick={() => { setSelectedCourse(course); setIsConfirmingDelete(true); setDeleteContext('course'); setIsEditCourseModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Employee ID</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Faculty Name</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Department</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Employment</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Workload</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Availability</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRoster.map((member) => {
                        const hasWorkloadLimit = member.workload.max !== null;
                        const loadPercentage = hasWorkloadLimit ? (member.workload.current / member.workload.max) * 100 : 0;
                        const isOverload = hasWorkloadLimit && member.workload.current > member.workload.max;
                        return (
                          <tr key={member.id} className="hover:bg-slate-50 transition-colors bg-white">
                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{member.employeeId}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-7 w-7"><AvatarFallback className="bg-teal-100 text-teal-700 text-[10px]">{member.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}</AvatarFallback></Avatar>
                                <p className="font-semibold text-slate-900">{member.fullName}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4"><span className={member.departmentName === "not assigned yet" ? "text-slate-400 italic" : "text-slate-700"}>{member.departmentName}</span></td>
                            <td className="px-6 py-4"><span className={!member.employmentType || member.employmentType === "not assigned yet" ? "text-slate-400 italic text-xs" : "text-slate-700 capitalize"}>{member.employmentType && member.employmentType !== "not assigned yet" ? member.employmentType.replace('_', ' ') : "not assigned yet"}</span></td>
                            <td className="px-6 py-4">
                              {hasWorkloadLimit ? (
                                <div className="flex flex-col gap-1">
                                  <span className={`text-[10px] font-bold ${isOverload ? 'text-red-600' : 'text-slate-500'}`}>{member.workload.current} / {member.workload.max}</span>
                                  <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${isOverload ? 'bg-red-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(loadPercentage, 100)}%` }} /></div>
                                </div>
                              ) : <span className="text-slate-400 italic text-xs">not assigned yet</span>}
                            </td>
                            <td className="px-6 py-4"><Badge variant="outline" className={member.availabilityStatus === "Submitted" ? "border-teal-200 bg-teal-50 text-teal-700 text-[10px]" : "bg-orange-50 text-orange-700 border-orange-100 text-[10px]"}>{member.availabilityStatus}</Badge></td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors"><Clock className="h-4 w-4" /></button>
                                <button onClick={() => handleEditFacultyClick(member)} className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                                <button onClick={() => { setEditingFaculty(member); setIsConfirmingDelete(true); setDeleteContext('faculty'); setIsEditFacultyModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">Add New Room <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleAddRoomSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600 font-medium">{formError}</div>}
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Room Type *</label><select required value={roomFormData.type} onChange={handleRoomTypeChange} className="w-full px-3 py-2 border rounded-md text-sm">{ROOM_TYPES.map(t => <option key={t.label} value={t.label}>{t.label} ({t.capacity} cap.)</option>)}</select></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Capacity</label><input type="text" readOnly value={roomFormData.capacity} className="w-full px-3 py-2 bg-slate-50 border rounded-md text-sm text-slate-500 font-bold" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Building *</label><select required value={roomFormData.building} onChange={(e) => setRoomFormData({...roomFormData, building: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm">{BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Room Number *</label><input type="number" required max="99999" value={roomFormData.roomNumber} onChange={(e) => setRoomFormData({...roomFormData, roomNumber: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" /></div>
              <div className="pt-4 flex justify-end gap-3 border-t"><Button type="button" variant="outline" onClick={() => setIsRoomModalOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Room"}</Button></div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {isEditRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">{isConfirmingDelete ? "Delete Room" : "Edit Room"} <button onClick={() => setIsEditRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleUpdateRoomSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600 font-medium">{formError}</div>}
              {!isConfirmingDelete ? (
                <><div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Room Name (Preview)</label><div className="px-3 py-2 bg-slate-50 border rounded-md text-sm text-teal-700 font-bold font-mono">{selectedRoom?.name}</div></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Room Type *</label><select required value={roomFormData.type} onChange={handleRoomTypeChange} className="w-full px-3 py-2 border rounded-md text-sm">{ROOM_TYPES.map(t => <option key={t.label} value={t.label}>{t.label} ({t.capacity} cap.)</option>)}</select></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Building *</label><select required value={roomFormData.building} onChange={(e) => setRoomFormData({...roomFormData, building: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm">{BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Room Number *</label><input type="number" required max="99999" value={roomFormData.roomNumber} onChange={(e) => setRoomFormData({...roomFormData, roomNumber: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                <div className="pt-6 border-t flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setIsEditRoomModalOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button></div></>
              ) : (
                <div className="space-y-6"><div className="bg-red-50 p-4 rounded-lg border border-red-100"><div className="flex gap-3 items-start"><AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-red-900">Delete {selectedRoom?.name}?</p><p className="text-xs text-red-700 mt-1 leading-relaxed">This will permanently remove the room. This action will fail if classes are scheduled here.</p></div></div></div>
                <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={() => setIsConfirmingDelete(false)} disabled={isSubmitting}>Back</Button><Button type="button" onClick={handleDeleteRoom} className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Permanently"}</Button></div></div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">Add New Course <button onClick={() => setIsCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleAddCourseSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600 font-medium">{formError}</div>}
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Course Title *</label><input type="text" required value={courseFormData.title} onChange={(e) => setCourseFormData({...courseFormData, title: e.target.value})} placeholder="e.g. Computer Programming 1" className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Description</label><textarea value={courseFormData.description} onChange={(e) => setCourseFormData({...courseFormData, description: e.target.value})} placeholder="Optional description..." rows={3} className="w-full px-3 py-2 border rounded-md text-sm resize-none" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Department *</label><select required value={courseFormData.departmentId} onChange={(e) => setCourseFormData({...courseFormData, departmentId: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm">{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Units *</label><input type="number" required min="1" max="6" value={courseFormData.units} onChange={(e) => setCourseFormData({...courseFormData, units: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" /></div>
              <div className="pt-4 flex justify-end gap-3 border-t"><Button type="button" variant="outline" onClick={() => setIsCourseModalOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white" disabled={isSubmitting}>Create Course</Button></div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {isEditCourseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">{isConfirmingDelete ? "Delete Course" : "Edit Course"} <button onClick={() => setIsEditCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleUpdateCourseSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600 font-medium">{formError}</div>}
              {!isConfirmingDelete ? (
                <><div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Course Code</label><input type="text" readOnly value={selectedCourse?.code} className="w-full px-3 py-2 bg-slate-50 border rounded-md text-sm text-slate-500 font-mono font-bold" /></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Course Title *</label><input type="text" required value={editCourseFormData.title} onChange={(e) => setEditCourseFormData({...editCourseFormData, title: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Department *</label><select required value={editCourseFormData.departmentId} onChange={(e) => setEditCourseFormData({...editCourseFormData, departmentId: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm">{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Units *</label><input type="number" required min="1" max="6" value={editCourseFormData.units} onChange={(e) => setEditCourseFormData({...editCourseFormData, units: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                <div className="pt-6 border-t flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setIsEditCourseModalOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white" disabled={isSubmitting}>Save Changes</Button></div></>
              ) : (
                <div className="space-y-6"><div className="bg-red-50 p-4 rounded-lg border border-red-100"><div className="flex gap-3 items-start"><AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-red-900">Delete {selectedCourse?.title}?</p><p className="text-xs text-red-700 mt-1 leading-relaxed">This action cannot be undone and will fail if the course is assigned to sections.</p></div></div></div>
                <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={() => setIsConfirmingDelete(false)} disabled={isSubmitting}>Back</Button><Button type="button" onClick={handleDeleteCourse} className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>Delete Permanently</Button></div></div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Faculty Profile Modal */}
      {isEditFacultyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">{isConfirmingDelete ? "Delete Faculty Profile" : "Edit Faculty Profile"} <button onClick={() => setIsEditFacultyModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleFacultyFormSubmit} className="p-6 space-y-5">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">{formError}</div>}
              {!isConfirmingDelete ? (
                <><div className="text-center mb-2"><p className="text-sm font-bold text-slate-800">{editingFaculty?.fullName}</p><p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{editingFaculty?.employeeId}</p></div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> Department</label><select required value={facultyFormData.departmentId} onChange={(e) => setFacultyFormData({...facultyFormData, departmentId: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm">{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Employment Type</label><select required value={facultyFormData.employmentType} onChange={handleFacultyEmploymentChange} className="w-full px-3 py-2 border rounded-md text-sm"><option value="full_time">Full Time</option><option value="part_time">Part Time</option></select></div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5" /> Workload Limit (Units)</label><div className="relative"><input type="number" readOnly value={facultyFormData.maxUnitsPerSem} className="w-full px-3 py-2 bg-slate-50 border rounded-md text-sm font-bold text-slate-900" /><div className="absolute right-3 top-2.5 text-[10px] font-bold text-teal-600 uppercase">Automated</div></div></div>
                <div className="pt-4 flex justify-end gap-3 border-t"><Button type="button" variant="outline" onClick={() => setIsEditFacultyModalOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white" disabled={isSubmitting}>Save Changes</Button></div></>
              ) : (
                <div className="space-y-6"><div className="bg-red-50 p-4 rounded-lg border border-red-100"><div className="flex gap-3 items-start"><AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-red-900">Delete {editingFaculty?.fullName}'s profile?</p><p className="text-xs text-red-700 mt-1 leading-relaxed">This will delete their faculty data. The User account will remain but will no longer have a profile. This fails if they have active assignments.</p></div></div></div>
                <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={() => setIsConfirmingDelete(false)} disabled={isSubmitting}>Back</Button><Button type="button" onClick={handleDeleteFaculty} className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>Delete Profile</Button></div></div>
              )}
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
