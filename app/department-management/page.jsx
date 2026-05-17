"use client"

import React, { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Building, Users, UserCheck, Loader2, X } from "lucide-react"
import { Trash2, AlertCircle } from "lucide-react"
import { getDepartments, getFacultyProfiles, createDepartment, updateDepartment, deleteDepartment } from "@/app/actions/department"

/**
 * DepartmentManagementPage handles the functional management of university departments.
 * Data is fetched from the database and displayed in a card-based grid.
 */
export default function DepartmentManagementPage() {
  // State for data management
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal and Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [formError, setFormError] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    headFacultyId: "",
  });

  const [manageFormData, setManageFormData] = useState({
    name: "",
    headFacultyId: "",
  });

  /**
   * Loads initial data from the database.
   */
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [deptRes, facultyRes] = await Promise.all([
        getDepartments(),
        getFacultyProfiles()
      ]);

      if (deptRes.success) setDepartments(deptRes.departments);
      if (facultyRes.success) setFacultyList(facultyRes.faculty);
      setIsLoading(false);
    };

    loadData();
  }, []);

  /**
   * Filters departments based on user search input.
   */
  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Handles the submission of the "Add Department" form.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const res = await createDepartment(formData);

    if (res.success) {
      // Update local state with the new department
      setDepartments(prev => [res.department, ...prev]);
      setIsModalOpen(false);
      // Reset form
      setFormData({ name: "", code: "", headFacultyId: "" });
    } else {
      setFormError(res.error);
    }
    setIsSubmitting(false);
  };

  /**
   * Opens the manage department modal and populates it with data.
   */
  const handleManageClick = (dept) => {
    setSelectedDept(dept);
    setManageFormData({
      name: dept.name,
      headFacultyId: dept.headFacultyId || "",
    });
    setFormError(null);
    setIsConfirmingDelete(false);
    setIsManageModalOpen(true);
  };

  /**
   * Handles the deletion of a department.
   */
  const handleDelete = async () => {
    setIsSubmitting(true);
    setFormError(null);

    const res = await deleteDepartment(selectedDept.id);

    if (res.success) {
      setDepartments(prev => prev.filter(d => d.id !== selectedDept.id));
      setIsManageModalOpen(false);
      setIsConfirmingDelete(false);
    } else {
      setFormError(res.error);
      setIsConfirmingDelete(false);
    }
    setIsSubmitting(false);
  };

  /**
   * Handles the submission of the "Update Department" form.
   */
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const res = await updateDepartment(selectedDept.id, manageFormData);

    if (res.success) {
      // Update local state with the modified department
      setDepartments(prev => prev.map(d => d.id === res.department.id ? { ...d, ...res.department } : d));
      setIsManageModalOpen(false);
    } else {
      setFormError(res.error);
    }
    setIsSubmitting(false);
  };

  return (
    <AdminLayout title="Department Management">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Academic Departments</h2>
              <p className="text-slate-500 text-sm">Manage university departments and their assigned leadership.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search departments..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <Button 
                onClick={() => {
                  setFormError(null);
                  setIsModalOpen(true);
                }}
                className="bg-[#115e59] hover:bg-teal-900 shrink-0 text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Department
              </Button>
            </div>
          </div>

          {/* Department Cards Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-2" />
              <p>Loading departments...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
              {filteredDepartments.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-dashed border-slate-200 rounded-lg">
                  No departments found matching "{searchQuery}"
                </div>
              ) : (
                filteredDepartments.map((dept) => (
                  <Card key={dept.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden bg-white flex flex-col h-full">
                    {/* Standardized Card Header: Icon, Code, and ID */}
                    <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30 flex-none">
                      <div className="flex justify-between items-start">
                        <div className="bg-teal-50 p-2.5 rounded-xl text-teal-700 shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                          <Building className="h-5 w-5" />
                        </div>
                        <div className="text-right">
                           <Badge variant="outline" className="bg-white border-slate-200 text-teal-700 font-bold px-2 py-0.5 mb-1 shadow-xs">
                            {dept.code}
                          </Badge>
                          <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest">ID: {dept.id}</p>
                        </div>
                      </div>
                      <CardTitle className="text-xl font-extrabold text-slate-900 mt-4 leading-tight group-hover:text-teal-700 transition-colors">
                        {dept.name}
                      </CardTitle>
                    </CardHeader>

                    {/* Standardized Card Content: Leadership and Stats */}
                    <CardContent className="pt-5 flex-1 flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        {/* Leadership Info Section (Standardized box) */}
                        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-teal-100 group-hover:bg-teal-50/30 transition-colors">
                          <div className="bg-white p-2 rounded-full shadow-sm text-teal-600">
                            <UserCheck className="h-4 w-4" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Head of Faculty</p>
                            <p className="text-sm font-bold text-slate-800 truncate">{dept.headFacultyName}</p>
                          </div>
                        </div>

                        {/* Stats Section */}
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium px-1">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span>{dept.facultyCount} Faculty Members</span>
                        </div>
                      </div>

                      {/* Footer Actions (Always aligned at the bottom) */}
                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <Button 
                          onClick={() => handleManageClick(dept)}
                          variant="ghost" 
                          size="sm" 
                          className="text-xs font-bold text-teal-700 hover:bg-teal-50 hover:text-teal-800 rounded-lg"
                        >
                          Manage Department
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Add New Department</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Department Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Department Code (Acronym) *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g. CS or CCIS"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                />
                <p className="text-[10px] text-slate-400 italic">This will be used to generate the ID (e.g. CCIS1618)</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Head of Faculty</label>
                <select
                  value={formData.headFacultyId}
                  onChange={(e) => setFormData({...formData, headFacultyId: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select a Faculty Member</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>{f.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
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
                      Creating...
                    </>
                  ) : (
                    "Create Department"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Department Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Manage Department</h3>
              <button 
                onClick={() => setIsManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Form Content */}
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Department ID</label>
                <input
                  type="text"
                  readOnly
                  value={selectedDept?.id}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 italic">Unique identifiers cannot be changed.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Department Name *</label>
                <input
                  type="text"
                  required
                  value={manageFormData.name}
                  onChange={(e) => setManageFormData({...manageFormData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Head of Faculty</label>
                <select
                  value={manageFormData.headFacultyId}
                  onChange={(e) => setManageFormData({...manageFormData, headFacultyId: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select a Faculty Member</option>
                  {/* Filter faculty list to only show those belonging to THIS department */}
                  {facultyList
                    .filter(f => f.departmentId === selectedDept?.id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>{f.fullName}</option>
                    ))
                  }
                </select>
                <p className="text-[10px] text-slate-400 italic">Only faculty currently assigned to this department are shown.</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                {isConfirmingDelete ? (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-3 items-start mb-4">
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-900">Are you absolutely sure?</p>
                        <p className="text-xs text-red-700 mt-1 leading-relaxed">
                          This will permanently delete the department. This action cannot be undone and will fail if courses are assigned to it.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="text-slate-600 border-slate-200 hover:bg-white text-xs font-bold"
                        disabled={isSubmitting}
                      >
                        No, Keep it
                      </Button>
                      <Button
                        type="button"
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Trash2 className="h-3 w-3 mr-2" />}
                        Yes, Delete Permanently
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-bold px-3"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete Department
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsManageModalOpen(false)}
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
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
