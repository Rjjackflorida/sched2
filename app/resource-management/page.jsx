"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Monitor, Library, Search, Plus, X, Loader2, Building2, Users, BookOpen, Edit2, Trash2, AlertCircle, Briefcase, BarChart3, Clock, UserCheck, Building } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getRooms, createRoom, updateRoom, deleteRoom } from "@/app/actions/room"
import { getCourses, createCourse, updateCourse, deleteCourse } from "@/app/actions/course"
import { getCourseSections, createCourseSection, updateCourseSection, deleteCourseSection } from "@/app/actions/section"
import { getFacultyRoster, updateFacultyProfile, deleteFacultyProfile } from "@/app/actions/faculty"
import { getPrograms, createProgram, createSection, deleteProgram, deleteSection } from "@/app/actions/program"

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

  // --- SELECTION STATES ---
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [selectedSectionObj, setSelectedSectionObj] = useState(null)

  // --- FORM DATA STATES ---
  const [roomFormData, setRoomFormData] = useState({ type: "", capacity: "", building: "", roomNumber: "" })
  const [editRoomFormData, setEditRoomFormData] = useState({ type: "", capacity: "", building: "", roomNumber: "" })
  const [courseFormData, setCourseFormData] = useState({ title: "", description: "", units: "" })
  const [editCourseFormData, setEditCourseFormData] = useState({ title: "", description: "", units: "" })
  const [facultyFormData, setFacultyFormData] = useState({ employmentType: "full_time", maxUnitsPerSem: 21 })
  const [assignmentFormData, setAssignmentFormData] = useState({ courseId: "", facultyId: "", sectionId: "", semester: "1st", academicYear: "2024", maxStudents: "40" })
  const [editAssignmentFormData, setEditAssignmentFormData] = useState({ courseId: "", facultyId: "", sectionId: "", semester: "1st", academicYear: "2024", maxStudents: "40" })
  const [programFormData, setProgramFormData] = useState({ code: "", name: "" })
  const [sectionFormData, setSectionFormData] = useState({ programId: "", yearLevel: "", name: "" })

  // --- SHARED ACTION STATES ---
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    if (activeTab === "faculty") refreshFaculty()
  }, [facultySemester, facultyAcademicYear, activeTab])

  async function loadAllData() {
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

  // --- REFRESH FUNCTIONS ---
  const refreshRooms = async () => { const res = await getRooms(); if (res.success) setRooms(res.rooms); }
  const refreshCourses = async () => { const res = await getCourses(); if (res.success) setCourses(res.courses); }
  const refreshFaculty = async () => { const res = await getFacultyRoster(facultySemester, facultyAcademicYear); if (res.success) setRoster(res.roster); }
  const refreshAssignments = async () => { const res = await getCourseSections(); if (res.success) setAssignments(res.sections); }
  const refreshPrograms = async () => { const res = await getPrograms(); if (res.success) setPrograms(res.programs); }

  // --- ROOM HANDLERS ---
  const handleRoomTypeChange = (e, isEdit = false) => {
    const selectedType = ROOM_TYPES.find(t => t.label === e.target.value)
    const setter = isEdit ? setEditRoomFormData : setRoomFormData
    setter(prev => ({ ...prev, type: e.target.value, capacity: selectedType ? selectedType.capacity : "" }))
  }
  const handleAddRoomSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setFormError(null);
    const res = await createRoom(roomFormData);
    if (res.success) { setIsRoomModalOpen(false); setRoomFormData({ type: "", capacity: "", building: "", roomNumber: "" }); refreshRooms(); } 
    else setFormError(res.error);
    setIsSubmitting(false)
  }
  const handleEditRoomClick = (room) => {
    setSelectedRoom(room); setEditRoomFormData({ type: room.type, capacity: room.capacity, building: room.building, roomNumber: room.name.split('-')[1] || "" });
    setFormError(null); setIsConfirmingDelete(false); setIsEditRoomModalOpen(true);
  }
  const handleUpdateRoomSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setFormError(null);
    const res = await updateRoom(selectedRoom.id, editRoomFormData);
    if (res.success) { setIsEditRoomModalOpen(false); refreshRooms(); } 
    else setFormError(res.error);
    setIsSubmitting(false)
  }
  const handleDeleteRoom = async () => {
    setIsSubmitting(true); setFormError(null);
    const res = await deleteRoom(selectedRoom.id);
    if (res.success) { setIsEditRoomModalOpen(false); setIsConfirmingDelete(false); refreshRooms(); } 
    else setFormError(res.error);
    setIsSubmitting(false)
  }

  // --- COURSE HANDLERS ---
  const handleAddCourseSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setFormError(null);
    const res = await createCourse(courseFormData);
    if (res.success) { setIsCourseModalOpen(false); setCourseFormData({ title: "", description: "", units: "" }); refreshCourses(); } 
    else setFormError(res.error);
    setIsSubmitting(false)
  }
  const handleEditCourseClick = (course) => {
    setSelectedCourse(course); setEditCourseFormData({ title: course.title, description: course.description || "", units: course.units });
    setFormError(null); setIsConfirmingDelete(false); setIsEditCourseModalOpen(true);
  }
  const handleUpdateCourseSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setFormError(null);
    const res = await updateCourse(selectedCourse.id, editCourseFormData);
    if (res.success) { setIsEditCourseModalOpen(false); refreshCourses(); } 
    else setFormError(res.error);
    setIsSubmitting(false)
  }
  const handleDeleteCourse = async () => {
    setIsSubmitting(true); setFormError(null);
    const res = await deleteCourse(selectedCourse.id);
    if (res.success) { setIsEditCourseModalOpen(false); setIsConfirmingDelete(false); refreshCourses(); } 
    else setFormError(res.error);
    setIsSubmitting(false)
  }

  // --- FACULTY HANDLERS ---
  const handleEditFacultyClick = (member) => {
    setEditingFaculty(member);
    setFacultyFormData({ employmentType: member.employmentType === "not assigned yet" ? "full_time" : member.employmentType, maxUnitsPerSem: member.workload.max || 21 });
    setFormError(null); setIsConfirmingDelete(false); setIsEditFacultyModalOpen(true);
  }
  const handleFacultyEmploymentChange = (e) => {
    const type = e.target.value
    setFacultyFormData(prev => ({ ...prev, employmentType: type, maxUnitsPerSem: type === "full_time" ? 21 : 12 }))
  }
  const handleFacultyFormSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setFormError(null);
    const res = await updateFacultyProfile(editingFaculty.id, facultyFormData);
    if (res.success) { setIsEditFacultyModalOpen(false); refreshFaculty(); } 
    else setFormError(res.error);
    setIsSubmitting(false)
  }
  const handleDeleteFaculty = async () => {
    setIsSubmitting(true); setFormError(null);
    const res = await deleteFacultyProfile(editingFaculty.id);
    if (res.success) { setIsEditFacultyModalOpen(false); setIsConfirmingDelete(false); refreshFaculty(); } 
    else setFormError(res.error);
    setIsSubmitting(false)
  }

  // --- ASSIGNMENT HANDLERS ---
  const handleAddAssignmentSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setFormError(null);
    const res = await createCourseSection(assignmentFormData);
    if (res.success) { 
      setIsAssignmentModalOpen(false); 
      refreshAssignments(); 
      refreshFaculty();
    } 
    else setFormError(res.error);
    setIsSubmitting(false);
  }
  const handleEditAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment); setEditAssignmentFormData({ courseId: assignment.courseId, facultyId: assignment.facultyId || "", sectionId: assignment.sectionId, semester: assignment.semester, academicYear: assignment.academicYear.toString(), maxStudents: assignment.maxStudents?.toString() || "" });
    setFormError(null); setIsConfirmingDelete(false); setIsEditAssignmentModalOpen(true);
  }
  const handleUpdateAssignmentSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setFormError(null);
    const res = await updateCourseSection(selectedAssignment.id, editAssignmentFormData);
    if (res.success) { 
      setIsEditAssignmentModalOpen(false); 
      refreshAssignments(); 
      refreshFaculty();
    } 
    else setFormError(res.error);
    setIsSubmitting(false);
  }
  const handleDeleteAssignment = async () => {
    setIsSubmitting(true); setFormError(null);
    const res = await deleteCourseSection(selectedAssignment.id);
    if (res.success) { 
      setIsEditAssignmentModalOpen(false); 
      setIsConfirmingDelete(false); 
      refreshAssignments(); 
      refreshFaculty();
    } 
    else setFormError(res.error);
    setIsSubmitting(false);
  }

  // --- PROGRAM HANDLERS ---
  const handleAddProgramSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setFormError(null);
    const res = await createProgram(programFormData);
    if (res.success) { setIsProgramModalOpen(false); setProgramFormData({ code: "", name: "" }); refreshPrograms(); } 
    else setFormError(res.error);
    setIsSubmitting(false);
  }
  const handleDeleteProgram = async (id) => {
    if(!confirm("Delete this program?")) return;
    const res = await deleteProgram(id);
    if(res.success) refreshPrograms(); else alert(res.error);
  }
  const handleAddSectionSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setFormError(null);
    const res = await createSection(sectionFormData);
    if (res.success) { setIsSectionModalOpen(false); setSectionFormData({ programId: "", yearLevel: "", name: "" }); refreshPrograms(); } 
    else setFormError(res.error);
    setIsSubmitting(false);
  }
  const handleDeleteSection = async (id) => {
    if(!confirm("Delete this section?")) return;
    const res = await deleteSection(id);
    if(res.success) refreshPrograms(); else alert(res.error);
  }

  // Filter Logic
  const filteredRooms = rooms.filter(room => room.name.toLowerCase().includes(searchQuery.toLowerCase()) || room.building.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredCourses = courses.filter(course => course.title.toLowerCase().includes(searchQuery.toLowerCase()) || course.code.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredRoster = roster.filter(member => member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || member.employeeId.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredAssignments = assignments.filter(assign => assign.program.toLowerCase().includes(searchQuery.toLowerCase()) || assign.sectionCode.toLowerCase().includes(searchQuery.toLowerCase()) || assign.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) || assign.facultyName.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <AdminLayout title="Resource Management">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Campus Resources</h2>
              <p className="text-slate-500 text-sm">Manage locations, courses, faculty, and assignments.</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <button onClick={() => { setActiveTab("rooms"); setSearchQuery(""); }} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "rooms" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Rooms</button>
              <button onClick={() => { setActiveTab("courses"); setSearchQuery(""); }} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "courses" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Courses</button>
              <button onClick={() => { setActiveTab("faculty"); setSearchQuery(""); }} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "faculty" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Faculty</button>
              <button onClick={() => { setActiveTab("assignments"); setSearchQuery(""); }} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "assignments" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Assignments</button>
              <button onClick={() => { setActiveTab("programs"); setSearchQuery(""); }} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "programs" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Programs & Sections</button>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            {activeTab !== "faculty" && (
              <Button onClick={() => { 
                setFormError(null); 
                if (activeTab === "rooms") setIsRoomModalOpen(true); 
                else if (activeTab === "courses") setIsCourseModalOpen(true);
                else if (activeTab === "assignments") setIsAssignmentModalOpen(true);
                else if (activeTab === "programs") setIsProgramModalOpen(true);
              }} className="bg-[#115e59] hover:bg-teal-900 shrink-0 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add {activeTab === "rooms" ? "Room" : activeTab === "courses" ? "Course" : activeTab === "assignments" ? "Assignment" : "Program"}
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
              {filteredRooms.map((room) => (
                <Card key={room.id} className="hover:shadow-md transition-shadow bg-white border-slate-200 group">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-slate-50 rounded-md text-teal-600 border border-slate-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        {room.type.includes("Computer") ? <Monitor className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditRoomClick(room)} className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors" title="Edit Room"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setSelectedRoom(room); setIsConfirmingDelete(true); setIsEditRoomModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Delete Room"><Trash2 className="h-3.5 w-3.5" /></button>
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
              ))}
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

                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Units</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCourses.map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50 transition-colors bg-white">
                          <td className="px-6 py-4 font-bold font-mono text-teal-700 text-xs">{course.code}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900">{course.title}</td>

                          <td className="px-6 py-4 font-bold text-slate-700">{course.units}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => handleEditCourseClick(course)} className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                              <button onClick={() => { setSelectedCourse(course); setIsConfirmingDelete(true); setIsEditCourseModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : activeTab === "faculty" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-teal-700">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-bold">Faculty Workload Tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semester</span>
                    <select value={facultySemester} onChange={(e) => setFacultySemester(e.target.value)} className="text-xs bg-slate-50 border-slate-200 rounded-md focus:ring-teal-500 p-1.5 pr-8">
                      <option value="1st">1st Semester</option>
                      <option value="2nd">2nd Semester</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Year</span>
                    <input type="number" value={facultyAcademicYear} onChange={(e) => setFacultyAcademicYear(e.target.value)} className="w-20 text-xs bg-slate-50 border-slate-200 rounded-md focus:ring-teal-500 p-1.5" />
                  </div>
                </div>
              </div>
              <Card className="border-slate-200 overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Employee ID</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Faculty Name</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Employment</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Workload</th>
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

                              <td className="px-6 py-4"><span className={!member.employmentType || member.employmentType === "not assigned yet" ? "text-slate-400 italic text-xs" : "text-slate-700 capitalize"}>{member.employmentType && member.employmentType !== "not assigned yet" ? member.employmentType.replace('_', ' ') : "not assigned yet"}</span></td>
                              <td className="px-6 py-4">
                                {hasWorkloadLimit ? (
                                  <div className="flex flex-col gap-1">
                                    <span className={`text-[10px] font-bold ${isOverload ? 'text-red-600' : 'text-slate-500'}`}>{member.workload.current} / {member.workload.max}</span>
                                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${isOverload ? 'bg-red-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(loadPercentage, 100)}%` }} /></div>
                                  </div>
                                ) : <span className="text-slate-400 italic text-xs">not assigned yet</span>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <button className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors"><Clock className="h-4 w-4" /></button>
                                  <button onClick={() => handleEditFacultyClick(member)} className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                                  <button onClick={() => { setEditingFaculty(member); setIsConfirmingDelete(true); setIsEditFacultyModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
            </div>
          ) : activeTab === "assignments" ? (
            <Card className="border-slate-200 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Program/Section</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Course</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Faculty</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Semester</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Students</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAssignments.map((assign) => (
                        <tr key={assign.id} className="hover:bg-slate-50 transition-colors bg-white">
                          <td className="px-6 py-4 font-bold text-teal-700">{assign.program} - {assign.sectionCode}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">{assign.courseCode}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[150px]">{assign.courseTitle}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-700">{assign.facultyName}</td>
                          <td className="px-6 py-4"><Badge variant="outline" className="bg-slate-50 text-slate-600">{assign.semester} {assign.academicYear}</Badge></td>
                          <td className="px-6 py-4 text-slate-600 font-mono text-xs">{assign.maxStudents || "N/A"}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => handleEditAssignmentClick(assign)} className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                              <button onClick={() => { setSelectedAssignment(assign); setIsConfirmingDelete(true); setIsEditAssignmentModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : activeTab === "programs" ? (
            <div className="space-y-6">
              {programs.map(program => (
                <Card key={program.id} className="border-slate-200">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                    <div><CardTitle className="text-lg text-slate-900">{program.code} - {program.name}</CardTitle></div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSectionFormData({...sectionFormData, programId: program.id}); setIsSectionModalOpen(true); }}><Plus className="h-4 w-4 mr-1"/> Add Section</Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteProgram(program.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
                        <tr>
                          <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Year Level</th>
                          <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Section Block</th>
                          <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px] text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {program.sections.length === 0 && <tr><td colSpan="3" className="px-6 py-4 text-center text-slate-400 italic">No sections created yet</td></tr>}
                        {program.sections.map(sec => (
                          <tr key={sec.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 text-slate-700">Year {sec.yearLevel}</td>
                            <td className="px-6 py-3 text-teal-700 font-bold">{sec.name}</td>
                            <td className="px-6 py-3 text-right">
                              <button onClick={() => handleDeleteSection(sec.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ))}
              {programs.length === 0 && <div className="text-center py-10 text-slate-500 border border-dashed rounded-lg bg-slate-50">No programs found. Click Add Program above.</div>}
            </div>
          ) : null}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add Program Modal */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">Add New Program <button onClick={() => setIsProgramModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleAddProgramSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{formError}</div>}
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Program Code *</label><input required value={programFormData.code} onChange={e => setProgramFormData({...programFormData, code: e.target.value})} placeholder="e.g. BSIT" className="w-full px-3 py-2 border rounded-md uppercase" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Program Name *</label><input required value={programFormData.name} onChange={e => setProgramFormData({...programFormData, name: e.target.value})} placeholder="e.g. Bachelor of Science in Information Technology" className="w-full px-3 py-2 border rounded-md" /></div>
              <div className="pt-4 flex justify-end gap-3 border-t"><Button type="button" variant="outline" onClick={() => setIsProgramModalOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" className="bg-[#115e59] text-white" disabled={isSubmitting}>Create</Button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">Add Section <button onClick={() => setIsSectionModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleAddSectionSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{formError}</div>}
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Year Level *</label><input type="number" min="1" max="5" required value={sectionFormData.yearLevel} onChange={e => setSectionFormData({...sectionFormData, yearLevel: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Section Block *</label><input required value={sectionFormData.name} onChange={e => setSectionFormData({...sectionFormData, name: e.target.value})} placeholder="e.g. A" className="w-full px-3 py-2 border rounded-md uppercase" /></div>
              <div className="pt-4 flex justify-end gap-3 border-t"><Button type="button" variant="outline" onClick={() => setIsSectionModalOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" className="bg-[#115e59] text-white" disabled={isSubmitting}>Create</Button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">Add New Room <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleAddRoomSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600 font-medium">{formError}</div>}
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Room Type *</label><select required value={roomFormData.type} onChange={(e) => handleRoomTypeChange(e)} className="w-full px-3 py-2 border rounded-md text-sm"><option value="">Select Room Type</option>{ROOM_TYPES.map(t => <option key={t.label} value={t.label}>{t.label} ({t.capacity} cap.)</option>)}</select></div>
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Capacity</label><input type="text" readOnly value={roomFormData.capacity} placeholder="Auto-calculated" className="w-full px-3 py-2 bg-slate-50 border rounded-md text-sm text-slate-500 font-bold" /></div>
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
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">{isConfirmingDelete ? "Delete Room" : "Edit Room"} <button onClick={() => { setIsEditRoomModalOpen(false); setIsConfirmingDelete(false); }} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleUpdateRoomSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600 font-medium">{formError}</div>}
              {!isConfirmingDelete ? (
                <><div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Room Name (Preview)</label><div className="px-3 py-2 bg-slate-50 border rounded-md text-sm text-teal-700 font-bold font-mono">{selectedRoom?.name}</div></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Room Type *</label><select required value={editRoomFormData.type} onChange={(e) => handleRoomTypeChange(e, true)} className="w-full px-3 py-2 border rounded-md text-sm">{ROOM_TYPES.map(t => <option key={t.label} value={t.label}>{t.label} ({t.capacity} cap.)</option>)}</select></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Building *</label><select required value={editRoomFormData.building} onChange={(e) => setEditRoomFormData({...editRoomFormData, building: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm">{BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Room Number *</label><input type="number" required max="99999" value={editRoomFormData.roomNumber} onChange={(e) => setEditRoomFormData({...editRoomFormData, roomNumber: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                <div className="pt-6 border-t flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setIsEditRoomModalOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button></div></>
              ) : (
                <div className="space-y-6"><div className="bg-red-50 p-4 rounded-lg border border-red-100"><div className="flex gap-3 items-start"><AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-red-900">Delete {selectedRoom?.name}?</p><p className="text-xs text-red-700 mt-1 leading-relaxed">This will permanently remove the room. This action will fail if classes are scheduled here.</p></div></div></div>
                <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={() => { setIsEditRoomModalOpen(false); setIsConfirmingDelete(false); }} disabled={isSubmitting}>Back</Button><Button type="button" onClick={handleDeleteRoom} className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Permanently"}</Button></div></div>
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
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">{isConfirmingDelete ? "Delete Course" : "Edit Course"} <button onClick={() => { setIsEditCourseModalOpen(false); setIsConfirmingDelete(false); }} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleUpdateCourseSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600 font-medium">{formError}</div>}
              {!isConfirmingDelete ? (
                <><div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Course Code</label><input type="text" readOnly value={selectedCourse?.code} className="w-full px-3 py-2 bg-slate-50 border rounded-md text-sm text-slate-500 font-mono font-bold" /></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Course Title *</label><input type="text" required value={editCourseFormData.title} onChange={(e) => setEditCourseFormData({...editCourseFormData, title: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500" /></div>

                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Units *</label><input type="number" required min="1" max="6" value={editCourseFormData.units} onChange={(e) => setEditCourseFormData({...editCourseFormData, units: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500" /></div>
                <div className="pt-6 border-t flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setIsEditCourseModalOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white" disabled={isSubmitting}>Save Changes</Button></div></>
              ) : (
                <div className="space-y-6"><div className="bg-red-50 p-4 rounded-lg border border-red-100"><div className="flex gap-3 items-start"><AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-red-900">Delete {selectedCourse?.title}?</p><p className="text-xs text-red-700 mt-1 leading-relaxed">This action cannot be undone and will fail if the course is assigned to sections.</p></div></div></div>
                <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={() => { setIsEditCourseModalOpen(false); setIsConfirmingDelete(false); }} disabled={isSubmitting}>Back</Button><Button type="button" onClick={handleDeleteCourse} className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>Delete Permanently</Button></div></div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Faculty Profile Modal */}
      {isEditFacultyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">{isConfirmingDelete ? "Delete Faculty Profile" : "Edit Faculty Profile"} <button onClick={() => { setIsEditFacultyModalOpen(false); setIsConfirmingDelete(false); }} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleFacultyFormSubmit} className="p-6 space-y-5">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">{formError}</div>}
              {!isConfirmingDelete ? (
                <><div className="text-center mb-2"><p className="text-sm font-bold text-slate-800">{editingFaculty?.fullName}</p><p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{editingFaculty?.employeeId}</p></div>

                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Employment Type</label><select required value={facultyFormData.employmentType} onChange={handleFacultyEmploymentChange} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500"><option value="full_time">Full Time</option><option value="part_time">Part Time</option></select></div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5" /> Workload Limit (Units)</label><div className="relative"><input type="number" readOnly value={facultyFormData.maxUnitsPerSem} className="w-full px-3 py-2 bg-slate-50 border rounded-md text-sm font-bold text-slate-900 focus:outline-none" /><div className="absolute right-3 top-2.5 text-[10px] font-bold text-teal-600 uppercase">Automated</div></div></div>
                <div className="pt-4 flex justify-end gap-3 border-t"><Button type="button" variant="outline" onClick={() => setIsEditFacultyModalOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white" disabled={isSubmitting}>Save Changes</Button></div></>
              ) : (
                <div className="space-y-6"><div className="bg-red-50 p-4 rounded-lg border border-red-100"><div className="flex gap-3 items-start"><AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-red-900">Delete {editingFaculty?.fullName}'s profile?</p><p className="text-xs text-red-700 mt-1 leading-relaxed">This will delete their faculty data. The User account will remain but will no longer have a profile. This fails if they have active assignments.</p></div></div></div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => { setIsEditFacultyModalOpen(false); setIsConfirmingDelete(false); }} disabled={isSubmitting}>Back</Button>
                  <Button type="button" onClick={handleDeleteFaculty} className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>Delete Profile</Button>
                </div>
              </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">Add New Assignment <button onClick={() => setIsAssignmentModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleAddAssignmentSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">{formError}</div>}
              
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Course *</label><select required value={assignmentFormData.courseId} onChange={(e) => setAssignmentFormData({...assignmentFormData, courseId: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500"><option value="">Select Course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}</select></div>
              
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Program & Section *</label><select required value={assignmentFormData.sectionId} onChange={(e) => setAssignmentFormData({...assignmentFormData, sectionId: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500"><option value="">Select Section</option>{programs.map(p => <optgroup key={p.id} label={p.code}>{p.sections.map(s => <option key={s.id} value={s.id}>{p.code} - {s.yearLevel}{s.name}</option>)}</optgroup>)}</select></div>

              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Faculty</label><select value={assignmentFormData.facultyId} onChange={(e) => setAssignmentFormData({...assignmentFormData, facultyId: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500"><option value="">Unassigned</option>{roster.filter(f => f.profileId && f.employmentType !== "not assigned yet" && f.workload.max !== null).map(f => <option key={f.profileId} value={f.profileId}>{f.fullName}</option>)}</select></div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Semester *</label><select required value={assignmentFormData.semester} onChange={(e) => setAssignmentFormData({...assignmentFormData, semester: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500"><option value="1st">1st Semester</option><option value="2nd">2nd Semester</option><option value="Summer">Summer</option></select></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Year *</label><input type="number" required value={assignmentFormData.academicYear} onChange={(e) => setAssignmentFormData({...assignmentFormData, academicYear: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500" /></div>
              </div>
              
              <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Max Students</label><input type="number" value={assignmentFormData.maxStudents} onChange={(e) => setAssignmentFormData({...assignmentFormData, maxStudents: e.target.value})} placeholder="Optional" className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500" /></div>

              <div className="pt-4 flex justify-end gap-3 border-t"><Button type="button" variant="outline" onClick={() => setIsAssignmentModalOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white" disabled={isSubmitting}>Create Assignment</Button></div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {isEditAssignmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900 font-bold">{isConfirmingDelete ? "Delete Assignment" : "Edit Assignment"} <button onClick={() => { setIsEditAssignmentModalOpen(false); setIsConfirmingDelete(false); }} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleUpdateAssignmentSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">{formError}</div>}
              
              {!isConfirmingDelete ? (
                <>
                  <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Course *</label><select required value={editAssignmentFormData.courseId} onChange={(e) => setEditAssignmentFormData({...editAssignmentFormData, courseId: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500"><option value="">Select Course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}</select></div>
                  
                  <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Program & Section *</label><select required value={editAssignmentFormData.sectionId} onChange={(e) => setEditAssignmentFormData({...editAssignmentFormData, sectionId: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500"><option value="">Select Section</option>{programs.map(p => <optgroup key={p.id} label={p.code}>{p.sections.map(s => <option key={s.id} value={s.id}>{p.code} - {s.yearLevel}{s.name}</option>)}</optgroup>)}</select></div>

                  <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Faculty</label><select value={editAssignmentFormData.facultyId} onChange={(e) => setEditAssignmentFormData({...editAssignmentFormData, facultyId: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500"><option value="">Unassigned</option>{roster.filter(f => f.profileId && f.employmentType !== "not assigned yet" && f.workload.max !== null).map(f => <option key={f.profileId} value={f.profileId}>{f.fullName}</option>)}</select></div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Semester *</label><select required value={editAssignmentFormData.semester} onChange={(e) => setEditAssignmentFormData({...editAssignmentFormData, semester: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500"><option value="1st">1st Semester</option><option value="2nd">2nd Semester</option><option value="Summer">Summer</option></select></div>
                    <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Year *</label><input type="number" required value={editAssignmentFormData.academicYear} onChange={(e) => setEditAssignmentFormData({...editAssignmentFormData, academicYear: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500" /></div>
                  </div>

                  <div className="space-y-1"><label className="text-xs font-semibold text-slate-600 uppercase">Max Students</label><input type="number" value={editAssignmentFormData.maxStudents} onChange={(e) => setEditAssignmentFormData({...editAssignmentFormData, maxStudents: e.target.value})} placeholder="Optional" className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-teal-500" /></div>

                  <div className="pt-6 border-t flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <Button type="button" variant="ghost" onClick={() => setIsConfirmingDelete(true)} className="text-red-600 hover:bg-red-50 text-xs font-bold px-3"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</Button>
                      <div className="flex gap-3"><Button type="button" variant="outline" onClick={() => setIsEditAssignmentModalOpen(false)} disabled={isSubmitting}>Cancel</Button><Button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white" disabled={isSubmitting}>Save Changes</Button></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100"><div className="flex gap-3 items-start"><AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-red-900">Delete {selectedAssignment?.program}-{selectedAssignment?.sectionCode} Assignment?</p><p className="text-xs text-red-700 mt-1 leading-relaxed">Permanently removes the assignment. Fails if a schedule has been placed.</p></div></div></div>
                  <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={() => { setIsEditAssignmentModalOpen(false); setIsConfirmingDelete(false); }} disabled={isSubmitting}>Back</Button><Button type="button" onClick={handleDeleteAssignment} className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>Delete Permanently</Button></div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .diagonal-stripes { background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.04) 10px, rgba(0,0,0,0.04) 20px); }
      `}</style>
    </AdminLayout>
  )
}
