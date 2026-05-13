"use client"

import React, { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Building, MapPin, Users } from "lucide-react"

/**
 * Static mock data for departments.
 * In a real application, this would be fetched from the database.
 */
const initialDepartments = [
  {
    id: "D1",
    name: "Computer Science",
    code: "CS",
    college: "College of Engineering",
    facultyCount: 45,
    location: "Tech Building, 3rd Floor",
  },
  {
    id: "D2",
    name: "Mathematics",
    code: "MATH",
    college: "College of Science",
    facultyCount: 30,
    location: "Science Wing, 2nd Floor",
  },
  {
    id: "D3",
    name: "Mechanical Engineering",
    code: "ME",
    college: "College of Engineering",
    facultyCount: 38,
    location: "Engineering Complex, Hall A",
  },
  {
    id: "D4",
    name: "Physics",
    code: "PHYS",
    college: "College of Science",
    facultyCount: 25,
    location: "Physics Lab, Ground Floor",
  },
  {
    id: "D5",
    name: "Business Administration",
    code: "BA",
    college: "College of Business",
    facultyCount: 50,
    location: "Business Tower, 5th Floor",
  },
]

/**
 * DepartmentManagementPage handles the display and filtering of university departments.
 * It uses a card-based layout instead of a traditional table for better visual separation.
 */
export default function DepartmentManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departments] = useState(initialDepartments);

  /**
   * Filters the department list based on the search query.
   * Searches across name, code, and college.
   */
  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.college.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Department Management">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header Section: Title, Search, and Add Action */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Academic Departments</h2>
              <p className="text-slate-500 text-sm">Organize and manage university departments and their hierarchies.</p>
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
              {/* Add Department Button */}
              <Button className="bg-[#115e59] hover:bg-teal-900 shrink-0 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Department
              </Button>
            </div>
          </div>

          {/* Department Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500">
                No departments found matching "{searchQuery}"
              </div>
            ) : (
              filteredDepartments.map((dept) => (
                <Card key={dept.id} className="group hover:shadow-md transition-shadow border-slate-200 overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div className="bg-teal-100 p-2 rounded-lg text-teal-700">
                        <Building className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="bg-white border-slate-200 text-slate-600">
                        {dept.code}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900 mt-3 group-hover:text-teal-700 transition-colors">
                      {dept.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Department Metadata */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{dept.college}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{dept.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>{dept.facultyCount} Faculty Members</span>
                      </div>
                    </div>

                    {/* Quick Action Footer */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <Button variant="ghost" size="sm" className="text-teal-700 hover:bg-teal-50 font-semibold">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
