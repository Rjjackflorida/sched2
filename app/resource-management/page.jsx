"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Monitor, Library, Search, Plus, Filter } from "lucide-react"

const roomsData = [
  { id: "R1", name: "SCI-101", building: "Science Wing", capacity: 150, type: "Lecture Hall", status: "Active" },
  { id: "R2", name: "LIB-204", building: "Main Library", capacity: 45, type: "Seminar Room", status: "Active" },
  { id: "R3", name: "TECH-302", building: "Tech Center", capacity: 30, type: "Computer Lab", status: "Active" },
  { id: "R4", name: "HUM-105", building: "Humanities", capacity: 60, type: "Standard Classroom", status: "Maintenance" },
]

export default function ResourceManagementPage() {
  const [activeTab, setActiveTab] = useState("rooms")

  return (
    <AdminLayout title="Resource Management">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Campus Resources</h2>
              <p className="text-slate-500 text-sm">Manage physical locations, room capacities, and resource types.</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab("rooms")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "rooms" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Rooms
              </button>
              <button 
                onClick={() => setActiveTab("courses")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "courses" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Courses Database
              </button>
            </div>
          </div>

          {activeTab === "rooms" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search rooms..." 
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <Button variant="outline" className="text-slate-600 shrink-0">
                    <Filter className="h-4 w-4 mr-2" /> Filter
                  </Button>
                </div>
                <Button className="bg-[#115e59] hover:bg-teal-900 shrink-0">
                  <Plus className="h-4 w-4 mr-2" /> Add Room
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {roomsData.map((room) => {
                  let Icon = MapPin
                  if (room.type === "Computer Lab") Icon = Monitor
                  if (room.type === "Seminar Room") Icon = Library

                  return (
                    <Card key={room.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-slate-100 rounded-md text-slate-600">
                            <Icon className="h-5 w-5" />
                          </div>
                          <Badge variant={room.status === "Active" ? "outline" : "secondary"}
                                 className={room.status === "Active" ? "border-teal-200 text-teal-700 bg-teal-50" : "bg-orange-50 text-orange-700"}>
                            {room.status}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">{room.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">{room.building}</p>
                        
                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                          <span className="text-slate-500">{room.type}</span>
                          <span className="font-semibold text-slate-700">Cap: {room.capacity}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "courses" && (
            <Card>
              <CardContent className="p-12 text-center text-slate-500">
                <Library className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">Course Catalog Database</h3>
                <p>Course management grid will be displayed here.</p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </AdminLayout>
  )
}
