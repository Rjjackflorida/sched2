"use client"

import React, { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, Edit2, Clock, Loader2, X, Building, Briefcase, BarChart3 } from "lucide-react"
import { getFacultyRoster, updateFacultyProfile } from "@/app/actions/faculty"
import { getDepartments } from "@/app/actions/department"

/**
 * FacultyManagementPage provides a comprehensive view of all faculty members.
 * It pulls data from the User and FacultyProfile tables, handling unassigned profiles gracefully.
 */
export default function FacultyManagementPage() {
  // State for roster data and loading
  const [roster, setRoster] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  // Modal and Form State for editing faculty
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    departmentId: "",
    employmentType: "full_time",
    maxUnitsPerSem: 21,
  });

  /**
   * Load faculty and department data from the database.
   */
  const loadData = async () => {
    setIsLoading(true);
    const [rosterRes, deptRes] = await Promise.all([
      getFacultyRoster(),
      getDepartments()
    ]);

    if (rosterRes.success) setRoster(rosterRes.roster);
    if (deptRes.success) setDepartments(deptRes.departments);
    if (!rosterRes.success) setError(rosterRes.error);
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Opens the edit modal and populates it with the selected faculty's data.
   */
  const handleEditClick = (member) => {
    setEditingFaculty(member);
    
    // Find the department ID that matches the department name from the roster
    const dept = departments.find(d => d.name === member.departmentName);
    
    setFormData({
      departmentId: dept?.id || "",
      employmentType: member.employmentType === "not assigned yet" ? "full_time" : member.employmentType,
      maxUnitsPerSem: member.workload.max || 21,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  /**
   * Automates the workload limit based on the selected employment type.
   * Full Time = 21 units, Part Time = 12 units.
   */
  const handleEmploymentChange = (e) => {
    const type = e.target.value;
    const units = type === "full_time" ? 21 : 12;
    setFormData({
      ...formData,
      employmentType: type,
      maxUnitsPerSem: units
    });
  };

  /**
   * Handles the submission of the Edit Faculty form.
   */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const res = await updateFacultyProfile(editingFaculty.id, formData);

    if (res.success) {
      // Refresh the roster to show updated data
      await loadData();
      setIsEditModalOpen(false);
    } else {
      setFormError(res.error);
    }
    setIsSubmitting(false);
  };

  /**
   * Filters the roster based on the search query (Name or Employee ID).
   */
  const filteredRoster = roster.filter(member => 
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Faculty Management">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header Section: Title and Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Faculty Roster</h2>
              <p className="text-slate-500 text-sm">Manage professor profiles, workloads, and schedule statuses.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search faculty..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Main Roster Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Employee ID</th>
                      <th className="px-6 py-4 font-medium">Faculty Name</th>
                      <th className="px-6 py-4 font-medium">Department</th>
                      <th className="px-6 py-4 font-medium">Employment</th>
                      <th className="px-6 py-4 font-medium">Workload</th>
                      <th className="px-6 py-4 font-medium">Availability</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                            <span>Loading faculty roster...</span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-red-500 font-medium">
                          {error}
                        </td>
                      </tr>
                    ) : filteredRoster.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400">
                          No faculty members found.
                        </td>
                      </tr>
                    ) : (
                      filteredRoster.map((member) => {
                        const hasWorkloadLimit = member.workload.max !== null;
                        const loadPercentage = hasWorkloadLimit ? (member.workload.current / member.workload.max) * 100 : 0;
                        const isOverload = hasWorkloadLimit && member.workload.current > member.workload.max;
                        const isNotAssigned = member.employeeId === "not assigned yet";

                        return (
                          <tr key={member.id} className="hover:bg-slate-50 transition-colors bg-white">
                            {/* Employee ID Column */}
                            <td className="px-6 py-4">
                              <span className={`font-mono text-xs ${isNotAssigned ? 'text-slate-400 italic' : 'text-slate-600 font-bold'}`}>
                                {member.employeeId}
                              </span>
                            </td>

                            {/* Faculty Name Column */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-teal-100 text-teal-700 text-[10px]">
                                    {member.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="font-semibold text-slate-900">{member.fullName}</p>
                              </div>
                            </td>

                            {/* Department Column */}
                            <td className="px-6 py-4">
                              <span className={member.departmentName === "not assigned yet" ? "text-slate-400 italic" : "text-slate-700 font-medium"}>
                                {member.departmentName}
                              </span>
                            </td>

                            {/* Employment Type Column */}
                            <td className="px-6 py-4">
                              <span className={member.employmentType === "not assigned yet" || !member.employmentType ? "text-slate-400 italic" : "text-slate-700 font-medium capitalize"}>
                                {member.employmentType && member.employmentType !== "not assigned yet" 
                                  ? member.employmentType.replace('_', ' ') 
                                  : "not assigned yet"}
                              </span>
                            </td>

                            {/* Workload Column */}
                            <td className="px-6 py-4">
                              {member.workload && member.workload.max !== null ? (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className={isOverload ? "text-red-600 font-bold" : "text-slate-500"}>
                                      {member.workload.current} / {member.workload.max} units
                                    </span>
                                  </div>
                                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${isOverload ? 'bg-red-500' : 'bg-teal-500'}`}
                                      style={{ width: `${Math.min(loadPercentage, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">not assigned yet</span>
                              )}
                            </td>

                            {/* Availability Status Column */}
                            <td className="px-6 py-4">
                              <Badge variant={member.availabilityStatus === "Submitted" ? "outline" : "secondary"} 
                                     className={member.availabilityStatus === "Submitted" 
                                       ? "border-teal-200 bg-teal-50 text-teal-700" 
                                       : "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100"}>
                                {member.availabilityStatus}
                              </Badge>
                            </td>

                            {/* Actions Column */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600" title="Override Availability">
                                  <Clock className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-teal-600" 
                                  title="Edit Profile"
                                  onClick={() => handleEditClick(member)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Faculty Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-teal-100 p-2 rounded-lg text-teal-700">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Faculty Profile</h3>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{editingFaculty.fullName}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">
                  {formError}
                </div>
              )}

              {/* Department Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <Building className="h-3.5 w-3.5" /> Department
                </label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Employment Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5" /> Employment Type
                </label>
                <select
                  required
                  value={formData.employmentType}
                  onChange={handleEmploymentChange}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                </select>
              </div>

              {/* Max Units per Semester (Workload Limit) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" /> Workload Limit (Max Units)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={formData.maxUnitsPerSem}
                    onChange={(e) => setFormData({...formData, maxUnitsPerSem: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-900 focus:outline-none"
                    readOnly // Logic is automated, but we show it clearly
                  />
                  <div className="absolute right-3 top-2.5 text-[10px] font-bold text-teal-600 uppercase">
                    Automated
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  {formData.employmentType === 'full_time' ? "Full-time professors are set to 21 units max." : "Part-time professors are set to 12 units max."}
                </p>
              </div>

              {/* Form Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-600 border-slate-200 hover:bg-slate-50 text-sm font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#115e59] hover:bg-teal-900 text-white text-sm font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
