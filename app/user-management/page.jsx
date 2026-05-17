"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdminLayout } from "@/components/admin-layout"
import {
  Edit,
  ToggleLeft,
  ToggleRight,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react"
import { getUsers, createUser, updateUser, toggleUserStatus, deleteUser } from "@/app/actions/user"

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Form State (Handles both Add and Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Tracks the user being edited (null = Add mode)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "faculty",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Toggle Confirmation State
  const [toggleTarget, setToggleTarget] = useState(null); // User object targeted for status toggle

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null); // User object targeted for deletion

  // Load users from DB
  const loadUsers = async () => {
    setIsLoading(true);
    setFetchError(null);
    const res = await getUsers();
    if (res?.success) {
      setUsers(res.users);
    } else {
      setFetchError(res?.error || "Failed to load users.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Handle modal open (Add mode)
  const handleOpenModal = () => {
    setEditingUser(null);
    setFormError(null);
    setFormSuccess(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "faculty",
      password: "",
      confirmPassword: "",
    });
    setIsModalOpen(true);
  };

  // Handle Edit button click
  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormError(null);
    setFormSuccess(false);
    // Populate form with existing user data
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      role: user.role || "faculty",
      password: "", // Leave blank for security
      confirmPassword: "",
    });
    setIsModalOpen(true);
  };

  // Handle Toggle Status click (shows confirmation)
  const handleToggleClick = (user) => {
    setToggleTarget(user);
  };

  // Execute the status toggle after confirmation
  const confirmToggleStatus = async () => {
    if (!toggleTarget) return;

    const res = await toggleUserStatus(toggleTarget.id, toggleTarget.isActive);
    if (res?.success) {
      // Update local state to reflect the change immediately
      setUsers(prev => prev.map(u => 
        u.id === toggleTarget.id ? { ...u, isActive: res.isActive } : u
      ));
    }
    setToggleTarget(null);
  };

  // Handle Delete button click (shows confirmation)
  const handleDeleteClick = (user) => {
    setDeleteTarget(user);
  };

  /**
   * Executes the deletion after user confirms.
   * Removes user from DB and local state.
   */
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const res = await deleteUser(deleteTarget.id);
    if (res?.success) {
      // Remove from local list to reflect changes immediately
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  // Handle user form submission (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    /**
     * Prepare data for submission.
     * For new users, we automatically assign the default password '12345678'.
     */
    const submissionData = { ...formData };
    if (!editingUser) {
      submissionData.password = "12345678";
      submissionData.confirmPassword = "12345678";
    }

    // 1. Password Validation (Checks for match and length)
    if (submissionData.password !== submissionData.confirmPassword) {
      setFormError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    // 2. Minimum Length Validation (8 characters)
    if (submissionData.password && submissionData.password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      setIsSubmitting(false);
      return;
    }

    // 3. Determine Action (Create vs Update)
    let res;
    if (editingUser) {
      res = await updateUser(editingUser.id, submissionData);
    } else {
      res = await createUser(submissionData);
    }

    // 4. Handle Result and Update Local State
    if (res?.success) {
      setFormSuccess(true);
      
      if (editingUser) {
        // Update user in local state list
        setUsers((prev) => prev.map(u => u.id === res.user.id ? res.user : u));
      } else {
        // Prepend newly created user to local list
        setUsers((prev) => [res.user, ...prev]);
      }

      /**
       * Close modal after a delay to allow the admin to read the success message
       * and the note about the default password.
       */
      setTimeout(() => {
        setIsModalOpen(false);
        setIsSubmitting(false);
      }, 2500); 
    } else {
      setFormError(res?.error || "An error occurred while saving the user.");
      setIsSubmitting(false);
    }
  };

  // Filtered users based on search query
  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format short ID prefix for clean table display
  const formatId = (id) => {
    if (!id) return "N/A";
    if (id.length > 10) {
      return id.substring(0, 8).toUpperCase();
    }
    return id;
  };

  return (
    <AdminLayout title="User Management">
      <div className="flex-1 overflow-auto p-6 lg:p-8 relative">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
              <p className="text-slate-500 text-sm">Manage system users, roles, and access.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <Button 
                onClick={handleOpenModal}
                className="bg-[#115e59] hover:bg-teal-900 shrink-0 text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> Add User
              </Button>
            </div>
          </div>

          {/* Main Users Table Card */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">ID Prefix</th>
                      <th className="px-6 py-4 font-medium">Full Name</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-slate-400">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                            <span>Loading users...</span>
                          </div>
                        </td>
                      </tr>
                    ) : fetchError ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-red-500">
                          {fetchError}
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-slate-400">
                          No users found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors bg-white">
                          <td className="py-3 px-6 text-slate-600 font-mono text-xs font-semibold" title={user.id}>
                            {formatId(user.id)}
                          </td>
                          <td className="py-3 px-6 text-slate-900 font-semibold">{user.fullName}</td>
                          <td className="py-3 px-6">
                            <Badge 
                              variant={user.role === 'admin' ? 'default' : 'secondary'} 
                              className={user.role === 'admin' 
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100" 
                                : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"}
                            >
                              {user.role === 'admin' ? 'Admin' : 'Faculty'}
                            </Badge>
                          </td>
                          <td className="py-3 px-6 text-slate-500">{user.email}</td>
                          <td className="py-3 px-6">
                            <Badge 
                              variant="outline" 
                              className={user.isActive 
                                ? "border-teal-200 text-teal-700 bg-teal-50" 
                                : "border-slate-200 text-slate-500 bg-slate-50"}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-3 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-500 hover:text-teal-600"
                                onClick={() => handleEditClick(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleToggleClick(user)}
                                className={`h-8 w-8 ${user.isActive ? 'text-teal-600 hover:text-teal-700' : 'text-slate-400 hover:text-slate-500'}`}
                              >
                                {user.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-red-600 transition-colors"
                                onClick={() => handleDeleteClick(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit User Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? "Edit User Details" : "Add New User"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none font-semibold transition-colors focus:outline-none"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-md text-sm text-teal-700 font-medium">
                  {editingUser 
                    ? "User successfully updated!" 
                    : "User successfully created! Default password: 12345678"}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Jane"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Doe"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="jane.doe@university.edu"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Password fields are only shown during Edit mode */}
              {editingUser && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <p className="text-[10px] text-slate-400 italic">Leave blank to keep current</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Confirm Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}

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
                      {editingUser ? "Saving..." : "Creating..."}
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
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${toggleTarget.isActive ? 'bg-orange-50 text-orange-600' : 'bg-teal-50 text-teal-600'}`}>
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {toggleTarget.isActive ? "Deactivate User?" : "Activate User?"}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to set <span className="font-semibold text-slate-700">{toggleTarget.fullName}</span> to 
                <span className={`font-bold ${toggleTarget.isActive ? 'text-orange-600' : 'text-teal-600'}`}> {toggleTarget.isActive ? "Inactive" : "Active"}</span>?
              </p>
              
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setToggleTarget(null)}
                  className="px-4 text-slate-600 border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmToggleStatus}
                  className={toggleTarget.isActive 
                    ? "bg-orange-600 hover:bg-orange-700 text-white px-6" 
                    : "bg-[#115e59] hover:bg-teal-900 text-white px-6"}
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
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-6 text-center">
              {/* Warning Icon */}
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete User?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete <span className="font-semibold text-slate-700">{deleteTarget.fullName}</span>? This action cannot be undone and will remove all associated data.
              </p>
              
              {/* Modal Actions */}
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 text-slate-600 border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-6"
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
