"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdminLayout } from "@/components/admin-layout"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Edit,
  ToggleLeft,
  ToggleRight,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  X,
  UserPlus,
  Mail,
  Shield,
  Key,
  UserCheck
} from "lucide-react"
import { getUsers, createUser, updateUser, toggleUserStatus, deleteUser } from "@/app/actions/user"

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "faculty",
    password: "",
    confirmPassword: ""
  });
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
    const res = await getUsers();
    if (res.success) {
      setUsers(res.users);
    }
    setIsLoading(false);
  }

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      password: "",
      confirmPassword: ""
    });
    setFormError(null);
    setFormSuccess(false);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "faculty",
      password: "",
      confirmPassword: ""
    });
    setFormError(null);
    setFormSuccess(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    // Validation for Edit Password
    if (editingUser && formData.password) {
      if (formData.password.length < 8) {
        return setFormError("Password must be at least 8 characters.");
      }
      if (formData.password !== formData.confirmPassword) {
        return setFormError("Passwords do not match.");
      }
    }

    setIsSubmitting(true);
    let res;
    if (editingUser) {
      res = await updateUser(editingUser.id, formData);
    } else {
      res = await createUser(formData);
    }

    if (res.success) {
      setFormSuccess(true);
      if (!editingUser) {
          // Reset form on create
          setFormData({ firstName: "", lastName: "", email: "", role: "faculty", password: "", confirmPassword: "" });
      }
      fetchUsers();
      setTimeout(() => setIsModalOpen(false), 1500);
    } else {
      setFormError(res.error);
    }
    setIsSubmitting(false);
  };

  const confirmToggleStatus = async () => {
    if (!toggleTarget) return;
    setIsSubmitting(true);
    const res = await toggleUserStatus(toggleTarget.id, !toggleTarget.isActive);
    if (res.success) {
      fetchUsers();
      setToggleTarget(null);
    }
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    const res = await deleteUser(deleteTarget.id);
    if (res.success) {
      fetchUsers();
      setDeleteTarget(null);
    } else {
        alert(res.error);
    }
    setIsSubmitting(false);
  };

  const filteredUsers = users.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="User Management">
      <div className="flex-1 overflow-auto p-6 lg:p-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h2>
            <p className="text-slate-500 mt-1 font-medium text-sm">Control system access and assign roles to university staff.</p>
          </div>
          <Button 
            onClick={handleAddClick}
            className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-6 h-11 rounded-xl font-semibold transition-all"
          >
            <Plus className="h-4 w-4 mr-2" /> Add New User
          </Button>
        </div>

        {/* Toolbar Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Showing {filteredUsers.length} Users
          </div>
        </div>

        {/* Users Table Card */}
        <Card className="border-slate-200 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
                <p className="text-slate-400 font-semibold uppercase tracking-widest text-xs">Loading User Directory...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-widest">
                  <tr>
                    <th className="px-6 py-4">System User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors bg-white/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-teal-100 text-teal-700 font-semibold text-xs">
                              {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-slate-900 text-sm">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="capitalize text-[10px] font-semibold tracking-tight border-slate-200 text-slate-600">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`text-[10px] font-semibold uppercase border-none ${user.isActive ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => handleEditClick(user)}
                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setToggleTarget(user)}
                            className={`p-2 rounded-lg transition-all ${user.isActive ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
                            title={user.isActive ? "Deactivate User" : "Activate User"}
                          >
                            {user.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                          <button 
                            onClick={() => setDeleteTarget(user)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                        No users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit User Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 text-teal-700 rounded-md">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h3 className="font-bold">
                  {editingUser ? "Edit User Details" : "Add New User"}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 animate-in slide-in-from-top-1 font-medium">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg text-sm text-teal-700 font-bold animate-in slide-in-from-top-1">
                  {editingUser 
                    ? "User successfully updated!" 
                    : "User successfully created! Default password: 12345678"}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <UserPlus className="h-3.5 w-3.5" /> First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Jane"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <UserPlus className="h-3.5 w-3.5" /> Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Doe"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="jane.doe@university.edu"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" /> System Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm bg-white"
                >
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Password fields are only shown during Edit mode */}
              {editingUser && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <Key className="h-3.5 w-3.5" /> New Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                    />
                    <p className="text-[9px] text-slate-400 font-bold italic">Leave blank to keep current</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <Key className="h-3.5 w-3.5" /> Confirm
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
              )}

              <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-500 hover:bg-slate-50 px-6"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#115e59] hover:bg-teal-900 text-white shadow-lg shadow-teal-900/10 px-8 font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingUser ? "Save Changes" : "Create User"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Status Confirmation Modal */}
      {toggleTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-sm ${toggleTarget.isActive ? 'bg-orange-50 text-orange-600' : 'bg-teal-50 text-teal-600'}`}>
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {toggleTarget.isActive ? "Deactivate User?" : "Activate User?"}
              </h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                Are you sure you want to set <span className="font-bold text-slate-800">{toggleTarget.fullName}</span> to 
                <span className={`font-semibold ${toggleTarget.isActive ? 'text-orange-600' : 'text-teal-600'}`}> {toggleTarget.isActive ? "Inactive" : "Active"}</span>?
              </p>
              
              <div className="flex gap-3 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setToggleTarget(null)}
                  className="px-6 text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmToggleStatus}
                  className={`px-8 shadow-lg font-semibold ${toggleTarget.isActive 
                    ? "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/10" 
                    : "bg-[#115e59] hover:bg-teal-900 text-white shadow-teal-900/10"}`}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-8 text-center">
              {/* Warning Icon */}
              <div className="mx-auto w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-6 shadow-sm">
                <Trash2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete User Account?</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                Are you sure you want to delete <span className="font-bold text-slate-900">{deleteTarget.fullName}</span>? This action is <span className="text-red-600 font-semibold">permanent</span> and will remove all associated profile data.
              </p>
              
              {/* Modal Actions */}
              <div className="flex gap-3 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteTarget(null)}
                  className="px-6 text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 shadow-lg shadow-red-600/10 font-semibold"
                >
                  Delete User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
